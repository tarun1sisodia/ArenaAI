import type { Repositories } from "../../db/types.js";
import type { Clock } from "../../shared/clock.js";
import { toIso } from "../../shared/clock.js";
import { newId } from "../../shared/ids.js";
import type { CreateInquirySchema } from "./inquiry.schema.js";
import type { z } from "zod";

export function createInquiryService(deps: { db: Repositories; clock: Clock }) {
  return {
    async create(input: z.infer<typeof CreateInquirySchema>) {
      return deps.db.inquiries.create({
        id: newId(),
        name: input.name,
        phone: input.phone,
        email: input.email ?? null,
        message: input.message,
        tripInterest: input.tripInterest ?? null,
        createdAt: toIso(deps.clock.now()),
      });
    },
  };
}
