export const TRIP_TYPES = [
  "one-way",
  "round-trip",
  "local-tour",
  "airport-transfer",
] as const;
export type TripType = (typeof TRIP_TYPES)[number];

export const VEHICLE_TIERS = [
  "sedan",
  "ertiga",
  "innova-crysta",
  "tempo-traveller",
  "urbania",
] as const;
export type VehicleTier = (typeof VEHICLE_TIERS)[number];

export const INTERNAL_VEHICLE_IDS = [
  "sedan",
  "ertiga",
  "innova",
  "tempo",
  "urbania",
] as const;
export type InternalVehicleId = (typeof INTERNAL_VEHICLE_IDS)[number];

export const BOOKING_STATUSES = [
  "draft",
  "pending_payment",
  "paid_confirmed",
  "in_transit",
  "completed",
  "cancelled",
  "refunded",
] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export const PAYMENT_STATUSES = [
  "pending",
  "captured",
  "failed",
  "refunded",
  "needs_review",
] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const PAYMENT_PROVIDERS = ["razorpay", "paypal", "card"] as const;
export type PaymentProviderName = (typeof PAYMENT_PROVIDERS)[number];

export const CURRENCIES = ["INR", "USD", "EUR", "GBP"] as const;
export type Currency = (typeof CURRENCIES)[number];

export const USER_ROLES = [
  "customer",
  "content_editor",
  "review_moderator",
  "dispatcher",
  "finance_operator",
  "super_admin",
] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const CATALOG_TYPES = ["ride", "tour", "package"] as const;
export type CatalogType = (typeof CATALOG_TYPES)[number];

export const CONTENT_STATUSES = ["draft", "published", "archived"] as const;
export type ContentStatus = (typeof CONTENT_STATUSES)[number];

export const REVIEW_STATUSES = [
  "draft",
  "pending_review",
  "approved",
  "rejected",
  "published",
  "archived",
] as const;
export type ReviewStatus = (typeof REVIEW_STATUSES)[number];

export const VERIFICATION_STATUSES = [
  "unverified",
  "booking_verified",
  "social_link_submitted",
  "manually_verified",
] as const;
export type VerificationStatus = (typeof VERIFICATION_STATUSES)[number];

export type FareBreakdown = {
  baseFare: number;
  nightAllowance: number;
  driverAllowance: number;
  discountAmount: number;
  totalFare: number;
  advanceAmount: number;
  balanceAmount: number;
  currency: "INR";
  fareVersion: string;
  label: string;
  duration: string;
  distanceKm: number;
  tripType: TripType;
  vehicleTier: VehicleTier;
  promoCode: string | null;
  promoValid: boolean;
  roundMultiplierApplied: boolean;
  rules: string[];
};

export type BookingRecord = {
  id: string;
  ticketId: string;
  userId: string | null;
  guestAccessToken: string;
  tripType: TripType;
  vehicleTier: VehicleTier;
  originName: string;
  destinationName: string;
  pickupAddress: string;
  dropAddress: string | null;
  pickupDatetime: string;
  returnDatetime: string | null;
  flightTrainNumber: string | null;
  distanceKm: number;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  baseFare: number;
  nightAllowance: number;
  driverAllowance: number;
  discountAmount: number;
  promoCode: string | null;
  totalFare: number;
  advanceAmount: number;
  balanceAmount: number;
  fareRulesVersion: string;
  fareSnapshot: FareBreakdown;
  status: BookingStatus;
  version: number;
  specialNotes: string | null;
  packageId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PaymentRecord = {
  id: string;
  bookingId: string;
  provider: PaymentProviderName;
  providerOrderId: string;
  providerPaymentId: string | null;
  checkoutSessionId: string | null;
  checkoutUrl: string | null;
  publicClientToken: string | null;
  amountMinor: number;
  currency: Currency;
  inrAmountPaise: number;
  status: PaymentStatus;
  paymentMethod: string | null;
  feeMinor: number;
  taxMinor: number;
  idempotencyKey: string;
  webhookEventId: string | null;
  reconciliationStatus: "pending" | "matched" | "duplicate" | "needs_review";
  failureReason: string | null;
  verifiedAt: string | null;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
};

export type RefundRecord = {
  id: string;
  paymentId: string;
  bookingId: string;
  providerRefundId: string | null;
  amountMinor: number;
  currency: Currency;
  reason: string;
  status: "pending" | "processed" | "failed";
  idempotencyKey: string;
  createdAt: string;
};

export type ProfileRecord = {
  id: string;
  fullName: string;
  phone: string;
  email: string | null;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
};

export type CatalogItemRecord = {
  id: string;
  type: CatalogType;
  slug: string;
  title: string;
  shortDescription: string;
  description: string;
  status: ContentStatus;
  durationText: string;
  routeSummary: string;
  startingPriceInr: number;
  version: number;
  createdBy: string | null;
  updatedBy: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CatalogMediaRecord = {
  id: string;
  catalogItemId: string;
  storagePath: string;
  mediaType: "image" | "video";
  altText: string;
  caption: string | null;
  sortOrder: number;
  status: ContentStatus;
  sourceType: "admin_upload" | "customer_upload" | "supplier";
  copyrightOwner: string | null;
  createdBy: string | null;
  approvedBy: string | null;
  publishedAt: string | null;
  createdAt: string;
};

export type ReviewRecord = {
  id: string;
  bookingId: string | null;
  catalogItemId: string | null;
  customerId: string | null;
  displayName: string;
  rating: number;
  reviewText: string;
  status: ReviewStatus;
  verificationStatus: VerificationStatus;
  socialProfileUrl: string | null;
  socialPlatform: string | null;
  verificationNotes: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  publishedAt: string | null;
  guestAccessToken: string | null;
  createdAt: string;
};

export type PromoCodeRecord = {
  id: string;
  code: string;
  discountAmount: number;
  minTotal: number;
  description: string;
  isActive: boolean;
  maxRedemptions: number | null;
  redemptionCount: number;
  validFrom: string | null;
  validTo: string | null;
};

export type AuditLogRecord = {
  id: string;
  actorId: string;
  actorRole: UserRole;
  resourceType: string;
  resourceId: string;
  action: string;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  reason: string | null;
  requestId: string;
  createdAt: string;
};

export type InquiryRecord = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  message: string;
  tripInterest: string | null;
  createdAt: string;
};

export type NotificationJobRecord = {
  id: string;
  bookingId: string;
  channel: "whatsapp" | "email";
  templateKey: string;
  dedupeKey: string;
  payload: Record<string, unknown>;
  status: "queued" | "sent" | "failed";
  attemptCount: number;
  providerMessageId: string | null;
  lastError: string | null;
  createdAt: string;
  updatedAt: string;
};

export type WebhookEventRecord = {
  id: string;
  provider: PaymentProviderName | string;
  eventId: string;
  eventType: string;
  payload: unknown;
  payloadHash: string;
  processed: boolean;
  receivedAt: string;
};

export type LocationSuggestion = {
  placeId: string;
  displayName: string;
  city: string | null;
  state: string | null;
  country: string;
  lat: number | null;
  lon: number | null;
};

export type AuthUser = {
  id: string;
  role: UserRole;
  email: string | null;
  phone: string | null;
};
