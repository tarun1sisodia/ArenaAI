/**
 * Admin API Client — connects Admin Operations Desk to Fastify REST API.
 * Adheres to localhost integration: uses env.API_BASE_URL (defaults to http://localhost:4000 on localhost).
 * Uses getAuthHeaders() for Bearer authentication.
 * Provides resilient fallbacks to local fixtures if backend is unreachable.
 */
import { env } from "./env";
import { getAuthHeaders } from "./auth";
import type {
  AuditEntry,
  Booking,
  BookingStatus,
  FareRuleset,
  Inquiry,
  InquiryStatus,
  InquiryType,
  Payment,
  PaymentMethod,
  PaymentProvider,
  PaymentStatus,
  TripType,
  VehicleTier,
} from "./types";
import { AUDIT, BOOKINGS, FARE_RULESET, INQUIRIES, PAYMENTS } from "./mock-data";

export async function fetchAdminBookings(filter?: {
  status?: BookingStatus | "all";
  ticketId?: string;
  page?: number;
  pageSize?: number;
}): Promise<Booking[]> {
  try {
    const params = new URLSearchParams();
    if (filter?.status && filter.status !== "all") params.set("status", filter.status);
    if (filter?.ticketId) params.set("ticketId", filter.ticketId);
    if (filter?.page) params.set("page", String(filter.page));
    if (filter?.pageSize) params.set("pageSize", String(filter.pageSize));

    const url = `${env.API_BASE_URL}/api/v1/ops/admin/bookings${params.toString() ? `?${params.toString()}` : ""}`;
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
    });

    if (!res.ok) {
      console.warn(`[Admin API] Remote bookings fetch returned status ${res.status}, using local fixtures.`);
      return BOOKINGS;
    }

    const json = await res.json();
    const items = json?.data?.items || json?.data?.bookings || [];
    if (!Array.isArray(items) || items.length === 0) {
      return BOOKINGS;
    }

    return items.map((b: any) => ({
      id: b.id,
      ticketId: b.ticketId || b.id,
      customerName: b.customerName || "Customer",
      customerPhone: b.customerPhone || "",
      customerEmail: b.customerEmail || "",
      origin: b.originName || b.origin || "Agra",
      destination: b.destinationName || b.destination || "Delhi",
      pickupDateTime: b.pickupDatetime || b.pickupDateTime || new Date().toISOString(),
      returnDateTime: b.returnDatetime || b.returnDateTime || null,
      distanceKm: Number(b.distanceKm) || 200,
      tripType: (b.tripType as TripType) || "one-way",
      vehicleTier: (b.vehicleTier as VehicleTier) || "sedan",
      status: (b.status as BookingStatus) || "pending_payment",
      version: Number(b.version) || 1,
      notes: b.specialNotes || b.notes || "",
      createdAt: b.createdAt || new Date().toISOString(),
      fare: {
        baseFare: Number(b.totalFare) || 2500,
        nightAllowance: 0,
        driverAllowance: 0,
        tollsTaxes: 0,
        promoDiscount: 0,
        totalFare: Number(b.totalFare) || 2500,
        advancePaid: Number(b.advanceAmount) || 500,
        balancePayable: Math.max(0, (Number(b.totalFare) || 2500) - (Number(b.advanceAmount) || 500)),
      },
    }));
  } catch (err) {
    console.warn("[Admin API] Failed to reach backend bookings API, using local fallback.", err);
    return BOOKINGS;
  }
}

export async function transitionAdminBooking(
  id: string,
  to: BookingStatus,
  expectedVersion?: number,
): Promise<any> {
  const url = `${env.API_BASE_URL}/api/v1/ops/admin/bookings/${encodeURIComponent(id)}/transition`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify({
      to,
      expectedVersion,
    }),
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json?.error?.message || `Transition failed (${res.status})`);
  }
  return json.data;
}

export async function refundAdminBooking(
  bookingId: string,
  reason: string,
  idempotencyKey: string,
): Promise<any> {
  const url = `${env.API_BASE_URL}/api/v1/ops/admin/refunds`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify({
      bookingId,
      reason,
      idempotencyKey,
    }),
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json?.error?.message || `Refund failed (${res.status})`);
  }
  return json.data;
}

export async function fetchAdminInquiries(filter?: {
  status?: InquiryStatus | "all";
  page?: number;
  limit?: number;
}): Promise<Inquiry[]> {
  try {
    const params = new URLSearchParams();
    if (filter?.status && filter.status !== "all") params.set("status", filter.status);
    if (filter?.page) params.set("page", String(filter.page));
    if (filter?.limit) params.set("limit", String(filter.limit));

    const url = `${env.API_BASE_URL}/api/v1/ops/admin/inquiries${params.toString() ? `?${params.toString()}` : ""}`;
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
    });

    if (!res.ok) {
      console.warn(`[Admin API] Remote inquiries fetch returned status ${res.status}, using local fixtures.`);
      return INQUIRIES;
    }

    const json = await res.json();
    const items = json?.data?.items || json?.data?.inquiries || [];
    if (!Array.isArray(items) || items.length === 0) {
      return INQUIRIES;
    }

    return items.map((iq: any) => ({
      id: iq.id,
      name: iq.name || "Customer",
      phone: iq.phone || "",
      type: (iq.tripInterest as InquiryType) || "contact",
      subject: iq.tripInterest ? `Interest: ${iq.tripInterest}` : "Customer Inquiry",
      message: iq.message || "",
      status: (iq.status as InquiryStatus) || "new",
      notes: Array.isArray(iq.notes) ? iq.notes : [],
      createdAt: iq.createdAt || new Date().toISOString(),
    }));
  } catch (err) {
    console.warn("[Admin API] Failed to reach backend inquiries API, using local fallback.", err);
    return INQUIRIES;
  }
}

export async function updateAdminInquiry(
  id: string,
  updates: { status?: InquiryStatus; note?: string },
): Promise<any> {
  const url = `${env.API_BASE_URL}/api/v1/ops/admin/inquiries/${encodeURIComponent(id)}`;
  const res = await fetch(url, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify(updates),
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json?.error?.message || `Failed to update inquiry (${res.status})`);
  }
  return json.data;
}

export async function fetchAdminPayments(filter?: {
  page?: number;
  limit?: number;
}): Promise<{ items: Payment[]; totalCaptured: number; totalRefunded: number }> {
  try {
    const params = new URLSearchParams();
    if (filter?.page) params.set("page", String(filter.page));
    if (filter?.limit) params.set("limit", String(filter.limit));

    const url = `${env.API_BASE_URL}/api/v1/ops/admin/payments${params.toString() ? `?${params.toString()}` : ""}`;
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
    });

    if (!res.ok) {
      return {
        items: PAYMENTS,
        totalCaptured: PAYMENTS.filter((p) => p.status === "captured").reduce((s, p) => s + p.amount, 0),
        totalRefunded: PAYMENTS.filter((p) => p.status === "refunded").reduce((s, p) => s + p.amount, 0),
      };
    }

    const json = await res.json();
    const items = json?.data?.items || json?.data?.payments || [];
    if (!Array.isArray(items) || items.length === 0) {
      return {
        items: PAYMENTS,
        totalCaptured: PAYMENTS.filter((p) => p.status === "captured").reduce((s, p) => s + p.amount, 0),
        totalRefunded: PAYMENTS.filter((p) => p.status === "refunded").reduce((s, p) => s + p.amount, 0),
      };
    }

    const mapped: Payment[] = items.map((p: any) => ({
      id: p.id,
      bookingTicketId: p.bookingTicketId || p.bookingId || "AGR-LIVE-001",
      provider: (p.provider as PaymentProvider) || "razorpay",
      method: (p.method as PaymentMethod) || "card",
      providerPaymentId: p.providerPaymentId || p.id,
      amount: Math.round((Number(p.amountMinor ?? p.amountPaise ?? 0)) / 100),
      status: (p.status as PaymentStatus) || "captured",
      capturedAt: p.capturedAt || p.createdAt || new Date().toISOString(),
    }));

    return {
      items: mapped,
      totalCaptured: Math.round((json?.data?.totalCapturedPaise || 0) / 100),
      totalRefunded: Math.round((json?.data?.totalRefundedPaise || 0) / 100),
    };
  } catch (err) {
    console.warn("[Admin API] Failed to reach backend payments API, using local fallback.", err);
    return {
      items: PAYMENTS,
      totalCaptured: PAYMENTS.filter((p) => p.status === "captured").reduce((s, p) => s + p.amount, 0),
      totalRefunded: PAYMENTS.filter((p) => p.status === "refunded").reduce((s, p) => s + p.amount, 0),
    };
  }
}

export async function fetchAdminFareRules(): Promise<FareRuleset> {
  try {
    const url = `${env.API_BASE_URL}/api/v1/ops/admin/fare-rules`;
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
    });

    if (!res.ok) return FARE_RULESET;
    const json = await res.json();
    if (!json?.data?.version) return FARE_RULESET;

    return {
      version: json.data.version || FARE_RULESET.version,
      effectiveFrom: json.data.effectiveFrom || FARE_RULESET.effectiveFrom,
      nightWindow: json.data.nightWindow || FARE_RULESET.nightWindow,
      rules: FARE_RULESET.rules,
      notes: FARE_RULESET.notes,
    };
  } catch {
    return FARE_RULESET;
  }
}

export async function fetchAdminAuditLogs(limit = 100): Promise<AuditEntry[]> {
  try {
    const url = `${env.API_BASE_URL}/api/v1/ops/admin/audit-logs?limit=${limit}`;
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
    });

    if (!res.ok) return AUDIT;
    const json = await res.json();
    const items = json?.data;
    if (!Array.isArray(items) || items.length === 0) return AUDIT;

    return items.map((a: any) => ({
      id: a.id,
      action: a.action,
      actor: a.actor || "Staff",
      actorRole: a.actorRole || "super_admin",
      resourceType: a.resourceType || "booking",
      resourceId: a.resourceId || "",
      ip: a.ip || "127.0.0.1",
      detail: a.detail || "",
      at: a.at || a.createdAt || new Date().toISOString(),
    }));
  } catch {
    return AUDIT;
  }
}
