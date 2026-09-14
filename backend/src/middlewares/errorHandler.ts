import type { FastifyError, FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { ZodError } from "zod";
import { AppError } from "../shared/errors.js";

export function registerErrorHandler(app: FastifyInstance): void {
  app.setErrorHandler((error: FastifyError | Error, request: FastifyRequest, reply: FastifyReply) => {
    const requestId = request.requestId ?? "unknown";
    const isProduction = process.env.NODE_ENV === "production";

    if (error instanceof ZodError) {
      // Sanitize validation errors - don't leak raw input values that may contain PII
      const sanitizedDetails = error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
        code: issue.code,
      }));
      return reply.status(400).send({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "The request failed validation.",
          requestId,
          details: sanitizedDetails,
        },
      });
    }

    if (error instanceof AppError) {
      // For 500 errors, don't leak internal details in production
      const message = error.statusCode >= 500 && isProduction ? "An unexpected error occurred." : error.message;
      const details = error.statusCode >= 500 && isProduction ? undefined : error.details;
      return reply.status(error.statusCode).send({
        success: false,
        error: {
          code: error.code,
          message,
          requestId,
          details,
        },
      });
    }

    const statusCode = "statusCode" in error && typeof error.statusCode === "number" ? error.statusCode : 500;
    // Log full error internally but don't expose to client
    request.log.error({ err: error, requestId, url: request.url, method: request.method }, "unhandled error");

    return reply.status(statusCode >= 400 ? statusCode : 500).send({
      success: false,
      error: {
        code: statusCode === 429 ? "RATE_LIMITED" : statusCode === 404 ? "NOT_FOUND" : "INTERNAL_ERROR",
        message:
          statusCode === 429
            ? "Too many requests. Please retry shortly."
            : statusCode === 404
              ? "Resource not found."
              : "An unexpected error occurred.",
        requestId,
      },
    });
  });
}

export function sendSuccess<T>(reply: FastifyReply, data: T, status = 200): FastifyReply {
  return reply.status(status).send({ success: true, data });
}
