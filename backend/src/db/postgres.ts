import pg from "pg";
import type {
  AuditLogRecord,
  BookingRecord,
  CatalogItemRecord,
  CatalogMediaRecord,
  InquiryRecord,
  LocationSuggestion,
  NotificationJobRecord,
  PaymentRecord,
  ProfileRecord,
  PromoCodeRecord,
  RefundRecord,
  ReviewRecord,
  WebhookEventRecord,
} from "../types/domain.js";
import type { DeviceRegistrationRecord, FareRuleRecord, InquiryListFilter, PaymentListFilter, Repositories } from "./types.js";
import { createPoolConfig } from "./poolConfig.js";
import { ConcurrencyError } from "./concurrency.js";
import { phonesMatch } from "../shared/privacy.js";

type PoolClient = pg.PoolClient;

function num(value: unknown): number {
  return typeof value === "number" ? value : Number(value);
}

function mapBooking(row: Record<string, unknown>): BookingRecord {
  return {
    id: String(row.id),
    ticketId: String(row.ticket_id),
    userId: row.user_id ? String(row.user_id) : null,
    guestAccessToken: String(row.guest_access_token),
    tripType: row.trip_type as BookingRecord["tripType"],
    vehicleTier: row.vehicle_tier as BookingRecord["vehicleTier"],
    originName: String(row.origin_name),
    destinationName: String(row.destination_name),
    pickupAddress: String(row.pickup_address),
    dropAddress: row.drop_address ? String(row.drop_address) : null,
    pickupDatetime: new Date(String(row.pickup_datetime)).toISOString(),
    returnDatetime: row.return_datetime ? new Date(String(row.return_datetime)).toISOString() : null,
    flightTrainNumber: row.flight_train_number ? String(row.flight_train_number) : null,
    distanceKm: num(row.distance_km),
    customerName: String(row.customer_name),
    customerPhone: String(row.customer_phone),
    customerEmail: row.customer_email ? String(row.customer_email) : null,
    baseFare: num(row.base_fare),
    nightAllowance: num(row.night_allowance),
    driverAllowance: num(row.driver_allowance),
    discountAmount: num(row.discount_amount),
    promoCode: row.promo_code ? String(row.promo_code) : null,
    totalFare: num(row.total_fare),
    advanceAmount: num(row.advance_amount),
    balanceAmount: num(row.balance_amount),
    fareRulesVersion: String(row.fare_rules_version),
    fareSnapshot: (row.fare_snapshot as BookingRecord["fareSnapshot"]) ?? {
      baseFare: num(row.base_fare),
      nightAllowance: num(row.night_allowance),
      driverAllowance: num(row.driver_allowance),
      discountAmount: num(row.discount_amount),
      totalFare: num(row.total_fare),
      advanceAmount: num(row.advance_amount),
      balanceAmount: num(row.balance_amount),
      currency: "INR",
      fareVersion: String(row.fare_rules_version),
      label: `${row.origin_name} → ${row.destination_name}`,
      duration: "",
      distanceKm: num(row.distance_km),
      tripType: row.trip_type as BookingRecord["tripType"],
      vehicleTier: row.vehicle_tier as BookingRecord["vehicleTier"],
      promoCode: row.promo_code ? String(row.promo_code) : null,
      promoValid: Boolean(row.promo_code),
      roundMultiplierApplied: false,
      rules: [],
    },
    status: row.status as BookingRecord["status"],
    version: num(row.version),
    specialNotes: row.special_notes ? String(row.special_notes) : null,
    packageId: row.package_id ? String(row.package_id) : null,
    createdAt: new Date(String(row.created_at)).toISOString(),
    updatedAt: new Date(String(row.updated_at)).toISOString(),
  };
}

function mapPayment(row: Record<string, unknown>): PaymentRecord {
  return {
    id: String(row.id),
    bookingId: String(row.booking_id),
    provider: row.provider as PaymentRecord["provider"],
    providerOrderId: String(row.provider_order_id),
    providerPaymentId: row.provider_payment_id ? String(row.provider_payment_id) : null,
    checkoutSessionId: row.checkout_session_id ? String(row.checkout_session_id) : null,
    checkoutUrl: row.checkout_url ? String(row.checkout_url) : null,
    publicClientToken: row.public_client_token ? String(row.public_client_token) : null,
    amountMinor: num(row.amount_minor),
    currency: row.currency as PaymentRecord["currency"],
    inrAmountPaise: num(row.inr_amount_paise),
    status: row.status as PaymentRecord["status"],
    paymentMethod: row.payment_method ? String(row.payment_method) : null,
    feeMinor: num(row.fee_minor ?? 0),
    taxMinor: num(row.tax_minor ?? 0),
    idempotencyKey: String(row.idempotency_key),
    webhookEventId: row.webhook_event_id ? String(row.webhook_event_id) : null,
    reconciliationStatus: row.reconciliation_status as PaymentRecord["reconciliationStatus"],
    failureReason: row.failure_reason ? String(row.failure_reason) : null,
    verifiedAt: row.verified_at ? new Date(String(row.verified_at)).toISOString() : null,
    expiresAt: new Date(String(row.expires_at)).toISOString(),
    createdAt: new Date(String(row.created_at)).toISOString(),
    updatedAt: new Date(String(row.updated_at)).toISOString(),
  };
}

function mapInquiry(row: Record<string, unknown>): InquiryRecord {
  return {
    id: String(row.id),
    name: String(row.name),
    phone: String(row.phone),
    email: row.email ? String(row.email) : null,
    message: String(row.message),
    tripInterest: row.trip_interest ? String(row.trip_interest) : null,
    status: (row.status ? String(row.status) : "new") as InquiryRecord["status"],
    notes: Array.isArray(row.notes) ? (row.notes as string[]) : [],
    createdAt: new Date(String(row.created_at)).toISOString(),
    updatedAt: new Date(String(row.updated_at ?? row.created_at)).toISOString(),
  };
}

export async function createPostgresRepositories(databaseUrl: string): Promise<Repositories> {
  const pool = new pg.Pool(createPoolConfig(databaseUrl));

  pool.on("error", (err) => {
    console.error("Unexpected error on idle PostgreSQL client:", err);
  });

  async function query<T extends Record<string, unknown>>(
    client: pg.Pool | PoolClient,
    sql: string,
    params: unknown[] = [],
  ): Promise<T[]> {
    const result = await client.query(sql, params);
    return result.rows as T[];
  }

  const repos: Repositories = {
    async healthCheck() {
      const result = await pool.query("select 1 as ok");
      return result.rowCount === 1;
    },
    async transaction(fn) {
      const client = await pool.connect();
      try {
        // Use REPEATABLE READ to prevent phantom reads for payment and assignment flows
        await client.query("begin isolation level repeatable read");
        const bound = createBound(client);
        const transactional: Repositories = {
          healthCheck: async () => true,
          transaction: async (inner) => inner(transactional),
          ...bound,
        };
        const result = await fn(transactional);
        await client.query("commit");
        return result;
      } catch (error) {
        await client.query("rollback");
        throw error;
      } finally {
        client.release();
      }
    },
    ...createBound(pool),
  };

  function createBound(client: pg.Pool | PoolClient): Omit<Repositories, "healthCheck" | "transaction"> {
    return {
      bookings: {
        async create(record: BookingRecord) {
          const rows = await query(
            client,
            `insert into bookings (
              id, ticket_id, user_id, guest_access_token, trip_type, vehicle_tier,
              origin_name, destination_name, pickup_address, drop_address, pickup_datetime,
              return_datetime, flight_train_number, distance_km, customer_name, customer_phone,
              customer_email, base_fare, night_allowance, driver_allowance, discount_amount,
              promo_code, total_fare, advance_amount, balance_amount, fare_rules_version,
              fare_snapshot, status, version, special_notes, package_id, created_at, updated_at
            ) values (
              $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27::jsonb,$28,$29,$30,$31,$32,$33
            ) returning *`,
            [
              record.id, record.ticketId, record.userId, record.guestAccessToken, record.tripType,
              record.vehicleTier, record.originName, record.destinationName, record.pickupAddress,
              record.dropAddress, record.pickupDatetime, record.returnDatetime, record.flightTrainNumber,
              record.distanceKm, record.customerName, record.customerPhone, record.customerEmail,
              record.baseFare, record.nightAllowance, record.driverAllowance, record.discountAmount,
              record.promoCode, record.totalFare, record.advanceAmount, record.balanceAmount,
              record.fareRulesVersion, JSON.stringify(record.fareSnapshot), record.status, record.version,
              record.specialNotes, record.packageId, record.createdAt, record.updatedAt,
            ],
          );
          return mapBooking(rows[0]!);
        },
        async update(record: BookingRecord) {
          // Optimistic locking: ensure version increments by 1, prevent lost updates
          // FIND-011: update all mutable fields on the record
          const rows = await query(
            client,
            `update bookings set
              trip_type=$2, vehicle_tier=$3, origin_name=$4, destination_name=$5,
              pickup_address=$6, drop_address=$7, pickup_datetime=$8, return_datetime=$9,
              flight_train_number=$10, distance_km=$11, customer_name=$12, customer_phone=$13,
              customer_email=$14, base_fare=$15, night_allowance=$16, driver_allowance=$17,
              discount_amount=$18, promo_code=$19, total_fare=$20, advance_amount=$21,
              balance_amount=$22, fare_snapshot=$23::jsonb, status=$24, version=$25,
              special_notes=$26, updated_at=$27
              where id=$1 and version=$25-1 returning *`,
            [
              record.id, record.tripType, record.vehicleTier, record.originName, record.destinationName,
              record.pickupAddress, record.dropAddress, record.pickupDatetime, record.returnDatetime,
              record.flightTrainNumber, record.distanceKm, record.customerName, record.customerPhone,
              record.customerEmail, record.baseFare, record.nightAllowance, record.driverAllowance,
              record.discountAmount, record.promoCode, record.totalFare, record.advanceAmount,
              record.balanceAmount, JSON.stringify(record.fareSnapshot), record.status, record.version,
              record.specialNotes, record.updatedAt,
            ],
          );
          if (!rows[0]) {
            // Try to get current version to give better error
            const current = await query(client, "select version from bookings where id=$1", [record.id]);
            if (current[0]) {
              const currentVer = num(current[0].version);
              throw new ConcurrencyError(
                `booking version conflict: expected ${currentVer + 1} got ${record.version}`,
                { currentVersion: currentVer, expectedVersion: record.version - 1, entityId: record.id },
              );
            }
            throw new Error("booking update failed: not found");
          }
          return mapBooking(rows[0]);
        },
        async getById(id: string) {
          // Use FOR UPDATE when inside transaction to lock row
          const isTx = "release" in client && typeof (client as { release?: unknown }).release === "function";
          const sql = isTx ? "select * from bookings where id=$1 for update" : "select * from bookings where id=$1";
          const rows = await query(client, sql, [id]);
          return rows[0] ? mapBooking(rows[0]) : null;
        },
        async getByTicketId(ticketId: string) {
          const rows = await query(client, "select * from bookings where ticket_id=$1", [ticketId]);
          return rows[0] ? mapBooking(rows[0]) : null;
        },
        async ticketExists(ticketId: string) {
          const rows = await query(client, "select 1 from bookings where ticket_id=$1", [ticketId]);
          return rows.length > 0;
        },
        async list(filter) {
          const clauses: string[] = [];
          const params: unknown[] = [];
          if (filter.status) {
            params.push(filter.status);
            clauses.push(`status=$${params.length}`);
          }
          if (filter.ticketId) {
            params.push(filter.ticketId);
            clauses.push(`ticket_id=$${params.length}`);
          }
          if (filter.from) {
            params.push(filter.from);
            clauses.push(`pickup_datetime >= $${params.length}`);
          }
          if (filter.to) {
            params.push(filter.to);
            clauses.push(`pickup_datetime <= $${params.length}`);
          }
          const where = clauses.length ? `where ${clauses.join(" and ")}` : "";
          const countRows = await query(client, `select count(*)::int as total from bookings ${where}`, params);
          const page = filter.page ?? 1;
          const pageSize = filter.pageSize ?? 20;
          params.push(pageSize, (page - 1) * pageSize);
          const rows = await query(
            client,
            `select * from bookings ${where} order by created_at desc limit $${params.length - 1} offset $${params.length}`,
            params,
          );
          return { items: rows.map(mapBooking), total: num(countRows[0]?.total ?? 0) };
        },
        async listByPhone(phone: string, options: { from: string }) {
          const digits = phone.replace(/\D/g, "");
          const suffix = digits.slice(-10);
          const rows = await query(
            client,
            `select * from bookings where created_at >= $1 and (customer_phone = $2 or customer_phone like $3) order by created_at desc`,
            [options.from, phone, `%${suffix}`],
          );
          const items = rows.map(mapBooking);
          return items.filter((item) => phonesMatch(item.customerPhone, phone));
        },
      },
      payments: {
        async create(record: PaymentRecord) {
          const rows = await query(
            client,
            `insert into payments (
              id, booking_id, provider, provider_order_id, provider_payment_id, checkout_session_id,
              checkout_url, public_client_token, amount_minor, currency, inr_amount_paise, status,
              payment_method, fee_minor, tax_minor, idempotency_key, webhook_event_id,
              reconciliation_status, failure_reason, verified_at, expires_at, created_at, updated_at
            ) values (
              $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23
            ) returning *`,
            [
              record.id, record.bookingId, record.provider, record.providerOrderId, record.providerPaymentId,
              record.checkoutSessionId, record.checkoutUrl, record.publicClientToken, record.amountMinor,
              record.currency, record.inrAmountPaise, record.status, record.paymentMethod, record.feeMinor,
              record.taxMinor, record.idempotencyKey, record.webhookEventId, record.reconciliationStatus,
              record.failureReason, record.verifiedAt, record.expiresAt, record.createdAt, record.updatedAt,
            ],
          );
          return mapPayment(rows[0]!);
        },
        async update(record: PaymentRecord) {
          const rows = await query(
            client,
            `update payments set
              provider_payment_id=$2, status=$3, payment_method=$4, fee_minor=$5, tax_minor=$6,
              webhook_event_id=$7, reconciliation_status=$8, failure_reason=$9, verified_at=$10, updated_at=$11
              where id=$1 returning *`,
            [
              record.id, record.providerPaymentId, record.status, record.paymentMethod, record.feeMinor,
              record.taxMinor, record.webhookEventId, record.reconciliationStatus, record.failureReason,
              record.verifiedAt, record.updatedAt,
            ],
          );
          if (!rows[0]) throw new Error("payment update failed");
          return mapPayment(rows[0]!);
        },
        async getById(id: string) {
          const isTx = "release" in client && typeof (client as { release?: unknown }).release === "function";
          const sql = isTx ? "select * from payments where id=$1 for update" : "select * from payments where id=$1";
          const rows = await query(client, sql, [id]);
          return rows[0] ? mapPayment(rows[0]) : null;
        },
        async getByIdempotencyKey(key: string) {
          const rows = await query(client, "select * from payments where idempotency_key=$1", [key]);
          return rows[0] ? mapPayment(rows[0]) : null;
        },
        async getByProviderOrderId(providerOrderId: string) {
          const rows = await query(client, "select * from payments where provider_order_id=$1", [providerOrderId]);
          return rows[0] ? mapPayment(rows[0]) : null;
        },
        async listByBookingId(bookingId: string) {
          const rows = await query(client, "select * from payments where booking_id=$1 order by created_at desc", [bookingId]);
          return rows.map(mapPayment);
        },
        async getOpenByBookingId(bookingId: string) {
          const rows = await query(
            client,
            "select * from payments where booking_id=$1 and status='pending' order by created_at desc limit 1 for update",
            [bookingId],
          );
          return rows[0] ? mapPayment(rows[0]) : null;
        },
        async list(filter?: PaymentListFilter) {
          const clauses: string[] = [];
          const params: unknown[] = [];
          if (filter?.bookingId) {
            params.push(filter.bookingId);
            clauses.push(`booking_id=$${params.length}`);
          }
          if (filter?.status) {
            params.push(filter.status);
            clauses.push(`status=$${params.length}`);
          }
          if (filter?.provider) {
            params.push(filter.provider);
            clauses.push(`provider=$${params.length}`);
          }
          const where = clauses.length ? `where ${clauses.join(" and ")}` : "";
          const aggRows = await query(
            client,
            `select
               count(*)::int as total,
               coalesce(sum(case when status='captured' then inr_amount_paise else 0 end), 0)::bigint as total_captured,
               coalesce(sum(case when status='refunded' then inr_amount_paise else 0 end), 0)::bigint as total_refunded
             from payments ${where}`,
            params,
          );
          const page = filter?.page ?? 1;
          const pageSize = filter?.limit ?? 50;
          const offset = (page - 1) * pageSize;
          const queryParams = [...params, pageSize, offset];
          const rows = await query(
            client,
            `select * from payments ${where} order by created_at desc limit $${queryParams.length - 1} offset $${queryParams.length}`,
            queryParams,
          );
          return {
            items: rows.map(mapPayment),
            total: num(aggRows[0]?.total ?? 0),
            totalCapturedPaise: num(aggRows[0]?.total_captured ?? 0),
            totalRefundedPaise: num(aggRows[0]?.total_refunded ?? 0),
          };
        },
      },
      refunds: {
        async create(record: RefundRecord) {
          await query(
            client,
            `insert into refunds (id, payment_id, booking_id, provider_refund_id, amount_minor, currency, reason, status, idempotency_key, created_at)
             values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
            [
              record.id, record.paymentId, record.bookingId, record.providerRefundId, record.amountMinor,
              record.currency, record.reason, record.status, record.idempotencyKey, record.createdAt,
            ],
          );
          return record;
        },
        async getByIdempotencyKey(key: string) {
          const rows = await query(client, "select * from refunds where idempotency_key=$1", [key]);
          const row = rows[0];
          if (!row) return null;
          return {
            id: String(row.id),
            paymentId: String(row.payment_id),
            bookingId: String(row.booking_id),
            providerRefundId: row.provider_refund_id ? String(row.provider_refund_id) : null,
            amountMinor: num(row.amount_minor),
            currency: row.currency as RefundRecord["currency"],
            reason: String(row.reason),
            status: row.status as RefundRecord["status"],
            idempotencyKey: String(row.idempotency_key),
            createdAt: new Date(String(row.created_at)).toISOString(),
          };
        },
        async listByBookingId(bookingId: string) {
          const rows = await query(client, "select * from refunds where booking_id=$1 order by created_at desc", [bookingId]);
          return rows.map((row) => ({
            id: String(row.id),
            paymentId: String(row.payment_id),
            bookingId: String(row.booking_id),
            providerRefundId: row.provider_refund_id ? String(row.provider_refund_id) : null,
            amountMinor: num(row.amount_minor),
            currency: row.currency as RefundRecord["currency"],
            reason: String(row.reason),
            status: row.status as RefundRecord["status"],
            idempotencyKey: String(row.idempotency_key),
            createdAt: new Date(String(row.created_at)).toISOString(),
          }));
        },
      },

      profiles: {
        async getById(id: string) {
          const rows = await query(client, "select * from profiles where id=$1", [id]);
          const row = rows[0];
          if (!row) return null;
          return mapProfile(row);
        },
        async getByRole(role) {
          const rows = await query(client, "select * from profiles where role=$1", [role]);
          return rows.map(mapProfile);
        },
        async upsert(record: ProfileRecord) {
          await query(
            client,
            `insert into profiles (id, full_name, phone, email, role, created_at, updated_at)
             values ($1,$2,$3,$4,$5,$6,$7)
             on conflict (id) do update set full_name=excluded.full_name, phone=excluded.phone, email=excluded.email, role=excluded.role, updated_at=excluded.updated_at`,
            [record.id, record.fullName, record.phone, record.email, record.role, record.createdAt, record.updatedAt],
          );
          return record;
        },
      },
      catalog: {
        async create(record: CatalogItemRecord) {
          await insertCatalog(client, record);
          return record;
        },
        async update(record: CatalogItemRecord) {
          await query(
            client,
            `update catalog_items set title=$2, short_description=$3, description=$4, status=$5, duration_text=$6,
             route_summary=$7, starting_price_inr=$8, distance_km=$9, availability=$10, seats_left=$11,
             stops=$12, trip_type=$13, version=$14, updated_by=$15, published_at=$16, updated_at=$17
             where id=$1`,
            [
              record.id, record.title, record.shortDescription, record.description, record.status,
              record.durationText, record.routeSummary, record.startingPriceInr, record.distanceKm,
              record.availability, record.seatsLeft, record.stops, record.tripType, record.version,
              record.updatedBy, record.publishedAt, record.updatedAt,
            ],
          );
          return record;
        },
        async getById(id: string) {
          const rows = await query(client, "select * from catalog_items where id=$1", [id]);
          return rows[0] ? mapCatalog(rows[0]) : null;
        },
        async getBySlug(slug: string) {
          const rows = await query(client, "select * from catalog_items where slug=$1", [slug]);
          return rows[0] ? mapCatalog(rows[0]) : null;
        },
        async list(filter) {
          const clauses: string[] = [];
          const params: unknown[] = [];
          if (filter.type) {
            params.push(filter.type);
            clauses.push(`type=$${params.length}`);
          }
          if (filter.status) {
            params.push(filter.status);
            clauses.push(`status=$${params.length}`);
          }
          if (filter.q) {
            params.push(`%${filter.q}%`);
            clauses.push(`(title ilike $${params.length} or slug ilike $${params.length})`);
          }
          const where = clauses.length ? `where ${clauses.join(" and ")}` : "";
          const rows = await query(client, `select * from catalog_items ${where} order by updated_at desc`, params);
          return rows.map(mapCatalog);
        },
      },
      media: {
        async create(record: CatalogMediaRecord) {
          await query(
            client,
            `insert into catalog_item_media (
              id, catalog_item_id, storage_path, media_type, alt_text, caption, sort_order, status,
              source_type, copyright_owner, mime_type, content_base64, size_bytes,
              created_by, approved_by, published_at, created_at
            ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)`,
            [
              record.id, record.catalogItemId, record.storagePath, record.mediaType, record.altText,
              record.caption, record.sortOrder, record.status, record.sourceType, record.copyrightOwner,
              record.mimeType, record.contentBase64, record.sizeBytes,
              record.createdBy, record.approvedBy, record.publishedAt, record.createdAt,
            ],
          );
          return record;
        },
        async update(record: CatalogMediaRecord) {
          await query(
            client,
            `update catalog_item_media set alt_text=$2, caption=$3, sort_order=$4, status=$5, approved_by=$6, published_at=$7 where id=$1`,
            [record.id, record.altText, record.caption, record.sortOrder, record.status, record.approvedBy, record.publishedAt],
          );
          return record;
        },
        async getById(id: string) {
          const rows = await query(client, "select * from catalog_item_media where id=$1", [id]);
          return rows[0] ? mapMedia(rows[0]) : null;
        },
        async listByCatalogItem(catalogItemId: string) {
          const rows = await query(
            client,
            "select * from catalog_item_media where catalog_item_id=$1 order by sort_order",
            [catalogItemId],
          );
          return rows.map(mapMedia);
        },
        async delete(id: string) {
          await query(client, "delete from catalog_item_media where id=$1", [id]);
        },
      },
      reviews: {
        async create(record: ReviewRecord) {
          await query(
            client,
            `insert into reviews (
              id, booking_id, catalog_item_id, customer_id, display_name, rating, review_text, status,
              verification_status, social_profile_url, social_platform, verification_notes, reviewed_by,
              reviewed_at, published_at, guest_access_token, created_at
            ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)`,
            [
              record.id, record.bookingId, record.catalogItemId, record.customerId, record.displayName,
              record.rating, record.reviewText, record.status, record.verificationStatus, record.socialProfileUrl,
              record.socialPlatform, record.verificationNotes, record.reviewedBy, record.reviewedAt,
              record.publishedAt, record.guestAccessToken, record.createdAt,
            ],
          );
          return record;
        },
        async update(record: ReviewRecord) {
          await query(
            client,
            `update reviews set status=$2, verification_status=$3, verification_notes=$4, reviewed_by=$5,
             reviewed_at=$6, published_at=$7 where id=$1`,
            [
              record.id, record.status, record.verificationStatus, record.verificationNotes,
              record.reviewedBy, record.reviewedAt, record.publishedAt,
            ],
          );
          return record;
        },
        async getById(id: string) {
          const rows = await query(client, "select * from reviews where id=$1", [id]);
          return rows[0] ? mapReview(rows[0]) : null;
        },
        async list(filter) {
          const clauses: string[] = [];
          const params: unknown[] = [];
          if (filter.status) {
            params.push(filter.status);
            clauses.push(`status=$${params.length}`);
          }
          if (filter.catalogItemId) {
            params.push(filter.catalogItemId);
            clauses.push(`catalog_item_id=$${params.length}`);
          }
          const where = clauses.length ? `where ${clauses.join(" and ")}` : "";
          const rows = await query(client, `select * from reviews ${where} order by created_at desc`, params);
          return rows.map(mapReview);
        },
        async listPublishedByCatalog(catalogItemId: string) {
          const rows = await query(
            client,
            "select * from reviews where catalog_item_id=$1 and status='published' order by published_at desc",
            [catalogItemId],
          );
          return rows.map(mapReview);
        },
      },
      promos: {
        async getByCode(code: string) {
          const rows = await query(client, "select * from promo_codes where code=$1", [code.trim().toUpperCase()]);
          return rows[0] ? mapPromo(rows[0]) : null;
        },
        async list() {
          const rows = await query(client, "select * from promo_codes order by code");
          return rows.map(mapPromo);
        },
        async create(record: PromoCodeRecord) {
          await query(
            client,
            `insert into promo_codes (id, code, discount_amount, min_total, description, is_active, max_redemptions, redemption_count, valid_from, valid_to)
             values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
            [
              record.id, record.code, record.discountAmount, record.minTotal, record.description, record.isActive,
              record.maxRedemptions, record.redemptionCount, record.validFrom, record.validTo,
            ],
          );
          return record;
        },
        async update(record: PromoCodeRecord) {
          await query(
            client,
            `update promo_codes set discount_amount=$2, min_total=$3, is_active=$4, redemption_count=$5 where id=$1`,
            [record.id, record.discountAmount, record.minTotal, record.isActive, record.redemptionCount],
          );
          return record;
        },
      },
      audit: {
        async append(record: AuditLogRecord) {
          await query(
            client,
            `insert into admin_audit_logs (id, actor_id, actor_role, resource_type, resource_id, action, before_state, after_state, reason, request_id, created_at)
             values ($1,$2,$3,$4,$5,$6,$7::jsonb,$8::jsonb,$9,$10,$11)`,
            [
              record.id, record.actorId, record.actorRole, record.resourceType, record.resourceId, record.action,
              JSON.stringify(record.before), JSON.stringify(record.after), record.reason, record.requestId, record.createdAt,
            ],
          );
          return record;
        },
        async list(limit = 100) {
          const rows = await query(client, "select * from admin_audit_logs order by created_at desc limit $1", [limit]);
          return rows.map((row) => ({
            id: String(row.id),
            actorId: String(row.actor_id),
            actorRole: row.actor_role as AuditLogRecord["actorRole"],
            resourceType: String(row.resource_type),
            resourceId: String(row.resource_id),
            action: String(row.action),
            before: (row.before_state as Record<string, unknown> | null) ?? null,
            after: (row.after_state as Record<string, unknown> | null) ?? null,
            reason: row.reason ? String(row.reason) : null,
            requestId: String(row.request_id),
            createdAt: new Date(String(row.created_at)).toISOString(),
          }));
        },
      },
      inquiries: {
        async create(record: InquiryRecord) {
          const rows = await query(
            client,
            `insert into inquiries (id, name, phone, email, message, trip_interest, status, notes, created_at, updated_at)
             values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) returning *`,
            [
              record.id, record.name, record.phone, record.email, record.message,
              record.tripInterest, record.status, record.notes, record.createdAt, record.updatedAt,
            ],
          );
          return mapInquiry(rows[0]!);
        },
        async update(record: InquiryRecord) {
          const rows = await query(
            client,
            `update inquiries set
               name=$2, phone=$3, email=$4, message=$5, trip_interest=$6,
               status=$7, notes=$8, updated_at=$9
             where id=$1 returning *`,
            [
              record.id, record.name, record.phone, record.email, record.message,
              record.tripInterest, record.status, record.notes, record.updatedAt,
            ],
          );
          if (!rows[0]) throw new Error("inquiry update failed: not found");
          return mapInquiry(rows[0]!);
        },
        async getById(id: string) {
          const rows = await query(client, "select * from inquiries where id=$1", [id]);
          return rows[0] ? mapInquiry(rows[0]) : null;
        },
        async list(filter?: InquiryListFilter) {
          const clauses: string[] = [];
          const params: unknown[] = [];
          if (filter?.status) {
            params.push(filter.status);
            clauses.push(`status=$${params.length}`);
          }
          if (filter?.q) {
            params.push(`%${filter.q.toLowerCase()}%`);
            clauses.push(`(lower(name) like $${params.length} or phone like $${params.length} or lower(coalesce(email, '')) like $${params.length} or lower(coalesce(trip_interest, '')) like $${params.length} or lower(message) like $${params.length})`);
          }
          const where = clauses.length ? `where ${clauses.join(" and ")}` : "";
          const countRows = await query(client, `select count(*)::int as total from inquiries ${where}`, params);
          const page = filter?.page ?? 1;
          const limit = filter?.limit ?? 50;
          const offset = (page - 1) * limit;
          const queryParams = [...params, limit, offset];
          const rows = await query(
            client,
            `select * from inquiries ${where} order by created_at desc limit $${queryParams.length - 1} offset $${queryParams.length}`,
            queryParams,
          );
          return {
            items: rows.map(mapInquiry),
            total: num(countRows[0]?.total ?? 0),
          };
        },
      },
      notifications: {
        async create(record: NotificationJobRecord) {
          await query(
            client,
            `insert into notification_jobs (id, booking_id, channel, template_key, dedupe_key, payload, status, attempt_count, provider_message_id, last_error, created_at, updated_at)
             values ($1,$2,$3,$4,$5,$6::jsonb,$7,$8,$9,$10,$11,$12)`,
            [
              record.id, record.bookingId, record.channel, record.templateKey, record.dedupeKey,
              JSON.stringify(record.payload), record.status, record.attemptCount, record.providerMessageId,
              record.lastError, record.createdAt, record.updatedAt,
            ],
          );
          return record;
        },
        async update(record: NotificationJobRecord) {
          await query(
            client,
            `update notification_jobs set status=$2, attempt_count=$3, provider_message_id=$4, last_error=$5, updated_at=$6 where id=$1`,
            [record.id, record.status, record.attemptCount, record.providerMessageId, record.lastError, record.updatedAt],
          );
          return record;
        },
        async getByDedupeKey(key: string) {
          const rows = await query(client, "select * from notification_jobs where dedupe_key=$1", [key]);
          return rows[0] ? mapNotification(rows[0]) : null;
        },
        async listQueued() {
          const rows = await query(client, "select * from notification_jobs where status='queued' and attempt_count < 3");
          return rows.map(mapNotification);
        },
      },
      webhooks: {
        async record(event: WebhookEventRecord) {
          const existing = await query(client, "select * from raw_webhooks where event_id=$1", [event.eventId]);
          if (existing[0]) {
            return { created: false, record: mapWebhook(existing[0]) };
          }
          await query(
            client,
            `insert into raw_webhooks (id, provider, event_id, event_type, payload, payload_hash, processed, received_at)
             values ($1,$2,$3,$4,$5::jsonb,$6,$7,$8)`,
            [
              event.id, event.provider, event.eventId, event.eventType, JSON.stringify(event.payload),
              event.payloadHash, event.processed, event.receivedAt,
            ],
          );
          return { created: true, record: event };
        },
        async hasEvent(eventId: string) {
          const rows = await query(client, "select 1 from raw_webhooks where event_id=$1", [eventId]);
          return rows.length > 0;
        },
      },
      locationCache: {
        async get(key: string) {
          const rows = await query(client, "select suggestions, stored_at from location_cache where cache_key=$1", [key]);
          const row = rows[0];
          if (!row) return null;
          return {
            suggestions: row.suggestions as LocationSuggestion[],
            storedAt: new Date(String(row.stored_at)).toISOString(),
          };
        },
        async set(key: string, suggestions: LocationSuggestion[], storedAt: string) {
          await query(
            client,
            `insert into location_cache (cache_key, suggestions, stored_at)
             values ($1,$2::jsonb,$3)
             on conflict (cache_key) do update set suggestions=excluded.suggestions, stored_at=excluded.stored_at`,
            [key, JSON.stringify(suggestions), storedAt],
          );
        },
      },
      devices: {
        async register(record: DeviceRegistrationRecord) {
          await query(
            client,
            `insert into device_registrations (id, user_id, booking_id, device_id, platform, fcm_token, is_active, last_seen_at, created_at)
             values ($1,$2,$3,$4,$5,$6,$7,$8,$9)
             on conflict (user_id, device_id) do update set fcm_token=excluded.fcm_token, is_active=excluded.is_active, last_seen_at=excluded.last_seen_at`,
            [
              record.id, record.userId || null, record.bookingId || null, record.deviceId,
              record.platform, record.fcmToken, record.isActive, record.lastSeenAt, record.createdAt,
            ],
          );
          return record;
        },
        async getByDeviceId(deviceId: string) {
          const rows = await query(client, "select * from device_registrations where device_id=$1 and is_active=true", [deviceId]);
          if (!rows[0]) return null;
          return {
            id: String(rows[0].id),
            userId: rows[0].user_id ? String(rows[0].user_id) : null,
            bookingId: rows[0].booking_id ? String(rows[0].booking_id) : null,
            deviceId: String(rows[0].device_id),
            platform: rows[0].platform as DeviceRegistrationRecord["platform"],
            fcmToken: String(rows[0].fcm_token),
            isActive: Boolean(rows[0].is_active),
            lastSeenAt: new Date(String(rows[0].last_seen_at)).toISOString(),
            createdAt: new Date(String(rows[0].created_at)).toISOString(),
          };
        },
        async listByUserId(userId: string) {
          const rows = await query(client, "select * from device_registrations where user_id=$1 and is_active=true", [userId]);
          return rows.map((r) => ({
            id: String(r.id),
            userId: r.user_id ? String(r.user_id) : null,
            bookingId: r.booking_id ? String(r.booking_id) : null,
            deviceId: String(r.device_id),
            platform: r.platform as DeviceRegistrationRecord["platform"],
            fcmToken: String(r.fcm_token),
            isActive: Boolean(r.is_active),
            lastSeenAt: new Date(String(r.last_seen_at)).toISOString(),
            createdAt: new Date(String(r.created_at)).toISOString(),
          }));
        },
      },
      fareRules: {
        async getActive() {
          const rows = await query(client, "select * from fare_rules where is_active=true order by created_at desc limit 1");
          if (!rows[0]) return null;
          return {
            id: String(rows[0].id),
            version: String(rows[0].version),
            config: rows[0].config,
            effectiveFrom: new Date(String(rows[0].effective_from)).toISOString(),
            effectiveTo: rows[0].effective_to ? new Date(String(rows[0].effective_to)).toISOString() : null,
            isActive: Boolean(rows[0].is_active),
            createdAt: new Date(String(rows[0].created_at)).toISOString(),
          };
        },
        async save(record: FareRuleRecord) {
          await query(
            client,
            `insert into fare_rules (id, version, config, effective_from, effective_to, is_active, created_at)
             values ($1,$2,$3::jsonb,$4,$5,$6,$7)
             on conflict (version) do update set config=excluded.config, is_active=excluded.is_active`,
            [
              record.id, record.version, JSON.stringify(record.config),
              record.effectiveFrom, record.effectiveTo || null, record.isActive, record.createdAt,
            ],
          );
          return record;
        },
      },
    };
  }

  return repos;
}



function mapProfile(row: Record<string, unknown>): ProfileRecord {
  return {
    id: String(row.id),
    fullName: String(row.full_name),
    phone: String(row.phone),
    email: row.email ? String(row.email) : null,
    role: row.role as ProfileRecord["role"],
    createdAt: new Date(String(row.created_at)).toISOString(),
    updatedAt: new Date(String(row.updated_at)).toISOString(),
  };
}

function mapCatalog(row: Record<string, unknown>): CatalogItemRecord {
  return {
    id: String(row.id),
    type: row.type as CatalogItemRecord["type"],
    slug: String(row.slug),
    title: String(row.title),
    shortDescription: String(row.short_description),
    description: String(row.description),
    status: row.status as CatalogItemRecord["status"],
    durationText: String(row.duration_text),
    routeSummary: String(row.route_summary),
    startingPriceInr: num(row.starting_price_inr),
    distanceKm: row.distance_km === null || row.distance_km === undefined ? null : num(row.distance_km),
    availability: (row.availability as CatalogItemRecord["availability"]) ?? "available",
    seatsLeft: row.seats_left === null || row.seats_left === undefined ? null : num(row.seats_left),
    stops: Array.isArray(row.stops) ? row.stops.map((s) => String(s)) : [],
    tripType: (row.trip_type as CatalogItemRecord["tripType"]) ?? null,
    version: num(row.version),
    createdBy: row.created_by ? String(row.created_by) : null,
    updatedBy: row.updated_by ? String(row.updated_by) : null,
    publishedAt: row.published_at ? new Date(String(row.published_at)).toISOString() : null,
    createdAt: new Date(String(row.created_at)).toISOString(),
    updatedAt: new Date(String(row.updated_at)).toISOString(),
  };
}

function mapMedia(row: Record<string, unknown>): CatalogMediaRecord {
  return {
    id: String(row.id),
    catalogItemId: String(row.catalog_item_id),
    storagePath: String(row.storage_path),
    mediaType: row.media_type as CatalogMediaRecord["mediaType"],
    altText: String(row.alt_text),
    caption: row.caption ? String(row.caption) : null,
    sortOrder: num(row.sort_order),
    status: row.status as CatalogMediaRecord["status"],
    sourceType: row.source_type as CatalogMediaRecord["sourceType"],
    copyrightOwner: row.copyright_owner ? String(row.copyright_owner) : null,
    mimeType: row.mime_type ? String(row.mime_type) : null,
    contentBase64: row.content_base64 ? String(row.content_base64) : null,
    sizeBytes: row.size_bytes === null || row.size_bytes === undefined ? null : num(row.size_bytes),
    createdBy: row.created_by ? String(row.created_by) : null,
    approvedBy: row.approved_by ? String(row.approved_by) : null,
    publishedAt: row.published_at ? new Date(String(row.published_at)).toISOString() : null,
    createdAt: new Date(String(row.created_at)).toISOString(),
  };
}

function mapReview(row: Record<string, unknown>): ReviewRecord {
  return {
    id: String(row.id),
    bookingId: row.booking_id ? String(row.booking_id) : null,
    catalogItemId: row.catalog_item_id ? String(row.catalog_item_id) : null,
    customerId: row.customer_id ? String(row.customer_id) : null,
    displayName: String(row.display_name),
    rating: num(row.rating),
    reviewText: String(row.review_text),
    status: row.status as ReviewRecord["status"],
    verificationStatus: row.verification_status as ReviewRecord["verificationStatus"],
    socialProfileUrl: row.social_profile_url ? String(row.social_profile_url) : null,
    socialPlatform: row.social_platform ? String(row.social_platform) : null,
    verificationNotes: row.verification_notes ? String(row.verification_notes) : null,
    reviewedBy: row.reviewed_by ? String(row.reviewed_by) : null,
    reviewedAt: row.reviewed_at ? new Date(String(row.reviewed_at)).toISOString() : null,
    publishedAt: row.published_at ? new Date(String(row.published_at)).toISOString() : null,
    guestAccessToken: row.guest_access_token ? String(row.guest_access_token) : null,
    createdAt: new Date(String(row.created_at)).toISOString(),
  };
}

function mapPromo(row: Record<string, unknown>): PromoCodeRecord {
  return {
    id: String(row.id),
    code: String(row.code),
    discountAmount: num(row.discount_amount),
    minTotal: num(row.min_total),
    description: String(row.description),
    isActive: Boolean(row.is_active),
    maxRedemptions: row.max_redemptions === null || row.max_redemptions === undefined ? null : num(row.max_redemptions),
    redemptionCount: num(row.redemption_count),
    validFrom: row.valid_from ? new Date(String(row.valid_from)).toISOString() : null,
    validTo: row.valid_to ? new Date(String(row.valid_to)).toISOString() : null,
  };
}

function mapNotification(row: Record<string, unknown>): NotificationJobRecord {
  return {
    id: String(row.id),
    bookingId: String(row.booking_id),
    channel: row.channel as NotificationJobRecord["channel"],
    templateKey: String(row.template_key),
    dedupeKey: String(row.dedupe_key),
    payload: (row.payload as Record<string, unknown>) ?? {},
    status: row.status as NotificationJobRecord["status"],
    attemptCount: num(row.attempt_count),
    providerMessageId: row.provider_message_id ? String(row.provider_message_id) : null,
    lastError: row.last_error ? String(row.last_error) : null,
    createdAt: new Date(String(row.created_at)).toISOString(),
    updatedAt: new Date(String(row.updated_at)).toISOString(),
  };
}

function mapWebhook(row: Record<string, unknown>): WebhookEventRecord {
  return {
    id: String(row.id),
    provider: String(row.provider),
    eventId: String(row.event_id),
    eventType: String(row.event_type),
    payload: row.payload,
    payloadHash: String(row.payload_hash),
    processed: Boolean(row.processed),
    receivedAt: new Date(String(row.received_at)).toISOString(),
  };
}

async function insertCatalog(client: pg.Pool | PoolClient, record: CatalogItemRecord): Promise<void> {
  await client.query(
    `insert into catalog_items (
      id, type, slug, title, short_description, description, status, duration_text, route_summary,
      starting_price_inr, distance_km, availability, seats_left, stops, trip_type, version,
      created_by, updated_by, published_at, created_at, updated_at
    ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)`,
    [
      record.id, record.type, record.slug, record.title, record.shortDescription, record.description,
      record.status, record.durationText, record.routeSummary, record.startingPriceInr,
      record.distanceKm, record.availability, record.seatsLeft, record.stops, record.tripType, record.version,
      record.createdBy, record.updatedBy, record.publishedAt, record.createdAt, record.updatedAt,
    ],
  );
}
