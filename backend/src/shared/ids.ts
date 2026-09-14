import { createHash, randomBytes, randomInt, timingSafeEqual } from "node:crypto";
import { formatIstYmd, type Clock } from "./clock.js";

export function newId(): string {
  return crypto.randomUUID();
}

export function newGuestAccessToken(): string {
  return randomBytes(32).toString("hex");
}

export function newTicketId(clock: Clock, sequence?: number): string {
  const ymd = formatIstYmd(clock.now()).replaceAll("-", "");
  const suffix =
    sequence !== undefined
      ? String(sequence).padStart(4, "0")
      : String(randomInt(0, 10_000)).padStart(4, "0");
  return `AGR-${ymd}-${suffix}`;
}

export const TICKET_ID_PATTERN = /^AGR-[0-9]{8}-[0-9]{4}$/;

export function sha256Hex(value: string | Buffer): string {
  return createHash("sha256").update(value).digest("hex");
}

export function timingSafeEqualString(a: string, b: string): boolean {
  const left = Buffer.from(a, "utf8");
  const right = Buffer.from(b, "utf8");
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}
