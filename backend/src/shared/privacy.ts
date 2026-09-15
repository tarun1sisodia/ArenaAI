import { timingSafeEqual } from "node:crypto";

export function maskPhone(phone: string): string {
  const digits = phone.replace(/[^\d]/g, "");
  if (digits.length < 4) return "****";
  const last2 = digits.slice(-2);
  const prefix = digits.startsWith("91") && digits.length > 10 ? "+91 " : digits.length === 10 ? "+91 " : "";
  const start = digits.startsWith("91") && digits.length > 10 ? digits.slice(2, 4) : digits.slice(0, 2);
  return `${prefix}${start}**** **${last2}`;
}

export function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return "****";
  const first = local.charAt(0);
  return `${first}****@${domain}`;
}

export function last4(phone: string): string {
  const digits = phone.replace(/[^\d]/g, "");
  return digits.slice(-4);
}

/**
 * Secure phone matching:
 * - Only exact match after normalization, no suffix or partial matching
 * - Uses timing-safe comparison to prevent enumeration via timing
 * - Previously allowed last4 matching which is insecure and enables brute force
 */
export function phonesMatch(stored: string, provided: string): boolean {
  const a = stored.replace(/[^\d]/g, "");
  const b = provided.replace(/[^\d]/g, "");
  if (!a || !b) return false;
  // Require full number match, not partial. Normalize by stripping leading 91 if needed
  // but still require exact length match after normalization
  if (a.length !== b.length) {
    // Allow comparison where one has country code 91 and other doesn't, but still full number
    const aNormalized = a.startsWith("91") && a.length === 12 ? a.slice(2) : a;
    const bNormalized = b.startsWith("91") && b.length === 12 ? b.slice(2) : b;
    if (aNormalized.length !== bNormalized.length) return false;
    return timingSafeEqualString(aNormalized, bNormalized);
  }
  return timingSafeEqualString(a, b);
}

export function timingSafeEqualString(a: string, b: string): boolean {
  const left = Buffer.from(a, "utf8");
  const right = Buffer.from(b, "utf8");
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export function redactSecrets(value: string): string {
  return value
    .replace(/(sk_live|sk_test|rzp_live|rzp_test)_[A-Za-z0-9]+/g, "[redacted]")
    .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, "Bearer [redacted]");
}

/**
 * Sanitize free-text fields to prevent XSS and injection
 * Strips HTML tags and trims excessive whitespace
 */
export function sanitizeText(input: string, maxLength: number): string {
  return input
    .replace(/<[^>]*>/g, "") // strip HTML tags
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "") // strip control chars
    .trim()
    .slice(0, maxLength);
}
