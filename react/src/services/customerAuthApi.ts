import type { BookingSelectionPayload, CreateDraftBookingPayload, ServerFareBreakdown } from "./api";
import { getApiBaseUrl } from "./api";

export class CustomerApiError extends Error {
  readonly status: number;
  readonly code: string | null;
  readonly data: unknown;

  constructor(message: string, status: number, code: string | null, data: unknown) {
    super(message);
    this.name = "CustomerApiError";
    this.status = status;
    this.code = code;
    this.data = data;
  }
}

async function apiCall<T>(path: string, options: { method?: string; token?: string; intentSecret?: string; body?: unknown } = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (options.body !== undefined) headers["Content-Type"] = "application/json";
  if (options.token) headers.Authorization = `Bearer ${options.token}`;
  if (options.intentSecret) headers["X-Booking-Intent-Secret"] = options.intentSecret;
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    method: options.method ?? "GET",
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    cache: "no-store",
  });
  const json = await response.json().catch(() => ({})) as { data?: T; error?: { code?: string; message?: string; details?: unknown } };
  if (!response.ok) {
    let errorMsg = json.error?.message || `Request failed (${response.status}).`;
    if (Array.isArray(json.error?.details) && json.error.details.length > 0) {
      const issueDetails = (json.error.details as Array<{ path?: string; message?: string }>)
        .map((issue) => (issue.message ? `${issue.path ? issue.path + ": " : ""}${issue.message}` : ""))
        .filter(Boolean)
        .join("; ");
      if (issueDetails) {
        errorMsg = `${errorMsg} (${issueDetails})`;
      }
    }
    throw new CustomerApiError(errorMsg, response.status, json.error?.code ?? null, json.error?.details);
  }
  return (json.data ?? json) as T;
}

export interface BookingIntentResponse {
  intentId: string;
  resumeSecret?: string;
  expiresAt: string;
  quote: ServerFareBreakdown;
}

export interface IntentSnapshotResponse {
  intentId: string;
  payload: CreateDraftBookingPayload;
  quote: ServerFareBreakdown;
  expiresAt: string;
}

export interface FinalizedBookingResponse {
  booking: { id: string; ticketId: string; status: string };
  fare: ServerFareBreakdown;
  replay: boolean;
}

export interface CustomerBookingSummary {
  bookingId: string;
  ticketId: string;
  status: string;
  tripType: string;
  vehicleTier: string;
  originName: string | null;
  destinationName: string | null;
  bookingSelection: BookingSelectionPayload | null;
  pickupDatetime: string;
  returnDatetime: string | null;
  totalFare: number;
  advanceAmount: number;
  balanceAmount: number;
  createdAt: string;
  paymentStatus?: string | null;
}

export interface CustomerProfile {
  fullName: string | null;
  phone: string | null;
  email: string | null;
}

export interface CustomerBookingDetails {
  id: string;
  ticketId: string;
  status: string;
  tripType: string;
  vehicleTier: string;
  originName: string | null;
  destinationName: string | null;
  bookingSelection: BookingSelectionPayload | null;
  pickupAddress: string;
  dropAddress: string | null;
  pickupDatetime: string;
  returnDatetime: string | null;
  distanceKm: number;
  fare: ServerFareBreakdown;
}

export function getMyProfile(accessToken: string): Promise<CustomerProfile> {
  return apiCall<CustomerProfile>("/api/v1/me/profile", { token: accessToken });
}

export function createBookingIntent(payload: CreateDraftBookingPayload, idempotencyKey: string): Promise<BookingIntentResponse> {
  return apiCall<BookingIntentResponse>("/api/v1/booking-intents", {
    method: "POST",
    body: { ...payload, idempotencyKey },
  });
}

export function getBookingIntent(intentId: string, resumeSecret: string): Promise<IntentSnapshotResponse> {
  return apiCall<IntentSnapshotResponse>(`/api/v1/booking-intents/${encodeURIComponent(intentId)}`, { intentSecret: resumeSecret });
}

export function finalizeBookingIntent(intentId: string, resumeSecret: string, accessToken: string, acceptUpdatedFare = false): Promise<FinalizedBookingResponse> {
  return apiCall<FinalizedBookingResponse>(`/api/v1/booking-intents/${encodeURIComponent(intentId)}/finalize`, {
    method: "POST",
    token: accessToken,
    intentSecret: resumeSecret,
    body: { acceptUpdatedFare },
  });
}

export function listMyBookings(accessToken: string, page = 1): Promise<{ items: CustomerBookingSummary[]; total: number; page: number; pageSize: number }> {
  return apiCall<{ items: Array<Record<string, unknown>>; total: number; page: number; pageSize: number }>(`/api/v1/me/bookings?page=${page}&pageSize=20`, { token: accessToken }).then((result) => ({
    ...result,
    items: result.items.map((row) => {
      const fare = (row.fare ?? {}) as Record<string, unknown>;
      return {
        bookingId: String(row.id ?? row.bookingId ?? ""),
        ticketId: String(row.ticketId ?? ""),
        status: String(row.status ?? "unknown"),
        tripType: String(row.tripType ?? ""),
        vehicleTier: String(row.vehicleTier ?? ""),
        originName: typeof row.originName === "string" ? row.originName : null,
        destinationName: typeof row.destinationName === "string" ? row.destinationName : null,
        bookingSelection: row.bookingSelection && typeof row.bookingSelection === "object"
          ? row.bookingSelection as BookingSelectionPayload
          : null,
        pickupDatetime: String(row.pickupDatetime ?? ""),
        returnDatetime: typeof row.returnDatetime === "string" ? row.returnDatetime : null,
        totalFare: Number(fare.totalFare ?? row.totalFare ?? 0),
        advanceAmount: Number(fare.advanceAmount ?? row.advanceAmount ?? 0),
        balanceAmount: Number(fare.balanceAmount ?? row.balanceAmount ?? 0),
        createdAt: String(row.createdAt ?? ""),
        paymentStatus: typeof row.paymentStatus === "string" ? row.paymentStatus : null,
      };
    }),
  }));
}

export function getMyBooking(bookingId: string, accessToken: string): Promise<CustomerBookingDetails> {
  return apiCall<CustomerBookingDetails>(`/api/v1/me/bookings/${encodeURIComponent(bookingId)}`, { token: accessToken });
}

export interface PaymentCheckoutResponse {
  paymentId: string;
  providerOrderId?: string;
  checkoutUrl?: string | null;
  publicClientToken?: string | null;
  keyId?: string | null;
  amountMinor: number;
  currency: string;
  status: string;
}

export function createOwnerPaymentCheckout(ticketId: string, accessToken: string, idempotencyKey: string): Promise<PaymentCheckoutResponse> {
  return apiCall<PaymentCheckoutResponse>("/api/v1/payments/create-checkout", {
    method: "POST",
    token: accessToken,
    body: { ticketId, idempotencyKey, returnUrl: `${window.location.origin}/payment/resume/`, cancelUrl: `${window.location.origin}/my-bookings/` },
  });
}

export interface PaymentStatusResponse {
  paymentId: string;
  ticketId: string;
  status: string;
  reconciliationStatus: string;
  provider: string;
  currency: string;
  amountMinor: number;
  bookingStatus: string;
}

export function getOwnerPaymentStatus(paymentId: string, accessToken: string): Promise<PaymentStatusResponse> {
  return apiCall<PaymentStatusResponse>(`/api/v1/payments/${encodeURIComponent(paymentId)}/status`, { token: accessToken });
}
