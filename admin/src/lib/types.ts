export type AdminRole =
  | "dispatcher"
  | "content_editor"
  | "review_moderator"
  | "finance_operator"
  | "super_admin";

export interface AdminUser {
  id: string;
  role: AdminRole;
  name: string;
  email: string;
}

export type BookingStatus =
  | "draft"
  | "pending_payment"
  | "paid_confirmed"
  | "in_transit"
  | "completed"
  | "cancelled"
  | "refunded";

export type TripType = "one-way" | "round-trip" | "local-hourly" | "custom-tour";

export type VehicleTier =
  | "sedan"
  | "ertiga"
  | "innova-crysta"
  | "tempo-traveller-12"
  | "tempo-traveller-17"
  | "coastal-coach-25";

export interface FareSnapshot {
  baseFare: number;
  nightAllowance: number;
  driverAllowance: number;
  tollsTaxes: number;
  promoDiscount: number;
  totalFare: number;
  advancePaid: number;
  balancePayable: number;
}

export interface Booking {
  id: string;
  ticketId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  origin: string;
  destination: string;
  pickupDateTime: string;
  returnDateTime: string | null;
  distanceKm: number;
  tripType: TripType;
  vehicleTier: VehicleTier;
  status: BookingStatus;
  version: number;
  notes: string;
  createdAt: string;
  fare: FareSnapshot;
}

export type PaymentMethod = "upi" | "card" | "netbanking" | "paypal";
export type PaymentProvider = "razorpay" | "paypal";
export type PaymentStatus = "captured" | "refunded" | "pending" | "failed";

export interface Payment {
  id: string;
  bookingTicketId: string;
  provider: PaymentProvider;
  method: PaymentMethod;
  providerPaymentId: string;
  amount: number;
  status: PaymentStatus;
  capturedAt: string;
}

export type CatalogStatus = "draft" | "published" | "archived";
export type CatalogCategory = "ride" | "tour" | "package";

export interface CatalogItem {
  id: string;
  title: string;
  slug: string;
  category: CatalogCategory;
  summary: string;
  duration: string;
  startingPrice: number;
  status: CatalogStatus;
  updatedAt: string;
  places: string[];
}

export type ReviewStatus =
  | "pending_review"
  | "approved"
  | "rejected"
  | "published"
  | "archived";

export interface Review {
  id: string;
  customerName: string;
  ticketId: string;
  route: string;
  rating: number;
  text: string;
  status: ReviewStatus;
  submittedAt: string;
  verifiedBooking: boolean;
}

export type InquiryStatus = "new" | "contacted" | "quoted" | "converted" | "closed";
export type InquiryType = "custom_tour" | "group_charter" | "contact";

export interface Inquiry {
  id: string;
  name: string;
  phone: string;
  type: InquiryType;
  subject: string;
  message: string;
  status: InquiryStatus;
  notes: string[];
  createdAt: string;
}

export interface FareRule {
  vehicleTier: VehicleTier;
  label: string;
  seats: number;
  perKm: number;
  minDailyKm: number;
  nightChargePerHour: number;
  driverAllowance: number;
}

export interface FareRuleset {
  version: string;
  effectiveFrom: string;
  nightWindow: string;
  rules: FareRule[];
  notes: string[];
}

export type AuditAction =
  | "BOOKING_STATUS_CHANGED"
  | "BOOKING_UNMASK_VIEWED"
  | "REFUND_REQUESTED"
  | "REFUND_EXECUTED"
  | "CATALOG_DRAFTED"
  | "CATALOG_PUBLISHED"
  | "CATALOG_ARCHIVED"
  | "REVIEW_APPROVED"
  | "REVIEW_REJECTED"
  | "REVIEW_PUBLISHED"
  | "INQUIRY_UPDATED"
  | "LOGIN";

export interface AuditEntry {
  id: string;
  action: AuditAction;
  actor: string;
  actorRole: AdminRole;
  resourceType: string;
  resourceId: string;
  ip: string;
  detail: string;
  at: string;
}

export interface RevenuePoint {
  month: string;
  revenue: number;
  bookings: number;
}

export const VEHICLE_LABELS: Record<VehicleTier, string> = {
  sedan: "Sedan",
  ertiga: "Ertiga",
  "innova-crysta": "Innova Crysta",
  "tempo-traveller-12": "Tempo 12",
  "tempo-traveller-17": "Tempo 17",
  "coastal-coach-25": "Coach 25",
};

export const ROLE_LABELS: Record<AdminRole, string> = {
  dispatcher: "Dispatcher",
  content_editor: "Content Editor",
  review_moderator: "Review Moderator",
  finance_operator: "Finance Operator",
  super_admin: "Super Admin",
};

/** Permission matrix from ADMIN_PRD.md §4 */
export const PERMISSIONS: Record<string, AdminRole[]> = {
  "bookings:read": ["dispatcher", "finance_operator", "super_admin"],
  "bookings:transition": ["dispatcher", "super_admin"],
  "bookings:unmask": ["dispatcher", "super_admin"],
  "finance:read": ["finance_operator", "super_admin"],
  "finance:refund": ["super_admin"],
  "catalog:edit": ["content_editor", "super_admin"],
  "catalog:publish": ["super_admin"],
  "reviews:moderate": ["review_moderator", "super_admin"],
  "reviews:publish": ["super_admin"],
  "inquiries:manage": ["dispatcher", "super_admin"],
  "fares:read": ["dispatcher", "finance_operator", "super_admin"],
  "audit:read": ["super_admin"],
};

export function can(role: AdminRole, permission: string): boolean {
  return (PERMISSIONS[permission] ?? []).includes(role);
}
