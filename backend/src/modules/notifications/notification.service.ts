import type { Repositories } from "../../db/types.js";
import type { Clock } from "../../shared/clock.js";
import { toIso } from "../../shared/clock.js";
import { newId } from "../../shared/ids.js";
import type { BookingRecord } from "../../types/domain.js";
import type { EmailProvider, MessagingProvider } from "../../providers/MessagingProvider.js";

export function createNotificationService(deps: {
  db: Repositories;
  clock: Clock;
  messaging: MessagingProvider;
  email: EmailProvider;
  paymentTemplate: string;
}) {
  return {
    async queuePaymentConfirmed(booking: BookingRecord): Promise<void> {
      await enqueue(deps, {
        booking,
        channel: "whatsapp",
        templateKey: deps.paymentTemplate,
        dedupeKey: `whatsapp:payment:${booking.id}`,
        payload: {
          ticketId: booking.ticketId,
          advance: String(booking.advanceAmount),
        },
      });
      if (booking.customerEmail) {
        await enqueue(deps, {
          booking,
          channel: "email",
          templateKey: "payment_confirmed",
          dedupeKey: `email:payment:${booking.id}`,
          payload: {
            to: booking.customerEmail,
            subject: `Booking ${booking.ticketId} confirmed`,
            text: `Your advance for ${booking.ticketId} is confirmed. Remaining ₹${booking.balanceAmount} is payable at the start of your trip.`,
          },
        });
      }
      await processQueued(deps);
    },
  };
}

async function enqueue(
  deps: {
    db: Repositories;
    clock: Clock;
  },
  input: {
    booking: BookingRecord;
    channel: "whatsapp" | "email";
    templateKey: string;
    dedupeKey: string;
    payload: Record<string, unknown>;
  },
): Promise<void> {
  const existing = await deps.db.notifications.getByDedupeKey(input.dedupeKey);
  if (existing) return;
  const now = toIso(deps.clock.now());
  await deps.db.notifications.create({
    id: newId(),
    bookingId: input.booking.id,
    channel: input.channel,
    templateKey: input.templateKey,
    dedupeKey: input.dedupeKey,
    payload: input.payload,
    status: "queued",
    attemptCount: 0,
    providerMessageId: null,
    lastError: null,
    createdAt: now,
    updatedAt: now,
  });
}

async function processQueued(deps: {
  db: Repositories;
  clock: Clock;
  messaging: MessagingProvider;
  email: EmailProvider;
}): Promise<void> {
  const jobs = await deps.db.notifications.listQueued();
  for (const job of jobs) {
    const now = toIso(deps.clock.now());
    try {
      if (job.channel === "whatsapp") {
        const booking = await deps.db.bookings.getById(job.bookingId);
        const result = await deps.messaging.send({
          to: booking?.customerPhone ?? "",
          templateKey: job.templateKey,
          variables: Object.fromEntries(
            Object.entries(job.payload).map(([key, value]) => [key, String(value)]),
          ),
        });
        await deps.db.notifications.update({
          ...job,
          status: "sent",
          attemptCount: job.attemptCount + 1,
          providerMessageId: result.providerMessageId,
          updatedAt: now,
        });
      } else {
        const to = String(job.payload.to ?? "");
        const result = await deps.email.send({
          to,
          subject: String(job.payload.subject ?? "SK Baghel Tour & Travels"),
          text: String(job.payload.text ?? ""),
        });
        await deps.db.notifications.update({
          ...job,
          status: "sent",
          attemptCount: job.attemptCount + 1,
          providerMessageId: result.providerMessageId,
          updatedAt: now,
        });
      }
    } catch (error) {
      await deps.db.notifications.update({
        ...job,
        status: "failed",
        attemptCount: job.attemptCount + 1,
        lastError: error instanceof Error ? error.message : "unknown",
        updatedAt: now,
      });
    }
  }
}
