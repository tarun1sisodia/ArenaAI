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
];

function redactPaths(): string[] {
  const paths = ["req.headers.authorization", "req.headers.cookie"];
  for (const key of SECRET_KEYS) {
    paths.push(key, `*.${key}`, `*.*.${key}`);
  }
  return paths;
}

export function createLogger(env: Env): Logger {
  return pino({
    level: env.LOG_LEVEL,
    redact: {
      paths: redactPaths(),
      censor: "[redacted]",
    },
    transport:
      env.NODE_ENV === "development" && env.LOG_LEVEL !== "silent"
        ? { target: "pino-pretty", options: { colorize: true, translateTime: "SYS:standard" } }
        : undefined,
  });
}
