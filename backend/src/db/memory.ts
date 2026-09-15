import { DEFAULT_PROMO, PACKAGES } from "../modules/fares/fare.catalogue.js";
import { newId } from "../shared/ids.js";
import type {
  AuditLogRecord,
  BookingRecord,
  CatalogItemRecord,
  CatalogMediaRecord,
  InquiryRecord,
  LocationSuggestion,
  NotificationJobRecord,
  PaymentRecord,
  PaymentStatus,
  ProfileRecord,
  PromoCodeRecord,
  RefundRecord,
  ReviewRecord,
  WebhookEventRecord,
} from "../types/domain.js";
import type { BookingListFilter, CatalogListFilter, Repositories, ReviewListFilter } from "./types.js";
import { ConcurrencyError } from "./concurrency.js";

function clone<T>(value: T): T {
  return structuredClone(value);
}

export function createMemoryRepositories(nowIso = new Date().toISOString()): Repositories {
  const bookings = new Map<string, BookingRecord>();
  const bookingsByTicket = new Map<string, string>();
  const payments = new Map<string, PaymentRecord>();
  const paymentsByIdempotency = new Map<string, string>();
  const paymentsByOrder = new Map<string, string>();
  const refunds = new Map<string, RefundRecord>();
  const refundsByIdempotency = new Map<string, string>();
  const profiles = new Map<string, ProfileRecord>();
  const catalog = new Map<string, CatalogItemRecord>();
  const catalogBySlug = new Map<string, string>();
  const media = new Map<string, CatalogMediaRecord>();
  const reviews = new Map<string, ReviewRecord>();
  const promos = new Map<string, PromoCodeRecord>();
  const audit: AuditLogRecord[] = [];
  const inquiries: InquiryRecord[] = [];
  const notifications = new Map<string, NotificationJobRecord>();
  const notificationsByDedupe = new Map<string, string>();
  const webhookEvents = new Map<string, WebhookEventRecord>();
  const locationCache = new Map<string, { suggestions: LocationSuggestion[]; storedAt: string }>();
  const locks = new Map<string, Promise<void>>();

  seedReferenceData(nowIso);

  async function withLock<T>(fn: () => Promise<T>): Promise<T> {
    const previous = locks.get("tx") ?? Promise.resolve();
    let release: () => void = () => undefined;
    const current = new Promise<void>((resolve) => {
      release = resolve;
    });
    locks.set("tx", previous.then(() => current));
    await previous;
    try {
      return await fn();
    } finally {
      release();
    }
  }

  function seedReferenceData(createdAt: string): void {
    promos.set(DEFAULT_PROMO.code, {
      id: newId(),
      code: DEFAULT_PROMO.code,
      discountAmount: DEFAULT_PROMO.discount,
      minTotal: DEFAULT_PROMO.minTotal,
      description: DEFAULT_PROMO.desc,
      isActive: true,
      maxRedemptions: null,
      redemptionCount: 0,
      validFrom: null,
      validTo: null,
    });

    for (const pack of PACKAGES) {
      const item: CatalogItemRecord = {
        id: pack.id,
        type: "package",
        slug: pack.slug,
        title: pack.name,
        shortDescription: pack.name,
        description: pack.name,
        status: "published",
        durationText: pack.duration,
        routeSummary: pack.name,
        startingPriceInr: pack.from,
        version: 1,
        createdBy: null,
        updatedBy: null,
        publishedAt: createdAt,
        createdAt,
        updatedAt: createdAt,
      };
      catalog.set(item.id, item);
      catalogBySlug.set(item.slug, item.id);
    }
  }

  const repos: Repositories = {
    async healthCheck() {
      return true;
    },
    async transaction(fn) {
      return withLock(() => fn(repos));
    },
    bookings: {
      async create(record) {
        if (bookingsByTicket.has(record.ticketId)) {
          throw new Error("duplicate ticket");
        }
        bookings.set(record.id, clone(record));
        bookingsByTicket.set(record.ticketId, record.id);
        return clone(record);
      },
      async update(record) {
        const existing = bookings.get(record.id);
        if (!existing) {
          throw new Error("booking update failed: not found");
        }
        if (record.version !== existing.version + 1) {
          throw new ConcurrencyError(
            `Booking version conflict for ${record.id}: expected ${existing.version + 1}, got ${record.version}`,
            { currentVersion: existing.version, expectedVersion: record.version - 1, entityId: record.id },
          );
        }
        bookings.set(record.id, clone(record));
        bookingsByTicket.set(record.ticketId, record.id);
        return clone(record);
      },
      async getById(id) {
        const found = bookings.get(id);
        return found ? clone(found) : null;
      },
      async getByTicketId(ticketId) {
        const id = bookingsByTicket.get(ticketId);
        if (!id) return null;
        const found = bookings.get(id);
        return found ? clone(found) : null;
      },
      async ticketExists(ticketId) {
        return bookingsByTicket.has(ticketId);
      },
      async list(filter: BookingListFilter) {
        let items = [...bookings.values()];
        if (filter.status) items = items.filter((item) => item.status === filter.status);
        if (filter.ticketId) items = items.filter((item) => item.ticketId === filter.ticketId);
        if (filter.from) items = items.filter((item) => item.pickupDatetime >= filter.from!);
        if (filter.to) items = items.filter((item) => item.pickupDatetime <= filter.to!);
        items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        const total = items.length;
        const page = filter.page ?? 1;
        const pageSize = filter.pageSize ?? 20;
        const start = (page - 1) * pageSize;
        return { items: items.slice(start, start + pageSize).map(clone), total };
      },
    },
    payments: {
      async create(record) {
        payments.set(record.id, clone(record));
        paymentsByIdempotency.set(record.idempotencyKey, record.id);
        paymentsByOrder.set(record.providerOrderId, record.id);
        return clone(record);
      },
      async update(record) {
        payments.set(record.id, clone(record));
        if (record.providerOrderId) paymentsByOrder.set(record.providerOrderId, record.id);
        return clone(record);
      },
      async getById(id) {
        const found = payments.get(id);
        return found ? clone(found) : null;
      },
      async getByIdempotencyKey(key) {
        const id = paymentsByIdempotency.get(key);
        if (!id) return null;
        const found = payments.get(id);
        return found ? clone(found) : null;
      },
      async getByProviderOrderId(providerOrderId) {
        const id = paymentsByOrder.get(providerOrderId);
        if (!id) return null;
        const found = payments.get(id);
        return found ? clone(found) : null;
      },
      async listByBookingId(bookingId) {
        return [...payments.values()].filter((item) => item.bookingId === bookingId).map(clone);
      },
      async getOpenByBookingId(bookingId) {
        const open: PaymentStatus[] = ["pending"];
        const found = [...payments.values()].find(
          (item) => item.bookingId === bookingId && open.includes(item.status),
        );
        return found ? clone(found) : null;
      },
    },
    refunds: {
      async create(record) {
        refunds.set(record.id, clone(record));
        refundsByIdempotency.set(record.idempotencyKey, record.id);
        return clone(record);
      },
      async getByIdempotencyKey(key) {
        const id = refundsByIdempotency.get(key);
        if (!id) return null;
        const found = refunds.get(id);
        return found ? clone(found) : null;
      },
      async listByBookingId(bookingId) {
        return [...refunds.values()].filter((item) => item.bookingId === bookingId).map(clone);
      },
    },
    profiles: {
      async getById(id) {
        const found = profiles.get(id);
        return found ? clone(found) : null;
      },
      async getByRole(role) {
        return [...profiles.values()].filter((item) => item.role === role).map(clone);
      },
      async upsert(record) {
        profiles.set(record.id, clone(record));
        return clone(record);
      },
    },
    catalog: {
      async create(record) {
        catalog.set(record.id, clone(record));
        catalogBySlug.set(record.slug, record.id);
        return clone(record);
      },
      async update(record) {
        catalog.set(record.id, clone(record));
        catalogBySlug.set(record.slug, record.id);
        return clone(record);
      },
      async getById(id) {
        const found = catalog.get(id);
        return found ? clone(found) : null;
      },
      async getBySlug(slug) {
        const id = catalogBySlug.get(slug);
        if (!id) return null;
        const found = catalog.get(id);
        return found ? clone(found) : null;
      },
      async list(filter: CatalogListFilter) {
        let items = [...catalog.values()];
        if (filter.type) items = items.filter((item) => item.type === filter.type);
        if (filter.status) items = items.filter((item) => item.status === filter.status);
        if (filter.q) {
          const q = filter.q.toLowerCase();
          items = items.filter((item) => item.title.toLowerCase().includes(q) || item.slug.includes(q));
        }
        return items.map(clone);
      },
    },
    media: {
      async create(record) {
        media.set(record.id, clone(record));
        return clone(record);
      },
      async update(record) {
        media.set(record.id, clone(record));
        return clone(record);
      },
      async getById(id) {
        const found = media.get(id);
        return found ? clone(found) : null;
      },
      async listByCatalogItem(catalogItemId) {
        return [...media.values()]
          .filter((item) => item.catalogItemId === catalogItemId)
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map(clone);
      },
    },
    reviews: {
      async create(record) {
        reviews.set(record.id, clone(record));
        return clone(record);
      },
      async update(record) {
        reviews.set(record.id, clone(record));
        return clone(record);
      },
      async getById(id) {
        const found = reviews.get(id);
        return found ? clone(found) : null;
      },
      async list(filter: ReviewListFilter) {
        let items = [...reviews.values()];
        if (filter.status) items = items.filter((item) => item.status === filter.status);
        if (filter.catalogItemId) items = items.filter((item) => item.catalogItemId === filter.catalogItemId);
        return items.map(clone);
      },
      async listPublishedByCatalog(catalogItemId) {
        return [...reviews.values()]
          .filter((item) => item.catalogItemId === catalogItemId && item.status === "published")
          .map(clone);
      },
    },
    promos: {
      async getByCode(code) {
        const found = promos.get(code.trim().toUpperCase());
        return found ? clone(found) : null;
      },
      async list() {
        return [...promos.values()].map(clone);
      },
      async create(record) {
        promos.set(record.code, clone(record));
        return clone(record);
      },
      async update(record) {
        promos.set(record.code, clone(record));
        return clone(record);
      },
    },
    audit: {
      async append(record) {
        audit.push(clone(record));
        return clone(record);
      },
      async list(limit = 100) {
        return audit.slice(-limit).reverse().map(clone);
      },
    },
    inquiries: {
      async create(record) {
        inquiries.push(clone(record));
        return clone(record);
      },
    },
    notifications: {
      async create(record) {
        notifications.set(record.id, clone(record));
        notificationsByDedupe.set(record.dedupeKey, record.id);
        return clone(record);
      },
      async update(record) {
        notifications.set(record.id, clone(record));
        return clone(record);
      },
      async getByDedupeKey(key) {
        const id = notificationsByDedupe.get(key);
        if (!id) return null;
        const found = notifications.get(id);
        return found ? clone(found) : null;
      },
      async listQueued() {
        return [...notifications.values()].filter((item) => item.status === "queued").map(clone);
      },
    },
    webhooks: {
      async record(event) {
        const existing = webhookEvents.get(event.eventId);
        if (existing) return { created: false, record: clone(existing) };
        webhookEvents.set(event.eventId, clone(event));
        return { created: true, record: clone(event) };
      },
      async hasEvent(eventId) {
        return webhookEvents.has(eventId);
      },
    },
    locationCache: {
      async get(key) {
        const found = locationCache.get(key);
        return found ? clone(found) : null;
      },
      async set(key, suggestions, storedAt) {
        locationCache.set(key, { suggestions: clone(suggestions), storedAt });
      },
    },
  };

  return repos;
}
