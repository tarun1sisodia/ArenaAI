# Admin Panel Domain Models & Schemas — SK Baghel Tour & Travels

**System:** SK Baghel Tour & Travels Operations & Backoffice  
**Document Version:** 1.0  
**Status:** Approved Schema Standard  
**Related Documents:** [ADMIN_PRD.md](ADMIN_PRD.md), [ADMIN_TRD.md](ADMIN_TRD.md), [ADMIN_API_CONTRACT.md](ADMIN_API_CONTRACT.md)

---

## 1. Purged Models (Explicitly Excluded)

> [!CAUTION]
> The following models have been **permanently purged** from the domain and database schema per client requirements. They must **never** be reintroduced into the backend or admin panel:
> - `DriverRecord` / `drivers` table (NO driver profiles, licenses, phones, ratings).
> - `VehicleRecord` / `vehicles` table (NO vehicle registration plates, maintenance logs, fleet inventory).
> - `assigned_driver_id`, `assigned_vehicle_id`, and `driver_assigned_at` columns on `bookings`.

---

## 2. Admin Domain Entities

### 2.1. Booking Entity (`BookingRecord`)
```typescript
export interface BookingRecord {
  id: string;                         // UUID primary key
  ticketId: string;                   // Public ticket: AGR-YYYYMMDD-XXXX
  guestAccessToken: string;           // UUID used for guest voucher access
  tripType: TripType;                 // "one-way" | "round-trip" | "local-hourly" | "custom-tour"
  vehicleTier: VehicleTier;           // "sedan" | "ertiga" | "innova-crysta" | "tempo-traveller-12" | ...
  originName: string;                 // City/locality (e.g. "Agra")
  destinationName: string;            // City/locality (e.g. "Delhi")
  pickupAddress: string;              // Specific street/hotel pickup address
  dropAddress: string;                // Specific drop-off address
  pickupDatetime: string;             // ISO-8601 pickup timestamp
  returnDatetime: string | null;      // ISO-8601 return timestamp (for round trips)
  distanceKm: number;                 // Billable distance
  customerName: string;               // Customer full name
  customerPhone: string;              // Normalized E.164 phone (+91...)
  customerEmail: string | null;       // Customer email address
  baseFare: number;                   // In INR rupees
  nightAllowance: number;             // In INR rupees (applicable 10pm - 6am)
  driverAllowance: number;            // In INR rupees (₹300/day outstation allowance)
  discountAmount: number;             // Applied coupon discount
  promoCode: string | null;           // Promo code string if applied
  totalFare: number;                  // Total booking fare in INR
  advanceAmount: number;              // Advance required to confirm booking
  balanceAmount: number;              // Balance payable by customer at trip departure
  fareRulesVersion: string;           // Fare engine version string (e.g. "2026-09-13")
  fareSnapshot: FareBreakdown;        // Immutable full fare calculation snapshot
  status: BookingStatus;              // "draft" | "pending_payment" | "paid_confirmed" | "in_transit" | "completed" | "cancelled" | "refunded"
  version: number;                    // OCC optimistic concurrency version counter
  specialNotes: string | null;        // Customer requests (e.g. luggage, child seat)
  packageId: string | null;           // Associated tour package ID if booked from catalog
  createdAt: string;                  // ISO timestamp
  updatedAt: string;                  // ISO timestamp
}
```

### 2.2. Admin Projected Booking Item (`AdminBookingItem`)
Returned in admin list queries (`GET /ops/admin/bookings`):
```typescript
export interface AdminBookingItem {
  id: string;
  ticketId: string;
  status: BookingStatus;
  tripType: TripType;
  vehicleTier: VehicleTier;
  originName: string;
  destinationName: string;
  pickupDatetime: string;
  customerName: string;
  customerPhone: string;              // Masked for list view (+9198****3221)
  customerEmail: string | null;       // Masked for list view (a***@gmail.com)
  advanceAmount: number;
  totalFare: number;
  version: number;
}
```

### 2.3. Admin Unmasked Detail (`AdminBookingDetail`)
Returned in single booking queries (`GET /ops/admin/bookings/:id`) to authorized operators:
```typescript
export interface AdminBookingDetail extends BookingRecord {
  customerPhoneUnmasked: string;      // Full raw phone number (+919876543221)
  customerEmailUnmasked: string | null;
  payments: PaymentRecord[];          // Associated payment gateway attempts
  refunds: RefundRecord[];            // Associated refund records
  auditTrail: AuditLogRecord[];       // Chronological mutations
}
```

### 2.4. Refund Entity (`RefundRecord`)
```typescript
export interface RefundRecord {
  id: string;                         // UUID
  bookingId: string;                  // Target booking UUID
  paymentId: string;                  // Original captured payment UUID
  amountMinor: number;                // Amount in paise / minor currency units (e.g. 50000 = ₹500)
  currency: Currency;                 // "INR" | "USD" | "EUR" | "GBP"
  reason: string;                     // Mandatory staff-entered refund explanation
  status: "pending" | "processed" | "failed";
  providerRefundId: string | null;    // Payout ID returned by Razorpay / PayPal
  idempotencyKey: string;             // Client-supplied UUID preventing duplicate refund triggers
  actorId: string;                    // UUID of super_admin who authorized the refund
  createdAt: string;
  updatedAt: string;
}
```

### 2.5. Catalog Item Entity (`CatalogRecord`)
```typescript
export interface CatalogRecord {
  id: string;                         // UUID
  type: "ride" | "tour" | "package";
  slug: string;                       // URL-friendly unique identifier (e.g. "same-day-agra-tour")
  title: string;                      // Display title
  shortDescription: string;           // Card excerpt
  description: string;                // Full markdown content
  durationText: string;               // e.g. "1 Day", "4 Hours"
  routeSummary: string;               // e.g. "Agra -> Fatehpur Sikri -> Agra"
  startingPriceInr: number;           // Benchmark price in INR
  featuredImageAssetId: string | null;// CDN asset reference
  status: "draft" | "published" | "archived";
  version: number;
  createdBy: string;                  // Admin user ID
  updatedBy: string;                  // Admin user ID
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
```

### 2.6. Customer Review Entity (`ReviewRecord`)
```typescript
export interface ReviewRecord {
  id: string;                         // UUID
  catalogSlug: string;                // Associated tour slug
  ticketId: string | null;            // Linked booking ticket ID for verification
  displayName: string;                // Customer display name
  rating: number;                     // 1 to 5 integer
  reviewText: string;                 // Customer testimonial
  status: "draft" | "pending_review" | "approved" | "rejected" | "published" | "archived";
  isVerifiedCustomer: boolean;        // True if cross-verified against paid booking
  moderatedBy: string | null;         // Admin user ID
  moderationNotes: string | null;     // Internal explanation if rejected
  createdAt: string;
  updatedAt: string;
}
```

### 2.7. Audit Log Entity (`AuditLogRecord`)
```typescript
export interface AuditLogRecord {
  id: string;                         // UUID
  actorId: string;                    // Admin user UUID
  actorRole: UserRole;                // Admin role at time of action
  action: string;                     // e.g. "REFUND_PROCESSED", "STATUS_UPDATED", "PII_UNMASKED"
  resourceType: string;               // "booking" | "catalog" | "review" | "payment"
  resourceId: string;                 // Target entity ID
  details: Record<string, unknown>;   // Structured change payload snapshot
  ipAddress: string;                  // Client IP address
  createdAt: string;                  // ISO timestamp
}
```

---

## 3. Zod Input Validation Schemas

Located in [`backend/src/modules/admin/admin.schema.ts`](file:///home/bot/Internship/ArenaAI/backend/src/modules/admin/admin.schema.ts):

```typescript
import { z } from "zod";
import { BOOKING_STATUSES } from "../../types/domain.js";

export const AdminBookingQuerySchema = z.object({
  status: z.enum(BOOKING_STATUSES).optional(),
  ticketId: z.string().trim().min(1).optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

export const CreateRefundSchema = z.object({
  bookingId: z.string().uuid(),
  reason: z.string().trim().min(5, "Refund reason must be at least 5 characters"),
  idempotencyKey: z.string().uuid("Idempotency key must be a valid UUID"),
});

export const UpdateBookingStatusSchema = z.object({
  status: z.enum(["in_transit", "completed", "cancelled"]),
  expectedVersion: z.number().int().positive(),
  note: z.string().trim().optional(),
});
```
