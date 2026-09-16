/**
 * Customer API Service — connects customer frontend to Fastify REST API.
 * Adheres to FIND-002 and FIND-023: transforms React BookingState into Fastify Zod contracts.
 */

export function getApiBaseUrl(): string {
  const envUrl = import.meta.env.VITE_API_BASE_URL as string | undefined;
  if (envUrl?.trim()) return envUrl.trim().replace(/\/+$/, "");
  if (typeof window !== "undefined" && window.location.hostname === "localhost") {
    return "http://localhost:4000";
  }
  return "https://api.skbagheltravels.in";
}

export type BackendTripType = "one-way" | "round-trip" | "local-tour" | "airport-transfer";
export type BackendVehicleTier = "sedan" | "ertiga" | "innova-crysta" | "tempo-traveller" | "urbania";

export interface CreateDraftBookingPayload {
  tripType: BackendTripType;
  vehicleTier: BackendVehicleTier;
  originName: string;
  destinationName: string;
  pickupAddress: string;
  dropAddress?: string;
  pickupDatetime: string;
  returnDatetime?: string;
  // distanceKm removed (SEC-005) — server derives from originName/destinationName via fare catalogue
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  flightTrainNumber?: string;
  specialNotes?: string;
  promoCode?: string;
}

export interface CreateDraftBookingResponse {
  bookingId: string;
  ticketId: string;
  guestAccessToken: string;
  status: string;
  fare: {
    totalFare: number;
    advanceAmount: number;
    balanceAmount: number;
    baseFare: number;
    driverAllowance: number;
    nightAllowance: number;
    discountAmount: number;
    promoValid: boolean;
  };
  next: {
    action: string;
    path: string;
  };
}

export interface CreateCheckoutPayload {
  ticketId: string;
  guestAccessToken: string;
  idempotencyKey: string;
  provider?: "razorpay" | "paypal" | "card";
  currency?: "INR" | "USD" | "EUR" | "GBP";
  returnUrl?: string;
  cancelUrl?: string;
}

export interface CreateCheckoutResponse {
  paymentId: string;
  provider: string;
  status: string;
  amountMinor: number;
  currency: string;
  providerOrderId?: string;
  keyId?: string;
  checkoutUrl?: string;
}

export async function createDraftBooking(
  payload: CreateDraftBookingPayload,
): Promise<CreateDraftBookingResponse> {
  const baseUrl = getApiBaseUrl();
  const res = await fetch(`${baseUrl}/api/v1/bookings/draft`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = json?.error?.message || `Failed to create booking draft (status ${res.status})`;
    throw new Error(msg);
  }

  return json.data as CreateDraftBookingResponse;
}

export async function createPaymentCheckout(
  payload: CreateCheckoutPayload,
): Promise<CreateCheckoutResponse> {
  const baseUrl = getApiBaseUrl();
  const res = await fetch(`${baseUrl}/api/v1/payments/create-checkout`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = json?.error?.message || `Failed to initiate payment checkout (status ${res.status})`;
    throw new Error(msg);
  }

  return json.data as CreateCheckoutResponse;
}

/**
 * Maps React VehicleId to Fastify backend vehicleTier
 */
export function mapVehicleTier(vehicleId: string): BackendVehicleTier {
  switch (vehicleId) {
    case "ertiga":
      return "ertiga";
    case "innova":
    case "innova-crysta":
      return "innova-crysta";
    case "tempo":
    case "tempo-12":
    case "tempo-16":
    case "tempo-traveller":
      return "tempo-traveller";
    case "urbania":
      return "urbania";
    case "sedan":
    default:
      return "sedan";
  }
}

export interface CreateInquiryPayload {
  name: string;
  phone: string;
  email?: string;
  message: string;
  tripInterest?: string;
}

export interface CreateInquiryResponse {
  id: string;
}

export function formatInquiryPhone(raw: string): string {
  const cleaned = raw.replace(/[^\d+]/g, "");
  if (/^\+[0-9]{10,14}$/.test(cleaned)) {
    return cleaned;
  }
  const digitsOnly = cleaned.replace(/\D/g, "");
  if (digitsOnly.length === 10) {
    return `+91${digitsOnly}`;
  }
  if (digitsOnly.length >= 10 && digitsOnly.length <= 14) {
    return `+${digitsOnly}`;
  }
  return cleaned || "+919876543210";
}

export function sanitizeInquiryName(raw: string): string {
  const cleaned = raw.replace(/[^a-zA-Z\s.'-]/g, "").trim();
  return cleaned.length >= 2 ? cleaned.slice(0, 80) : "Guest Customer";
}

export async function createInquiry(
  payload: CreateInquiryPayload,
): Promise<CreateInquiryResponse> {
  const baseUrl = getApiBaseUrl();
  const res = await fetch(`${baseUrl}/api/v1/inquiries`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = json?.error?.message || `Failed to submit inquiry (status ${res.status})`;
    throw new Error(msg);
  }

  return json.data as CreateInquiryResponse;
}

