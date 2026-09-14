import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import Fastify, { type FastifyInstance } from "fastify";
import type { Logger } from "pino";
import type { Env } from "./config/env.js";
import { corsOriginList } from "./config/env.js";
import { systemClock, type Clock } from "./shared/clock.js";
import type { Repositories } from "./db/types.js";
import { createMemoryRepositories } from "./db/memory.js";
import { authenticateRequest } from "./middlewares/authGuard.js";
import { AppError, Errors } from "./shared/errors.js";
import { registerErrorHandler } from "./middlewares/errorHandler.js";
import { registerRawBody } from "./middlewares/rawBody.js";
import { registerRequestId } from "./middlewares/requestId.js";
import { createAdminController } from "./modules/admin/admin.controller.js";
import { registerAdminRoutes } from "./modules/admin/admin.routes.js";
import { createBookingController } from "./modules/bookings/booking.controller.js";
import { registerBookingRoutes } from "./modules/bookings/booking.routes.js";
import { createBookingService } from "./modules/bookings/booking.service.js";
import { createCatalogController } from "./modules/catalog/catalog.controller.js";
import { registerCatalogRoutes } from "./modules/catalog/catalog.routes.js";
import { createCatalogService } from "./modules/catalog/catalog.service.js";
import { createDispatchController } from "./modules/dispatch/dispatch.controller.js";
import { registerDispatchRoutes } from "./modules/dispatch/dispatch.routes.js";
import { createDispatchService } from "./modules/dispatch/dispatch.service.js";
import { createFareController } from "./modules/fares/fare.controller.js";
import { registerFareRoutes } from "./modules/fares/fare.routes.js";
import { createFareService } from "./modules/fares/fare.service.js";
import { CURATED_PLACES } from "./modules/fares/fare.catalogue.js";
import { createInquiryController } from "./modules/inquiries/inquiry.controller.js";
import { registerInquiryRoutes } from "./modules/inquiries/inquiry.routes.js";
import { createInquiryService } from "./modules/inquiries/inquiry.service.js";
import { createLocationController } from "./modules/locations/location.controller.js";
import { registerLocationRoutes } from "./modules/locations/location.routes.js";
import { createLocationService } from "./modules/locations/location.service.js";
import { createNotificationService } from "./modules/notifications/notification.service.js";
import { createPaymentController } from "./modules/payments/payment.controller.js";
import { registerPaymentRoutes } from "./modules/payments/payment.routes.js";
import { createPaymentService } from "./modules/payments/payment.service.js";
import { createReviewController } from "./modules/reviews/review.controller.js";
import { registerReviewRoutes } from "./modules/reviews/review.routes.js";
import { createReviewService } from "./modules/reviews/review.service.js";
import {
  createNoopEmail,
  createNoopMessaging,
  createResendEmailProvider,
  createWhatsAppProvider,
} from "./providers/MessagingProvider.js";
import {
  createLocationIqProvider,
  createStaticGeocodingProvider,
} from "./providers/GeocodingProvider.js";
import { createHmacPaymentAdapter } from "./providers/adapters/hmacCheckout.js";
import { createRazorpayAdapter } from "./providers/adapters/razorpay.js";
import type { PaymentProviderRegistry } from "./providers/PaymentProvider.js";

export type AppOptions = {
  env: Env;
  logger: Logger;
  db?: Repositories;
  clock?: Clock;
};

export type BuiltApp = {
  app: FastifyInstance;
  db: Repositories;
};

export async function buildApp(options: AppOptions): Promise<BuiltApp> {
  const env = options.env;
  const clock = options.clock ?? systemClock;
  const db = options.db ?? createMemoryRepositories(clock.now().toISOString());

  const app = Fastify({
    logger: env.LOG_LEVEL === "silent" ? false : { level: env.LOG_LEVEL },
    trustProxy: true,
  });

  registerRawBody(app);
  registerRequestId(app);
  registerErrorHandler(app);

  await app.register(helmet, { contentSecurityPolicy: false });
  await app.register(cors, {
    origin: corsOriginList(env),
    credentials: true,
  });
  await app.register(rateLimit, {
    max: 120,
    timeWindow: "1 minute",
    allowList: (request) => request.url.startsWith("/api/v1/payments/webhooks/"),
    errorResponseBuilder: () => ({
      success: false,
      error: {
        code: "RATE_LIMITED",
        message: "Too many requests. Please retry shortly.",
        requestId: "rate-limit",
      },
    }),
  });

  app.addHook("onRequest", async (request) => {
    try {
      request.user = (await authenticateRequest(request, env)) ?? undefined;
    } catch (error) {
      if (error instanceof AppError) throw error;
      if (request.headers.authorization) {
        throw Errors.unauthorized("Invalid access token.");
      }
      request.user = undefined;
    }
  });

  const providers = createPaymentProviders(env);
  const messaging = env.WHATSAPP_TOKEN && env.WHATSAPP_PHONE_NUMBER_ID
    ? createWhatsAppProvider(env.WHATSAPP_TOKEN, env.WHATSAPP_PHONE_NUMBER_ID)
    : createNoopMessaging();
  const email = env.RESEND_API_KEY
    ? createResendEmailProvider(env.RESEND_API_KEY, env.EMAIL_FROM)
    : createNoopEmail();
  const geocoding = env.LOCATIONIQ_TOKEN
    ? createLocationIqProvider(env.LOCATIONIQ_TOKEN)
    : createStaticGeocodingProvider(CURATED_PLACES);

  const notifications = createNotificationService({
    db,
    clock,
    messaging,
    email,
    paymentTemplate: env.WHATSAPP_TEMPLATE_PAYMENT,
    driverTemplate: env.WHATSAPP_TEMPLATE_DRIVER,
  });
  const fareService = createFareService(env.FARE_RULES_VERSION);
  const bookingService = createBookingService({ db, clock, fareVersion: env.FARE_RULES_VERSION });
  const paymentService = createPaymentService({ db, clock, env, providers, notifications });
  const dispatchService = createDispatchService({ db, clock, notifications });
  const catalogService = createCatalogService({ db, clock });
  const reviewService = createReviewService({ db, clock });
  const locationService = createLocationService({ db, clock, geocoding });
  const inquiryService = createInquiryService({ db, clock });

  app.get("/health", async () => ({ success: true, data: { status: "ok" } }));
  app.get("/ready", async () => {
    const ok = await db.healthCheck();
    return { success: true, data: { status: ok ? "ready" : "degraded", store: env.DATABASE_URL ? "postgres" : "memory" } };
  });

  await registerFareRoutes(app, createFareController(fareService));
  await registerLocationRoutes(app, createLocationController(locationService));
  await registerBookingRoutes(app, createBookingController(bookingService));
  await registerPaymentRoutes(app, createPaymentController(paymentService));
  await registerDispatchRoutes(app, createDispatchController(dispatchService, paymentService));
  await registerCatalogRoutes(app, createCatalogController(catalogService));
  await registerReviewRoutes(app, createReviewController(reviewService));
  await registerInquiryRoutes(app, createInquiryController(inquiryService));
  await registerAdminRoutes(app, createAdminController(db));

  return { app, db };
}

function createPaymentProviders(env: Env): PaymentProviderRegistry {
  return {
    razorpay: createRazorpayAdapter({
      keyId: env.RAZORPAY_KEY_ID,
      keySecret: env.RAZORPAY_KEY_SECRET,
      webhookSecret: env.RAZORPAY_WEBHOOK_SECRET || env.RAZORPAY_KEY_SECRET,
    }),
    paypal: createHmacPaymentAdapter({
      name: "paypal",
      webhookSecret: env.PAYPAL_WEBHOOK_SECRET || "whsec_paypal_test",
      publicKey: env.PAYPAL_CLIENT_ID,
      checkoutBaseUrl: "https://www.paypal.com/checkoutnow",
    }),
    card: createHmacPaymentAdapter({
      name: "card",
      webhookSecret: env.CARD_WEBHOOK_SECRET || "whsec_card_test",
      checkoutBaseUrl: env.CARD_CHECKOUT_BASE_URL,
    }),
  };
}
