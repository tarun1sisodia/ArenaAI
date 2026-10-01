import type { RouteCatalogRecord, RouteCatalogStatus, RouteCatalogTripType } from "./route-catalog-types.js";
import type {
  AuditLogRecord,
  BookingRecord,
  BookingStatus,
  CatalogItemRecord,
  CatalogMediaRecord,
  InquiryRecord,
  InquiryStatus,
  LocationSuggestion,
  NotificationJobRecord,
  PaymentRecord,
  PaymentStatus,
  ProfileRecord,
  PromoCodeRecord,
  RefundRecord,
  ReviewRecord,
  ReviewStatus,
  UserRole,
  WebhookEventRecord,
} from "../types/domain.js";

export type InquiryListFilter = {
  status?: InquiryStatus;
  q?: string;
  limit?: number;
  page?: number;
};

export type PaymentListFilter = {
  bookingId?: string;
  status?: PaymentStatus;
  provider?: string;
  limit?: number;
  page?: number;
};

export type BookingListFilter = {
  status?: BookingStatus;
  ticketId?: string;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
};

export type CatalogListFilter = {
  type?: CatalogItemRecord["type"];
  status?: CatalogItemRecord["status"];
  q?: string;
};

export type RouteCatalogListFilter = { tripType?: RouteCatalogTripType; status?: RouteCatalogStatus; q?: string; page?: number; limit?: number };

export type ReviewListFilter = {
  status?: ReviewStatus;
  catalogItemId?: string;
};

export type Repositories = {
  healthCheck(): Promise<boolean>;
  transaction<T>(fn: (repos: Repositories) => Promise<T>): Promise<T>;

  bookings: {
    create(record: BookingRecord): Promise<BookingRecord>;
    update(record: BookingRecord): Promise<BookingRecord>;
    getById(id: string): Promise<BookingRecord | null>;
    getByTicketId(ticketId: string): Promise<BookingRecord | null>;
    ticketExists(ticketId: string): Promise<boolean>;
    list(filter: BookingListFilter): Promise<{ items: BookingRecord[]; total: number }>;
    /** SEC-007: targeted phone+time-window query for duplicate booking detection */
    listByPhone(phone: string, options: { from: string }): Promise<BookingRecord[]>;
  };

  payments: {
    create(record: PaymentRecord): Promise<PaymentRecord>;
    update(record: PaymentRecord): Promise<PaymentRecord>;
    getById(id: string): Promise<PaymentRecord | null>;
    getByIdempotencyKey(key: string): Promise<PaymentRecord | null>;
    getByProviderOrderId(providerOrderId: string): Promise<PaymentRecord | null>;
    listByBookingId(bookingId: string): Promise<PaymentRecord[]>;
    getOpenByBookingId(bookingId: string): Promise<PaymentRecord | null>;
    list(filter?: PaymentListFilter): Promise<{
      items: PaymentRecord[];
      total: number;
      totalCapturedPaise: number;
      totalRefundedPaise: number;
    }>;
  };

  refunds: {
    create(record: RefundRecord): Promise<RefundRecord>;
    getByIdempotencyKey(key: string): Promise<RefundRecord | null>;
    listByBookingId(bookingId: string): Promise<RefundRecord[]>;
  };

  profiles: {
    getById(id: string): Promise<ProfileRecord | null>;
    getByRole(role: UserRole): Promise<ProfileRecord[]>;
    upsert(record: ProfileRecord): Promise<ProfileRecord>;
  };

  routeCatalog: {
    create(record: RouteCatalogRecord): Promise<RouteCatalogRecord>;
    update(record: RouteCatalogRecord): Promise<RouteCatalogRecord>;
    getById(id: string): Promise<RouteCatalogRecord | null>;
    getBySlug(slug: string): Promise<RouteCatalogRecord | null>;
    list(filter: RouteCatalogListFilter): Promise<{ items: RouteCatalogRecord[]; total: number }>;
    delete(id: string): Promise<void>;
  };

  catalog: {
    create(record: CatalogItemRecord): Promise<CatalogItemRecord>;
    update(record: CatalogItemRecord): Promise<CatalogItemRecord>;
    getById(id: string): Promise<CatalogItemRecord | null>;
    getBySlug(slug: string): Promise<CatalogItemRecord | null>;
    list(filter: CatalogListFilter): Promise<CatalogItemRecord[]>;
  };

  media: {
    create(record: CatalogMediaRecord): Promise<CatalogMediaRecord>;
    update(record: CatalogMediaRecord): Promise<CatalogMediaRecord>;
    getById(id: string): Promise<CatalogMediaRecord | null>;
    listByCatalogItem(catalogItemId: string): Promise<CatalogMediaRecord[]>;
    delete(id: string): Promise<void>;
  };

  reviews: {
    create(record: ReviewRecord): Promise<ReviewRecord>;
    update(record: ReviewRecord): Promise<ReviewRecord>;
    getById(id: string): Promise<ReviewRecord | null>;
    list(filter: ReviewListFilter): Promise<ReviewRecord[]>;
    listPublishedByCatalog(catalogItemId: string): Promise<ReviewRecord[]>;
  };

  promos: {
    getByCode(code: string): Promise<PromoCodeRecord | null>;
    list(): Promise<PromoCodeRecord[]>;
    create(record: PromoCodeRecord): Promise<PromoCodeRecord>;
    update(record: PromoCodeRecord): Promise<PromoCodeRecord>;
  };

  audit: {
    append(record: AuditLogRecord): Promise<AuditLogRecord>;
    list(limit?: number): Promise<AuditLogRecord[]>;
  };

  inquiries: {
    create(record: InquiryRecord): Promise<InquiryRecord>;
    update(record: InquiryRecord): Promise<InquiryRecord>;
    getById(id: string): Promise<InquiryRecord | null>;
    list(filter?: InquiryListFilter): Promise<{ items: InquiryRecord[]; total: number }>;
  };

  notifications: {
    create(record: NotificationJobRecord): Promise<NotificationJobRecord>;
    update(record: NotificationJobRecord): Promise<NotificationJobRecord>;
    getByDedupeKey(key: string): Promise<NotificationJobRecord | null>;
    listQueued(): Promise<NotificationJobRecord[]>;
  };

  webhooks: {
    record(event: WebhookEventRecord): Promise<{ created: boolean; record: WebhookEventRecord }>;
    markProcessed(eventId: string): Promise<void>;
    hasEvent(eventId: string): Promise<boolean>;
  };

  locationCache: {
    get(key: string): Promise<{ suggestions: LocationSuggestion[]; storedAt: string } | null>;
    set(key: string, suggestions: LocationSuggestion[], storedAt: string): Promise<void>;
  };

  devices: {
    register(record: DeviceRegistrationRecord): Promise<DeviceRegistrationRecord>;
    getByDeviceId(deviceId: string): Promise<DeviceRegistrationRecord | null>;
    listByUserId(userId: string): Promise<DeviceRegistrationRecord[]>;
  };

  fareRules: {
    getActive(): Promise<FareRuleRecord | null>;
    getByVersion(version: string): Promise<FareRuleRecord | null>;
    listAll(): Promise<FareRuleRecord[]>;
    save(record: FareRuleRecord): Promise<FareRuleRecord>;
    activate(version: string): Promise<FareRuleRecord | null>;
  };
};

export type DeviceRegistrationRecord = {
  id: string;
  userId?: string | null;
  bookingId?: string | null;
  deviceId: string;
  platform: "android" | "ios" | "web";
  fcmToken: string;
  isActive: boolean;
  lastSeenAt: string;
  createdAt: string;
};

export type FareRuleRecord = {
  id: string;
  version: string;
  config: unknown;
  effectiveFrom: string;
  effectiveTo?: string | null;
  isActive: boolean;
  createdAt: string;
};
