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

export function phonesMatch(stored: string, provided: string): boolean {
  const a = stored.replace(/[^\d]/g, "");
  const b = provided.replace(/[^\d]/g, "");
  if (!a || !b) return false;
  if (a === b) return true;
  if (b.length === 4) return a.endsWith(b);
  if (a.endsWith(b) || b.endsWith(a)) return true;
  return false;
}

export function redactSecrets(value: string): string {
  return value
    .replace(/(sk_live|sk_test|rzp_live|rzp_test)_[A-Za-z0-9]+/g, "[redacted]")
    .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, "Bearer [redacted]");
}
