import type { FastifyError, FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { ZodError } from "zod";
import { AppError } from "../shared/errors.js";

export function registerErrorHandler(app: FastifyInstance): void {
  app.setErrorHandler((error: FastifyError | Error, request: FastifyRequest, reply: FastifyReply) => {
    const requestId = request.requestId ?? "unknown";

    if (error instanceof ZodError) {
      return reply.status(400).send({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "The request failed validation.",
          requestId,
          details: error.issues.map((issue) => ({
            path: issue.path.join("."),
            message: issue.message,
          })),
        },
      });
    }

    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({
        success: false,
        error: {
          code: error.code,
          message: error.message,
          requestId,
          details: error.details,
        },
      });
    }

    const statusCode = "statusCode" in error && typeof error.statusCode === "number" ? error.statusCode : 500;
    request.log.error({ err: error, requestId }, "unhandled error");
    return reply.status(statusCode >= 400 ? statusCode : 500).send({
      success: false,
      error: {
        code: statusCode === 429 ? "RATE_LIMITED" : "INTERNAL_ERROR",
        message: statusCode === 429 ? "Too many requests. Please retry shortly." : "An unexpected error occurred.",
        requestId,
      },
    });
  });
}

export function sendSuccess<T>(reply: FastifyReply, data: T, status = 200): FastifyReply {
  return reply.status(status).send({ success: true, data });
}
