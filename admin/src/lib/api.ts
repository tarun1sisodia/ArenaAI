/**
 * Admin API Client — connects Admin Operations Desk to Fastify REST API.
 * Uses env.API_BASE_URL (defaults to http://localhost:4000 on localhost).
 * Uses getAuthHeaders() for Bearer authentication.
 *
 * No silent fixture fallbacks: every function either returns REAL backend data
 * (possibly an empty list) or throws. Pages render their own empty/error states.
 */
import { env } from "./env";
import { expireSession, getAuthHeaders } from "./auth";
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
  RentalEnquiry,
  RentalStatus,
  Payment,
  PaymentMethod,
  PaymentProvider,
  Review,
  ReviewStatus,
  TripType,
  VehicleTier,
  RouteCatalogItem, RouteFleet, RouteTripType,
} from "./types";

async function apiFetch(path: string, init?: RequestInit): Promise<any> {
  if (!env.API_BASE_URL) throw new Error("Backend is not connected.");
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
    if (res.status === 401 || res.status === 403) {
      expireSession();
    }
    let message = json?.error?.message || json?.message;
    if (json?.error?.details && Array.isArray(json.error.details)) {
      const details = json.error.details
        .map((d: any) => (d.path ? `${d.path}: ${d.message}` : d.message || JSON.stringify(d)))
        .join("; ");
      message = `${message || "Validation failed"} (${details})`;
    }
    if (!message) {
      message =
        res.status === 401
          ? "Your session has expired. Please sign in again."
          : `Request failed (${res.status}). Check that the backend is reachable.`;
    }
    throw new Error(message);
  }
  return json;
}

function requireItems(data: any, label: string, ...aliases: string[]): any[] {
  if (Array.isArray(data)) return data;
  if (data && typeof data === "object") {
    for (const key of ["items", ...aliases]) if (Array.isArray(data[key])) return data[key];
  }
  throw new Error(`${label} response was malformed; no records were loaded.`);
}

function requireText(value: unknown, label: string): string {
  if (typeof value !== "string" || !value.trim()) throw new Error(`${label} was missing from the API response.`);
  return value;
}

function optionalText(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function requireNumber(value: unknown, label: string): number {
  if (value === null || value === undefined || value === "") throw new Error(`${label} was missing from the API response.`);
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) throw new Error(`${label} was invalid in the API response.`);
  return parsed;
}

function optionalNumber(value: unknown, label: string): number | null {
  if (value === null || value === undefined) return null;
  return requireNumber(value, label);
}

function requireRecord(value: unknown, label: string): Record<string, any> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`${label} response was malformed.`);
  return value as Record<string, any>;
}

function requireEnum<T extends string>(value: unknown, choices: readonly T[], label: string): T {
  if (typeof value !== "string" || !choices.includes(value as T)) throw new Error(`${label} was invalid in the API response.`);
  return value as T;
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
  const items = requireItems(json?.data, "Bookings", "bookings");
  return items.map((b: any) => {
    const status = requireEnum(b.status, ["draft", "pending_payment", "paid_confirmed", "in_transit", "completed", "cancelled", "refunded"] as const, "Booking status");
    const totalFare = requireNumber(b.totalFare, "Booking total fare");
    return {
      id: requireText(b.id, "Booking ID"),
      ticketId: requireText(b.ticketId, "Booking ticket ID"),
      customerName: optionalText(b.customerName),
      customerPhone: optionalText(b.customerPhone),
      customerEmail: optionalText(b.customerEmail),
      origin: optionalText(b.originName ?? b.origin),
      destination: optionalText(b.destinationName ?? b.destination),
      pickupDateTime: requireText(b.pickupDatetime ?? b.pickupDateTime, "Booking pickup time"),
      returnDateTime: b.returnDatetime ?? b.returnDateTime ?? null,
      distanceKm: requireNumber(b.distanceKm, "Booking distance"),
      tripType: requireEnum(b.tripType, ["one-way", "round-trip", "local-tour", "airport-transfer", "local-hourly", "custom-tour"] as const, "Booking trip type") as TripType,
      vehicleTier: requireEnum(b.vehicleTier, ["sedan", "ertiga", "innova-crysta", "tempo-traveller", "urbania"] as const, "Booking vehicle"),
      status,
      version: requireNumber(b.version, "Booking version"),
      notes: optionalText(b.specialNotes ?? b.notes),
      createdAt: requireText(b.createdAt, "Booking created time"),
      fare: {
        baseFare: requireNumber(b.baseFare, "Booking base fare"),
        nightAllowance: requireNumber(b.nightAllowance, "Booking night allowance"),
        driverAllowance: requireNumber(b.driverAllowance, "Booking driver allowance"),
        tollsTaxes: optionalNumber(b.tollsTaxes, "Booking tolls and taxes"),
        promoDiscount: requireNumber(b.discountAmount, "Booking discount"),
        totalFare,
        advancePaid: optionalNumber(b.advancePaid, "Advance paid"),
        balancePayable: optionalNumber(b.balanceAmount, "Balance payable"),
      },
    };
  });
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
  const items = requireItems(json?.data, "Inquiries", "inquiries");
  return items.map((iq: any) => ({
    id: requireText(iq.id, "Inquiry ID"),
    name: optionalText(iq.name),
    phone: optionalText(iq.phone),
    type: ["custom_tour", "group_charter", "contact", "local_tour", "outstation"].includes(iq.tripInterest)
      ? iq.tripInterest as InquiryType
      : null,
    subject: iq.tripInterest ? `Interest: ${iq.tripInterest}` : "",
    message: optionalText(iq.message),
    status: requireEnum(iq.status, ["new", "contacted", "quoted", "converted", "resolved", "closed", "spam"] as const, "Inquiry status") as InquiryStatus,
    notes: requireItems(iq.notes, "Inquiry notes"),
    createdAt: requireText(iq.createdAt, "Inquiry created time"),
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

export async function fetchAdminRentalEnquiries(filter?: { status?: RentalStatus | "all"; car?: string | "all"; from?: string; to?: string; q?: string }): Promise<RentalEnquiry[]> {
  const params = new URLSearchParams(); if (filter?.status && filter.status !== "all" && filter.status !== "new") params.set("status", filter.status); if (filter?.car && filter.car !== "all") params.set("car", filter.car); if (filter?.from) params.set("from", filter.from); if (filter?.to) params.set("to", filter.to); if (filter?.q) params.set("q", filter.q);
  const json = await apiFetch(`/api/v1/ops/admin/rental-enquiries${params.toString() ? `?${params}` : ""}`);
  const items = requireItems(json?.data, "Rental requests", "rentalEnquiries");
  return items.map((item: any) => ({
    ...item,
    id: requireText(item.id, "Rental request ID"),
    status: requireEnum(item.status, ["new", "contacted", "quoted", "done", "closed", "spam"] as const, "Rental request status"),
    notes: requireItems(item.notes, "Rental request notes"),
  }));
}
export async function updateAdminRentalEnquiry(id: string, updates: { status?: RentalStatus; note?: string }): Promise<RentalEnquiry> { const json = await apiFetch(`/api/v1/ops/admin/rental-enquiries/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(updates) }); return json.data; }
export async function fetchAdminPayments(filter?: {
  page?: number;
  limit?: number;
}): Promise<{ items: Payment[]; total: number; totalCaptured: number; totalRefunded: number }> {
  const params = new URLSearchParams();
  if (filter?.page) params.set("page", String(filter.page));
  if (filter?.limit) params.set("limit", String(filter.limit));

  const json = await apiFetch(`/api/v1/ops/admin/payments${params.toString() ? `?${params.toString()}` : ""}`);
  const items = requireItems(json?.data, "Payments", "payments");
  const mapped: Payment[] = items.map((p: any) => {
    const status = requireEnum(p.status, ["captured", "refunded", "pending", "failed", "needs_review"] as const, "Payment status");
    return {
      id: requireText(p.id, "Payment ID"),
      bookingTicketId: optionalText(p.bookingTicketId ?? p.bookingId),
      provider: requireEnum(p.provider, ["razorpay", "paypal", "card"] as const, "Payment provider") as PaymentProvider,
      method: p.paymentMethod || p.method
        ? requireEnum(p.paymentMethod ?? p.method, ["upi", "card", "netbanking", "paypal"] as const, "Payment method") as PaymentMethod
        : null,
      providerPaymentId: optionalText(p.providerPaymentId),
      amount: Math.round(requireNumber(p.amountMinor, "Payment amount") / 100),
      status,
      capturedAt: status === "captured"
        ? requireText(p.verifiedAt ?? p.capturedAt, "Payment capture time")
        : optionalText(p.verifiedAt ?? p.capturedAt),
    };
  });

  return {
    items: mapped,
    total: requireNumber(json?.data?.total, "Total payment count"),
    totalCaptured: Math.round(requireNumber(json?.data?.totalCapturedPaise, "Captured payment total") / 100),
    totalRefunded: Math.round(requireNumber(json?.data?.totalRefundedPaise, "Refunded payment total") / 100),
  };
}

export async function fetchAdminFareRules(): Promise<FareRuleset> {
  const json = await apiFetch(`/api/v1/ops/admin/fare-rules`);
  const data = requireRecord(json?.data, "Fare rules");
  const outstation = requireRecord(data.outstation, "Outstation rules");
  const vehicles = requireItems(data.vehicles, "Fare vehicles");
  const startHour = optionalNumber(outstation.nightStartHour, "Night start hour");
  const endHour = optionalNumber(outstation.nightEndHour, "Night end hour");
  const nightWindow = optionalText(data.nightWindow) ||
    (startHour !== null && endHour !== null
      ? `${String(startHour).padStart(2, "0")}:00 – ${String(endHour).padStart(2, "0")}:00 IST`
      : "");

  const rules = vehicles.map((v: any) => {
    const tier = requireEnum(v.tier ?? v.id, ["sedan", "ertiga", "innova-crysta", "tempo-traveller", "urbania"] as const, "Fare vehicle tier");
    const seats = requireNumber(v.seats, "Fare vehicle seats");
    const cabinAllowance = optionalNumber(outstation.nightAllowanceCab, "Cab driver allowance");
    const tempoAllowance = optionalNumber(outstation.nightAllowanceTempo, "Tempo driver allowance");
    const derivedAllowance = seats >= 12 ? tempoAllowance : cabinAllowance;
    return {
      vehicleTier: tier as VehicleTier,
      label: `${optionalText(v.name) || tier} (${seats}-seater)`,
      seats,
      perKm: requireNumber(v.perKm, "Fare per-kilometre rate"),
      minDailyKm: requireNumber(outstation.minKmPerDay, "Minimum daily kilometres"),
      nightChargePerHour: optionalNumber(v.nightChargePerHour, "Night charge per hour"),
      driverAllowance: optionalNumber(v.driverAllowance, "Driver allowance") ?? derivedAllowance,
      active: typeof v.active === "boolean" ? v.active : null,
    };
  });

  return {
    version: requireText(data.version, "Fare rules version"),
    effectiveFrom: optionalText(data.effectiveFrom),
    nightWindow,
    rules,
    notes: Array.isArray(data.notes) ? data.notes.map((note: unknown) => requireText(note, "Fare rule note")) : [],
  };
}

export async function fetchAdminAuditLogs(limit = 100): Promise<AuditEntry[]> {
  const json = await apiFetch(`/api/v1/ops/admin/audit-logs?limit=${limit}`);
  const items = requireItems(json?.data, "Audit log");
  return items.map((a: any) => ({
    id: requireText(a.id, "Audit entry ID"),
    action: requireText(a.action, "Audit action") as AuditEntry["action"],
    actor: optionalText(a.actor),
    actorRole: optionalText(a.actorRole) as AuditEntry["actorRole"],
    resourceType: optionalText(a.resourceType),
    resourceId: optionalText(a.resourceId),
    ip: optionalText(a.ip),
    detail: optionalText(a.detail),
    at: requireText(a.at ?? a.createdAt, "Audit time"),
  }));
}

/* ── Catalog CMS ──────────────────────────────────────────────────────────── */

function mapCatalogItem(c: any): CatalogItem {
  return {
    id: requireText(c.id, "Catalog item ID"),
    slug: requireText(c.slug, "Catalog item slug"),
    title: requireText(c.title, "Catalog item title"),
    category: requireEnum(c.type, ["ride", "tour", "package", "route", "vehicle", "place"] as const, "Catalog item category"),
    summary: optionalText(c.shortDescription ?? c.description),
    duration: optionalText(c.durationText),
    startingPrice: requireNumber(c.startingPriceInr, "Catalog starting price"),
    status: requireEnum(c.status, ["draft", "published", "archived"] as const, "Catalog item status"),
    updatedAt: requireText(c.updatedAt ?? c.createdAt, "Catalog item update time"),
    places: optionalText(c.routeSummary)
      .split(/[,·|]/)
      .map((s: string) => s.trim())
      .filter(Boolean),
    distanceKm: optionalNumber(c.distanceKm, "Catalog distance"),
    availability: requireEnum(c.availability, ["available", "limited", "unavailable"] as const, "Catalog availability"),
    seatsLeft: optionalNumber(c.seatsLeft, "Catalog seats remaining"),
    stops: requireItems(c.stops, "Catalog stops"),
    tripType: c.tripType == null ? null : requireEnum(c.tripType, ["one-way", "round-trip", "local-tour", "airport-transfer"] as const, "Catalog trip type"),
  };
}

function mapCatalogMedia(m: any): CatalogMedia {
  return {
    id: requireText(m.id, "Catalog media ID"),
    catalogItemId: requireText(m.catalogItemId, "Catalog media item ID"),
    mediaType: requireEnum(m.mediaType, ["image", "video"] as const, "Catalog media type"),
    altText: optionalText(m.altText),
    caption: m.caption ?? null,
    sortOrder: requireNumber(m.sortOrder, "Catalog media order"),
    status: requireEnum(m.status, ["draft", "published", "archived"] as const, "Catalog media status"),
    url: requireText(m.url ?? m.storagePath, "Catalog media URL"),
    mimeType: m.mimeType ?? null,
    sizeBytes: optionalNumber(m.sizeBytes, "Catalog media size"),
    createdAt: requireText(m.createdAt, "Catalog media creation time"),
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
  const items = requireItems(json?.data, "Catalog");
  return items.map(mapCatalogItem);
}

export async function fetchAdminCatalogItem(id: string): Promise<{ item: CatalogItem; media: CatalogMedia[] }> {
  const json = await apiFetch(`/api/v1/ops/admin/catalog/${encodeURIComponent(id)}`);
  const data = requireRecord(json?.data, "Catalog item");
  return { item: mapCatalogItem(data), media: requireItems(data.media, "Catalog media").map(mapCatalogMedia) };
}

export async function fetchCatalogManifestStatus(): Promise<{
  version: number;
  updatedAt: string;
  routeCount: number;
  packageCount: number;
}> {
  const json = await apiFetch(`/api/v1/ops/admin/catalog/manifest/status`);
  const data = requireRecord(json?.data, "Catalog manifest status");
  return {
    version: requireNumber(data.version, "Manifest version"),
    updatedAt: requireText(data.updatedAt, "Manifest update time"),
    routeCount: requireNumber(data.routeCount, "Manifest route count"),
    packageCount: requireNumber(data.packageCount, "Manifest package count"),
  };
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
  const data = requireRecord(json?.data, "Republished catalog manifest");
  return {
    version: requireNumber(data.version, "Manifest version"),
    updatedAt: requireText(data.updatedAt, "Manifest update time"),
    routeCount: requireNumber(data.routeCount, "Manifest route count"),
    packageCount: requireNumber(data.packageCount, "Manifest package count"),
  };
}

export async function setCatalogItemStatus(id: string, action: "publish" | "archive"): Promise<CatalogItem> {
  const json = await apiFetch(`/api/v1/ops/admin/catalog/${encodeURIComponent(id)}/${action}`, {
    method: "POST",
    body: JSON.stringify({}),
  });
  return mapCatalogItem(requireRecord(json?.data, "Updated catalog item"));
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
  return mapCatalogItem(requireRecord(json?.data, "Created catalog item"));
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
  return mapCatalogItem(requireRecord(json?.data, "Updated catalog item"));
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
  return mapCatalogMedia(requireRecord(json?.data, "Uploaded catalog media"));
}

export async function attachCatalogMediaByPath(
  catalogItemId: string,
  payload: { storagePath: string; altText: string; caption?: string; sortOrder?: number },
): Promise<CatalogMedia> {
  const json = await apiFetch(`/api/v1/ops/admin/catalog/${encodeURIComponent(catalogItemId)}/media`, {
    method: "POST",
    body: JSON.stringify({ ...payload, mediaType: "image" }),
  });
  return mapCatalogMedia(requireRecord(json?.data, "Attached catalog media"));
}

export async function updateCatalogMedia(
  mediaId: string,
  payload: Partial<{ altText: string; caption: string | null; sortOrder: number; status: CatalogStatus }>,
): Promise<CatalogMedia> {
  const json = await apiFetch(`/api/v1/ops/admin/media/${encodeURIComponent(mediaId)}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  return mapCatalogMedia(requireRecord(json?.data, "Updated catalog media"));
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
  vehicleTier?: string;
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
  const items = requireItems(json?.data, "Reviews");

  const titleById = new Map((catalogItems ?? []).map((c) => [c.id, c.title]));

  return items.map((r: any) => ({
    id: requireText(r.id, "Review ID"),
    customerName: optionalText(r.displayName),
    ticketId: optionalText(r.bookingId),
    route: optionalText(r.catalogItemId ? titleById.get(r.catalogItemId) : ""),
    rating: requireNumber(r.rating, "Review rating"),
    text: optionalText(r.reviewText),
    status: requireEnum(r.status, ["draft", "pending_review", "approved", "rejected", "published", "archived"] as const, "Review status"),
    submittedAt: requireText(r.createdAt ?? r.publishedAt, "Review submission time"),
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
  const data = requireRecord(json?.data, "Review moderation result");
  return {
    id: requireText(data.id, "Review ID"),
    status: requireEnum(data.status, ["draft", "pending_review", "approved", "rejected", "published", "archived"] as const, "Review status"),
  };
}


function mapRouteCatalogItem(value: any): RouteCatalogItem {
  const tripType = requireEnum(value.tripType ?? value.trip_type, ["one-way", "round-trip", "local-tour"] as const, "Route trip type");
  const status = requireEnum(value.status, ["draft", "published", "archived"] as const, "Route status");
  const tollIncluded = value.tollIncluded ?? value.toll_included;
  const needsReview = value.needsReview ?? value.needs_review;
  if (typeof tollIncluded !== "boolean") throw new Error("Route toll-included flag was missing from the API response.");
  if (typeof needsReview !== "boolean") throw new Error("Route review flag was missing from the API response.");
  return {
    id: requireText(value.id, "Route ID"),
    tripType,
    sourceCity: requireText(value.sourceCity ?? value.source_city, "Route source city"),
    sourceDetail: value.sourceDetail ?? value.source_detail ?? null,
    destinationCity: value.destinationCity ?? value.destination_city ?? null,
    slug: requireText(value.slug, "Route slug"),
    distanceKm: optionalNumber(value.distanceKm ?? value.distance_km, "Route distance"),
    durationText: optionalText(value.durationText ?? value.duration_text),
    availableFleets: requireItems(value.availableFleets ?? value.available_fleets, "Route fleets"),
    faresInr: requireRecord(value.faresInr ?? value.fares_inr, "Route fares"),
    driverChargeInr: requireNumber(value.driverChargeInr ?? value.driver_charge_inr, "Route driver charge"),
    nightHaltInr: requireNumber(value.nightHaltInr ?? value.night_halt_inr, "Route night halt"),
    tollIncluded,
    tollAmountInr: optionalNumber(value.tollAmountInr ?? value.toll_amount_inr, "Route toll amount"),
    interstateCharges: requireItems(value.interstateCharges ?? value.interstate_charges, "Route interstate charges"),
    minKmPerDay: requireNumber(value.minKmPerDay ?? value.min_km_per_day, "Route minimum daily kilometres"),
    stops: requireItems(value.stops, "Route stops"),
    status,
    needsReview,
    createdAt: requireText(value.createdAt ?? value.created_at, "Route creation time"),
    updatedAt: requireText(value.updatedAt ?? value.updated_at, "Route update time"),
  };
}

export async function fetchAdminRoutes(filter?: { tripType?: RouteTripType | "all"; status?: CatalogStatus | "all"; q?: string }): Promise<RouteCatalogItem[]> {
  const params = new URLSearchParams();
  if (filter?.tripType && filter.tripType !== "all") params.set("trip_type", filter.tripType);
  if (filter?.status && filter.status !== "all") params.set("status", filter.status);
  if (filter?.q?.trim()) params.set("q", filter.q.trim());
  const json = await apiFetch(`/api/v1/ops/admin/route-catalog${params.toString() ? `?${params}` : ""}`);
  return requireItems(json?.data, "Route catalog").map(mapRouteCatalogItem);
}
export async function fetchAdminRoute(id: string): Promise<RouteCatalogItem> {
  const json = await apiFetch(`/api/v1/ops/admin/route-catalog/${encodeURIComponent(id)}`);
  return mapRouteCatalogItem(requireRecord(json?.data, "Route"));
}
export async function createAdminRoute(payload: Omit<RouteCatalogItem, "id" | "status" | "createdAt" | "updatedAt"> & { status?: never }): Promise<RouteCatalogItem> {
  const json = await apiFetch(`/api/v1/ops/admin/route-catalog`, { method: "POST", body: JSON.stringify({
    trip_type: payload.tripType, source_city: payload.sourceCity, source_detail: payload.sourceDetail || undefined,
    destination_city: payload.destinationCity || undefined, slug: payload.slug, distance_km: payload.distanceKm ?? undefined,
    duration_text: payload.durationText || undefined, available_fleets: payload.availableFleets, fares_inr: payload.faresInr,
    driver_charge_inr: payload.driverChargeInr, night_halt_inr: payload.nightHaltInr, toll_included: payload.tollIncluded,
    toll_amount_inr: payload.tollAmountInr ?? undefined, interstate_charges: payload.interstateCharges,
    min_km_per_day: payload.minKmPerDay, stops: payload.stops, needs_review: payload.needsReview,
  }) });
  return mapRouteCatalogItem(requireRecord(json?.data, "Created route"));
}
export async function updateAdminRoute(id: string, payload: Partial<Omit<RouteCatalogItem, "id" | "status" | "createdAt" | "updatedAt">>): Promise<RouteCatalogItem> {
  const body: any = {};
  for (const [key, value] of Object.entries(payload)) body[key.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`)] = value;
  const json = await apiFetch(`/api/v1/ops/admin/route-catalog/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(body) });
  return mapRouteCatalogItem(requireRecord(json?.data, "Updated route"));
}
export async function publishAdminRoute(id: string): Promise<RouteCatalogItem> {
  const json = await apiFetch(`/api/v1/ops/admin/route-catalog/${encodeURIComponent(id)}/publish`, { method: "POST", body: "{}" });
  return mapRouteCatalogItem(requireRecord(json?.data, "Published route"));
}
export async function archiveAdminRoute(id: string): Promise<RouteCatalogItem> {
  const json = await apiFetch(`/api/v1/ops/admin/route-catalog/${encodeURIComponent(id)}/archive`, { method: "POST", body: "{}" });
  return mapRouteCatalogItem(requireRecord(json?.data, "Archived route"));
}
export async function checkRouteSlug(slug: string): Promise<{ available: boolean }> {
  const json = await apiFetch(`/api/v1/ops/admin/route-catalog/slug-check?slug=${encodeURIComponent(slug)}`);
  const data = requireRecord(json?.data, "Route slug availability");
  if (typeof data.available !== "boolean") throw new Error("Route slug availability response was malformed.");
  return { available: data.available };
}
export async function suggestRouteFares(input: { tripType: RouteTripType; distanceKm: number }): Promise<Record<string, number>> {
  const json = await apiFetch(`/api/v1/ops/admin/route-catalog/suggest-fares`, { method: "POST", body: JSON.stringify({ trip_type: input.tripType, distance_km: input.distanceKm }) });
  return requireRecord(json?.data, "Suggested route fares");
}
export async function fetchRouteFleets(): Promise<RouteFleet[]> {
  const json = await apiFetch(`/api/v1/route-catalog/fleets`);
  return requireItems(json?.data, "Route fleets");
}
