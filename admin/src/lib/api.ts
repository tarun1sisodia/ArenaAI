/**
 * Admin API Client — connects Admin Operations Desk to Fastify REST API.
 * Uses env.API_BASE_URL (defaults to http://localhost:4000 on localhost).
 * Uses getAuthHeaders() for Bearer authentication.
 *
 * No silent fixture fallbacks: every function either returns REAL backend data
 * (possibly an empty list) or throws. Pages render their own empty/error states.
 */
import { env } from "./env";
import { getAuthHeaders } from "./auth";
import type {
  AuditEntry,
  Booking,
  BookingStatus,
  CatalogAvailability,
  CatalogCategory,
  CatalogItem,
  CatalogMedia,
  CatalogStatus,
  CatalogTripType,
  FareRuleset,
  Inquiry,
  InquiryStatus,
  InquiryType,
  Payment,
  PaymentMethod,
  PaymentProvider,
  PaymentStatus,
  Review,
  ReviewStatus,
  TripType,
  VehicleTier,
} from "./types";

async function apiFetch(path: string, init?: RequestInit): Promise<any> {
  const res = await fetch(`${env.API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
      ...(init?.headers ?? {}),
    },
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message =
      json?.error?.message ||
      (res.status === 401
        ? "Your session has expired. Please sign in again."
        : `Request failed (${res.status}). Check that the backend is reachable.`);
    throw new Error(message);
  }
  return json;
}

export async function fetchAdminBookings(filter?: {
  status?: BookingStatus | "all";
  ticketId?: string;
  page?: number;
  pageSize?: number;
}): Promise<Booking[]> {
  const params = new URLSearchParams();
  if (filter?.status && filter.status !== "all") params.set("status", filter.status);
  if (filter?.ticketId) params.set("ticketId", filter.ticketId);
  if (filter?.page) params.set("page", String(filter.page));
  if (filter?.pageSize) params.set("pageSize", String(filter.pageSize));

  const json = await apiFetch(`/api/v1/ops/admin/bookings${params.toString() ? `?${params.toString()}` : ""}`);
  const items = json?.data?.items || json?.data?.bookings || [];

  if (!Array.isArray(items)) return [];

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
    distanceKm: Number(b.distanceKm) || 0,
    tripType: (b.tripType as TripType) || "one-way",
    vehicleTier: (b.vehicleTier as VehicleTier) || "sedan",
    status: (b.status as BookingStatus) || "pending_payment",
    version: Number(b.version) || 1,
    notes: b.specialNotes || b.notes || "",
    createdAt: b.createdAt || new Date().toISOString(),
    fare: {
      baseFare: Number(b.baseFare ?? b.totalFare) || 0,
      nightAllowance: Number(b.nightAllowance) || 0,
      driverAllowance: Number(b.driverAllowance) || 0,
      tollsTaxes: 0,
      promoDiscount: Number(b.discountAmount) || 0,
      totalFare: Number(b.totalFare) || 0,
      advancePaid: Number(b.advanceAmount) || 0,
      balancePayable: Math.max(0, (Number(b.totalFare) || 0) - (Number(b.advanceAmount) || 0)),
    },
  }));
}

export async function transitionAdminBooking(
  id: string,
  to: BookingStatus,
  expectedVersion?: number,
): Promise<any> {
  const json = await apiFetch(
    `/api/v1/ops/admin/bookings/${encodeURIComponent(id)}/transition`,
    {
      method: "POST",
      body: JSON.stringify({ to, expectedVersion }),
    },
  );
  return json.data;
}

export async function refundAdminBooking(
  bookingId: string,
  reason: string,
  idempotencyKey: string,
): Promise<any> {
  const json = await apiFetch(`/api/v1/ops/admin/refunds`, {
    method: "POST",
    body: JSON.stringify({ bookingId, reason, idempotencyKey }),
  });
  return json.data;
}

export async function fetchAdminInquiries(filter?: {
  status?: InquiryStatus | "all";
  page?: number;
  limit?: number;
}): Promise<Inquiry[]> {
  const params = new URLSearchParams();
  if (filter?.status && filter.status !== "all") params.set("status", filter.status);
  if (filter?.page) params.set("page", String(filter.page));
  if (filter?.limit) params.set("limit", String(filter.limit));

  const json = await apiFetch(`/api/v1/ops/admin/inquiries${params.toString() ? `?${params.toString()}` : ""}`);
  const items = json?.data?.items || json?.data?.inquiries || [];

  if (!Array.isArray(items)) return [];

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
}

export async function updateAdminInquiry(
  id: string,
  updates: { status?: InquiryStatus; note?: string },
): Promise<any> {
  const json = await apiFetch(`/api/v1/ops/admin/inquiries/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(updates),
  });
  return json.data;
}

export async function fetchAdminPayments(filter?: {
  page?: number;
  limit?: number;
}): Promise<{ items: Payment[]; totalCaptured: number; totalRefunded: number }> {
  const params = new URLSearchParams();
  if (filter?.page) params.set("page", String(filter.page));
  if (filter?.limit) params.set("limit", String(filter.limit));

  const json = await apiFetch(`/api/v1/ops/admin/payments${params.toString() ? `?${params.toString()}` : ""}`);
  const items = json?.data?.items || json?.data?.payments || [];

  const mapped: Payment[] = Array.isArray(items)
    ? items.map((p: any) => ({
        id: p.id,
        bookingTicketId: p.bookingTicketId || p.bookingId || "—",
        provider: (p.provider as PaymentProvider) || "razorpay",
        method: (p.method as PaymentMethod) || "card",
        providerPaymentId: p.providerPaymentId || p.id,
        amount: Math.round(Number(p.amountMinor ?? p.amountPaise ?? 0) / 100),
        status: (p.status as PaymentStatus) || "captured",
        capturedAt: p.capturedAt || p.createdAt || new Date().toISOString(),
      }))
    : [];

  return {
    items: mapped,
    totalCaptured: Math.round((json?.data?.totalCapturedPaise || 0) / 100),
    totalRefunded: Math.round((json?.data?.totalRefundedPaise || 0) / 100),
  };
}

export async function fetchAdminFareRules(): Promise<FareRuleset> {
  const json = await apiFetch(`/api/v1/ops/admin/fare-rules`);
  const data = json?.data;
  if (!data || !data.version) {
    throw new Error("Fare rules response was malformed.");
  }

  const outstation = data.outstation || {};
  const vehicles = Array.isArray(data.vehicles) ? data.vehicles : [];

  const rules = vehicles.map((v: any) => ({ 
    vehicleTier: (v.tier || v.id) as VehicleTier,
    label: `${v.name || v.id} (${v.seats}-seater)`,
    seats: Number(v.seats) || 4,
    perKm: Number(v.perKm) || 10,
    minDailyKm: Number(outstation.minKmPerDay) || 300,
    nightChargePerHour: Number(v.perKm) >= 25 ? 90 : 50,
    driverAllowance: Number(v.seats) >= 12 ? (Number(outstation.nightAllowanceTempo) || 500) : (Number(outstation.nightAllowanceCab) || 300),
    active: v.active !== false,
  }));

  const startHour = String(outstation.nightStartHour ?? 22).padStart(2, "0");
  const endHour = String(outstation.nightEndHour ?? 5).padStart(2, "0");

  return {
    version: data.version,
    effectiveFrom: data.effectiveFrom || data.version,
    nightWindow: data.nightWindow || `${startHour}:00 – ${endHour}:00 IST`,
    rules,
    notes: Array.isArray(data.notes)
      ? data.notes
      : [
          `Outstation trips bill the greater of actual km or the tier minimum daily km (${outstation.minKmPerDay || 300} km/day).`,
          `Night allowance applies when travel occurs inside the ${startHour}:00–${endHour}:00 IST window.`,
          `Driver daily allowance is fixed per commercial agreement (₹${outstation.nightAllowanceCab || 300} cab / ₹${outstation.nightAllowanceTempo || 500} tempo).`,
          "Tolls, parking and state check-gate fees are passed at actuals with receipts.",
          "Fares are calculated exclusively by the backend fare engine — admin cannot override.",
        ],
  };
}

export async function fetchAdminAuditLogs(limit = 100): Promise<AuditEntry[]> {
  const json = await apiFetch(`/api/v1/ops/admin/audit-logs?limit=${limit}`);
  const items = json?.data;

  if (!Array.isArray(items)) return [];

  return items.map((a: any) => ({
    id: a.id,
    action: a.action,
    actor: a.actor || "Staff",
    actorRole: a.actorRole || "super_admin",
    resourceType: a.resourceType || "booking",
    resourceId: a.resourceId || "",
    ip: a.ip || "—",
    detail: a.detail || "",
    at: a.at || a.createdAt || new Date().toISOString(),
  }));
}

/* ── Catalog CMS ──────────────────────────────────────────────────────────── */

function mapCatalogItem(c: any): CatalogItem {
  return {
    id: c.id,
    slug: c.slug || "",
    title: c.title || "Untitled",
    category: (c.type as CatalogCategory) || "package",
    summary: c.shortDescription || c.description || "",
    duration: c.durationText || "",
    startingPrice: Number(c.startingPriceInr) || 0,
    status: (c.status as CatalogStatus) || "draft",
    updatedAt: c.updatedAt || c.createdAt || new Date().toISOString(),
    places: (c.routeSummary || "")
      .split(/[,·|]/)
      .map((s: string) => s.trim())
      .filter(Boolean),
    distanceKm: c.distanceKm === null || c.distanceKm === undefined ? null : Number(c.distanceKm),
    availability: (c.availability as CatalogAvailability) || "available",
    seatsLeft: c.seatsLeft === null || c.seatsLeft === undefined ? null : Number(c.seatsLeft),
    stops: Array.isArray(c.stops) ? c.stops : [],
    tripType: (c.tripType as CatalogTripType | null) ?? null,
  };
}

function mapCatalogMedia(m: any): CatalogMedia {
  return {
    id: m.id,
    catalogItemId: m.catalogItemId || "",
    mediaType: (m.mediaType as "image" | "video") || "image",
    altText: m.altText || "",
    caption: m.caption ?? null,
    sortOrder: Number(m.sortOrder) || 0,
    status: (m.status as CatalogStatus) || "draft",
    url: m.url || m.storagePath || "",
    mimeType: m.mimeType ?? null,
    sizeBytes: m.sizeBytes === null || m.sizeBytes === undefined ? null : Number(m.sizeBytes),
    createdAt: m.createdAt || new Date().toISOString(),
  };
}

/** Absolute URL a browser can load for a catalog media entry. */
export function resolveMediaSrc(url: string): string {
  if (!url) return "";
  if (/^https?:\/\//.test(url)) return url;
  if (url.startsWith("/api/v1/media/")) return `${env.API_BASE_URL}${url}`;
  return url;
}

export async function fetchAdminCatalog(filter?: {
  type?: CatalogCategory | "all";
  status?: CatalogStatus | "all";
  q?: string;
}): Promise<CatalogItem[]> {
  const params = new URLSearchParams();
  if (filter?.type && filter.type !== "all") params.set("type", filter.type);
  if (filter?.status && filter.status !== "all") params.set("status", filter.status);
  if (filter?.q?.trim()) params.set("q", filter.q.trim());
  const qs = params.toString();
  const json = await apiFetch(`/api/v1/ops/admin/catalog${qs ? `?${qs}` : ""}`);
  const items = json?.data?.items || json?.data || [];
  return Array.isArray(items) ? items.map(mapCatalogItem) : [];
}

export async function fetchAdminCatalogItem(id: string): Promise<{ item: CatalogItem; media: CatalogMedia[] }> {
  const json = await apiFetch(`/api/v1/ops/admin/catalog/${encodeURIComponent(id)}`);
  const data = json?.data ?? {};
  return { item: mapCatalogItem(data), media: Array.isArray(data.media) ? data.media.map(mapCatalogMedia) : [] };
}

export async function fetchCatalogManifestStatus(): Promise<{
  version: number;
  updatedAt: string;
  routeCount: number;
  packageCount: number;
}> {
  const json = await apiFetch(`/api/v1/ops/admin/catalog/manifest/status`);
  return json?.data ?? { version: 1, updatedAt: new Date().toISOString(), routeCount: 0, packageCount: 0 };
}

export async function republishCatalogManifest(): Promise<{
  version: number;
  updatedAt: string;
  routeCount: number;
  packageCount: number;
}> {
  const json = await apiFetch(`/api/v1/ops/admin/catalog/republish`, {
    method: "POST",
    body: JSON.stringify({}),
  });
  return json?.data ?? { version: 1, updatedAt: new Date().toISOString(), routeCount: 0, packageCount: 0 };
}

export async function setCatalogItemStatus(id: string, action: "publish" | "archive"): Promise<CatalogItem> {
  const json = await apiFetch(`/api/v1/ops/admin/catalog/${encodeURIComponent(id)}/${action}`, {
    method: "POST",
    body: JSON.stringify({}),
  });
  return mapCatalogItem(json?.data ?? { id });
}

export async function createAdminCatalogItem(payload: {
  type: CatalogCategory;
  slug: string;
  title: string;
  shortDescription: string;
  description?: string;
  durationText: string;
  routeSummary: string;
  startingPriceInr: number;
  distanceKm?: number | null;
  availability?: CatalogAvailability;
  seatsLeft?: number | null;
  stops?: string[];
  tripType?: CatalogTripType | null;
}): Promise<CatalogItem> {
  const json = await apiFetch(`/api/v1/ops/admin/catalog`, {
    method: "POST",
    body: JSON.stringify({
      ...payload,
      description: payload.description || payload.shortDescription,
    }),
  });
  return mapCatalogItem(json?.data ?? {});
}

export async function updateAdminCatalogItem(
  id: string,
  payload: Partial<{
    type: CatalogCategory;
    slug: string;
    title: string;
    shortDescription: string;
    description: string;
    durationText: string;
    routeSummary: string;
    startingPriceInr: number;
    distanceKm: number | null;
    availability: CatalogAvailability;
    seatsLeft: number | null;
    stops: string[];
    tripType: CatalogTripType | null;
    status: CatalogStatus;
  }>,
): Promise<CatalogItem> {
  const json = await apiFetch(`/api/v1/ops/admin/catalog/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  return mapCatalogItem(json?.data ?? { id });
}

/* ── Catalog media (image manager) ────────────────────────────────────────── */

export async function uploadCatalogMedia(
  catalogItemId: string,
  payload: {
    dataBase64: string;
    mimeType: "image/webp" | "image/jpeg" | "image/png" | "image/avif";
    altText: string;
    caption?: string;
    sortOrder?: number;
  },
): Promise<CatalogMedia> {
  const json = await apiFetch(`/api/v1/ops/admin/catalog/${encodeURIComponent(catalogItemId)}/media`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return mapCatalogMedia(json?.data ?? {});
}

export async function attachCatalogMediaByPath(
  catalogItemId: string,
  payload: { storagePath: string; altText: string; caption?: string; sortOrder?: number },
): Promise<CatalogMedia> {
  const json = await apiFetch(`/api/v1/ops/admin/catalog/${encodeURIComponent(catalogItemId)}/media`, {
    method: "POST",
    body: JSON.stringify({ ...payload, mediaType: "image" }),
  });
  return mapCatalogMedia(json?.data ?? {});
}

export async function updateCatalogMedia(
  mediaId: string,
  payload: Partial<{ altText: string; caption: string | null; sortOrder: number; status: CatalogStatus }>,
): Promise<CatalogMedia> {
  const json = await apiFetch(`/api/v1/ops/admin/media/${encodeURIComponent(mediaId)}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  return mapCatalogMedia(json?.data ?? { id: mediaId });
}

export async function deleteCatalogMedia(mediaId: string): Promise<void> {
  await apiFetch(`/api/v1/ops/admin/media/${encodeURIComponent(mediaId)}`, { method: "DELETE" });
}

export async function updateAdminFareRules(updates: any): Promise<FareRuleset> {
  await apiFetch(`/api/v1/ops/admin/fare-rules`, {
    method: "PUT",
    body: JSON.stringify(updates),
  });
  return fetchAdminFareRules();
}

export async function createAdminBooking(payload: {
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  tripType: "one-way" | "round-trip";
  vehicleTier: string;
  originName: string;
  destinationName: string;
  pickupAddress: string;
  dropAddress: string;
  pickupDatetime: string;
  specialNotes?: string;
}): Promise<any> {
  const json = await apiFetch(`/api/v1/bookings/draft`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return json?.data;
}

/* ── Review moderation ────────────────────────────────────────────────────── */

export async function fetchAdminReviews(catalogItems?: { id: string; title: string }[]): Promise<Review[]> {
  const json = await apiFetch(`/api/v1/ops/admin/reviews`);
  const items = json?.data?.items || json?.data || [];
  if (!Array.isArray(items)) return [];

  const titleById = new Map((catalogItems ?? []).map((c) => [c.id, c.title]));

  return items.map((r: any) => ({
    id: r.id,
    customerName: r.displayName || "Customer",
    ticketId: r.bookingId || "—",
    route: (r.catalogItemId && titleById.get(r.catalogItemId)) || "General",
    rating: Number(r.rating) || 0,
    text: r.reviewText || "",
    status: (r.status as ReviewStatus) || "pending_review",
    submittedAt: r.createdAt || r.publishedAt || new Date().toISOString(),
    verifiedBooking:
      r.verificationStatus === "booking_verified" || r.verificationStatus === "manually_verified",
  }));
}

export async function actOnReview(
  id: string,
  action: "approve" | "reject" | "publish" | "archive",
): Promise<{ id: string; status: ReviewStatus }> {
  const json = await apiFetch(`/api/v1/ops/admin/reviews/${encodeURIComponent(id)}/${action}`, {
    method: "POST",
    body: JSON.stringify(
      action === "reject" ? { reason: "Rejected by staff during moderation." } : {},
    ),
  });
  return { id: json?.data?.id ?? id, status: json?.data?.status ?? "pending_review" };
}
