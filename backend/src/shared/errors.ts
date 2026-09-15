export class AppError extends Error {
  readonly code: string;
  readonly statusCode: number;
  readonly details: unknown;

  constructor(
    code: string,
    message: string,
    statusCode = 400,
    details?: unknown,
  ) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

export const Errors = {
  validation: (details?: unknown) =>
    new AppError("VALIDATION_ERROR", "The request failed validation.", 400, details),
  unauthorized: (message = "Authentication is required.") =>
    new AppError("UNAUTHORIZED", message, 401),
  forbidden: (message = "You are not allowed to perform this action.") =>
    new AppError("FORBIDDEN", message, 403),
  notFound: (code: string, message: string) => new AppError(code, message, 404),
  conflict: (code: string, message: string, details?: unknown) =>
    new AppError(code, message, 409, details),
  unprocessable: (code: string, message: string, details?: unknown) =>
    new AppError(code, message, 422, details),
  rateLimited: () =>
    new AppError("RATE_LIMITED", "Too many requests. Please retry shortly.", 429),
  unavailable: (code: string, message: string) => new AppError(code, message, 503),
  internal: (message = "An unexpected error occurred.") =>
    new AppError("INTERNAL_ERROR", message, 500),
};
