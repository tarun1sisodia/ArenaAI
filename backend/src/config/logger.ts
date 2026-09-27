import pino, { type Logger } from "pino";
import type { Env } from "./env.js";

const SECRET_KEYS = [
  "authorization",
  "cookie",
  "token",
  "secret",
  "signature",
  "password",
  "key",
  "phone",
  "email",
  "customerPhone",
  "customerEmail",
  "razorpay_signature",
  "guestAccessToken",
  "guest_access_token",
  "idempotencyKey",
  "idempotency_key",
  "providerOrderId",
  "providerPaymentId",
  "x-razorpay-signature",
];

function redactPaths(): string[] {
  const paths = [
    "req.headers.authorization",
    "req.headers.cookie",
    "req.headers[\"x-razorpay-signature\"]",
    "req.headers[\"x-booking-token\"]",
  ];
  for (const key of SECRET_KEYS) {
    paths.push(key, `*.${key}`, `*.*.${key}`, `*.*.*.${key}`, `body.${key}`, `payload.${key}`);
  }
  return paths;
}

export function createLogger(env: Env): Logger {
  return pino({
    level: env.LOG_LEVEL,
    redact: {
      paths: redactPaths(),
      censor: "[redacted]",
      remove: false,
    },
    transport:
      env.NODE_ENV === "development" && env.LOG_LEVEL !== "silent"
        ? { target: "pino-pretty", options: { colorize: true, translateTime: "SYS:standard" } }
        : undefined,
  });
}
