import type {
  AuditLogRecord,
  BookingRecord,
  BookingStatus,
  CatalogItemRecord,
  CatalogMediaRecord,
  DriverRecord,
  InquiryRecord,
  LocationSuggestion,
  NotificationJobRecord,
  PaymentRecord,

  ProfileRecord,
  PromoCodeRecord,
  RefundRecord,
  ReviewRecord,
  ReviewStatus,
  UserRole,
  VehicleRecord,
  WebhookEventRecord,
} from "../types/domain.js";

export type BookingListFilter = {
  status?: BookingStatus;
  ticketId?: string;
  driverId?: string;
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
  };

  payments: {
    create(record: PaymentRecord): Promise<PaymentRecord>;
    update(record: PaymentRecord): Promise<PaymentRecord>;
    getById(id: string): Promise<PaymentRecord | null>;
    getByIdempotencyKey(key: string): Promise<PaymentRecord | null>;
    getByProviderOrderId(providerOrderId: string): Promise<PaymentRecord | null>;
    listByBookingId(bookingId: string): Promise<PaymentRecord[]>;
    getOpenByBookingId(bookingId: string): Promise<PaymentRecord | null>;
  };

  refunds: {
    create(record: RefundRecord): Promise<RefundRecord>;
    getByIdempotencyKey(key: string): Promise<RefundRecord | null>;
    listByBookingId(bookingId: string): Promise<RefundRecord[]>;
  };

  drivers: {
    create(record: DriverRecord): Promise<DriverRecord>;
    update(record: DriverRecord): Promise<DriverRecord>;
    getById(id: string): Promise<DriverRecord | null>;
    list(): Promise<DriverRecord[]>;
  };

  vehicles: {
    getById(id: string): Promise<VehicleRecord | null>;
    list(): Promise<VehicleRecord[]>;
    create(record: VehicleRecord): Promise<VehicleRecord>;
    update(record: VehicleRecord): Promise<VehicleRecord>;
  };

  profiles: {
    getById(id: string): Promise<ProfileRecord | null>;
    getByRole(role: UserRole): Promise<ProfileRecord[]>;
    upsert(record: ProfileRecord): Promise<ProfileRecord>;
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
  };

  notifications: {
    create(record: NotificationJobRecord): Promise<NotificationJobRecord>;
    update(record: NotificationJobRecord): Promise<NotificationJobRecord>;
    getByDedupeKey(key: string): Promise<NotificationJobRecord | null>;
    listQueued(): Promise<NotificationJobRecord[]>;
  };

  webhooks: {
    record(event: WebhookEventRecord): Promise<{ created: boolean; record: WebhookEventRecord }>;
    hasEvent(eventId: string): Promise<boolean>;
  };

  locationCache: {
    get(key: string): Promise<{ suggestions: LocationSuggestion[]; storedAt: string } | null>;
    set(key: string, suggestions: LocationSuggestion[], storedAt: string): Promise<void>;
  };
};
