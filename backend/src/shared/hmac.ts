import { createHmac, timingSafeEqual } from "node:crypto";

export function hmacSha256Hex(secret: string, payload: Buffer | string): string {
  if (!secret) throw new Error("HMAC secret is required");
  return createHmac("sha256", secret).update(payload).digest("hex");
}

export function verifyHmacSha256Hex(
  secret: string,
  payload: Buffer | string,
  signature: string,
): boolean {
  if (!secret || !signature) return false;
  // Prevent timing attacks and length leakage
  try {
    const expected = hmacSha256Hex(secret, payload);
    const left = Buffer.from(expected, "utf8");
    const right = Buffer.from(signature, "utf8");
    if (left.length !== right.length) return false;
    return timingSafeEqual(left, right);
  } catch {
    return false;
  }
}
