const PENDING_INTENT_KEY = "arenaai:pending-booking-intent";
const PAYMENT_RESUME_KEY = "arenaai:payment-resume";

export interface PendingBookingIntent {
  intentId: string;
  resumeSecret: string;
  idempotencyKey: string;
  createdAt: number;
}

export interface PaymentResumeReference {
  bookingId: string;
  ticketId: string;
  idempotencyKey: string;
  createdAt: number;
}

function read<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : null;
  } catch {
    return null;
  }
}

export function storePendingBookingIntent(value: Omit<PendingBookingIntent, "createdAt">): void {
  try {
    window.sessionStorage.setItem(PENDING_INTENT_KEY, JSON.stringify({ ...value, createdAt: Date.now() }));
  } catch {
    throw new Error("This browser could not safely save the temporary booking continuation. Please allow session storage and try again.");
  }
}

export function getPendingBookingIntent(): PendingBookingIntent | null {
  const value = read<PendingBookingIntent>(PENDING_INTENT_KEY);
  if (!value || typeof value.intentId !== "string" || typeof value.resumeSecret !== "string" || typeof value.idempotencyKey !== "string" || Date.now() - value.createdAt > 30 * 60 * 1000) {
    clearPendingBookingIntent();
    return null;
  }
  return value;
}

export function clearPendingBookingIntent(): void {
  try { window.sessionStorage.removeItem(PENDING_INTENT_KEY); } catch { /* best effort */ }
}

export function storePaymentResumeReference(value: Omit<PaymentResumeReference, "createdAt">): void {
  try {
    window.sessionStorage.setItem(PAYMENT_RESUME_KEY, JSON.stringify({ ...value, createdAt: Date.now() }));
  } catch {
    throw new Error("This browser could not save the payment continuation. Open My Bookings to continue.");
  }
}

export function getPaymentResumeReference(): PaymentResumeReference | null {
  const value = read<PaymentResumeReference>(PAYMENT_RESUME_KEY);
  if (!value || typeof value.bookingId !== "string" || typeof value.ticketId !== "string" || typeof value.idempotencyKey !== "string" || Date.now() - value.createdAt > 24 * 60 * 60 * 1000) {
    clearPaymentResumeReference();
    return null;
  }
  return value;
}

export function clearPaymentResumeReference(): void {
  try { window.sessionStorage.removeItem(PAYMENT_RESUME_KEY); } catch { /* best effort */ }
}
