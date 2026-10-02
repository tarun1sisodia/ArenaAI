import type { Repositories } from "../../db/types.js";
import type { Clock } from "../../shared/clock.js";
import { toIso } from "../../shared/clock.js";
import { Errors } from "../../shared/errors.js";
import { newId } from "../../shared/ids.js";
import type { CreateRentalEnquiry } from "./rental-enquiry.schema.js";
export function createRentalEnquiryService(deps: { db: Repositories; clock: Clock }) {
  return {
    async create(input: CreateRentalEnquiry) {
      const now = deps.clock.now();
      return deps.db.rentalEnquiries.create({ id: newId(), ref: `RNT-${now.getUTCFullYear()}-${String(Date.now()).slice(-6)}`, name: input.name, phone: input.phone, email: input.email || null, carTier: input.carTier, pickupDate: input.pickupDate, returnDate: input.returnDate, pickupLocation: input.pickupLocation, withDriver: input.withDriver, note: input.note || null, status: "new", notes: [], createdAt: toIso(now), updatedAt: toIso(now) });
    },
    async list(filter: Parameters<Repositories["rentalEnquiries"]["list"]>[0]) { return deps.db.rentalEnquiries.list(filter); },
    async update(id: string, updates: { status?: string; note?: string }) {
      const current = await deps.db.rentalEnquiries.getById(id);
      if (!current) throw Errors.notFound("RENTAL_ENQUIRY_NOT_FOUND", "Rental request not found.");
      if (updates.status) current.status = updates.status as typeof current.status;
      if (updates.note) current.notes = [...current.notes, updates.note];
      current.updatedAt = toIso(deps.clock.now());
      return deps.db.rentalEnquiries.update(current);
    },
  };
}
