// backend/src/modules/pet-policy/pet-policy.service.ts
import type { Repositories } from "../../db/types.js";
import type { Clock } from "../../shared/clock.js";
import { toIso } from "../../shared/clock.js";
import { Errors } from "../../shared/errors.js";
import { triggerFrontendRebuild } from "../../shared/deploy-hook.js";
import type { UpdatePetPolicyInput } from "./pet-policy.schema.js";

export function createPetPolicyService(deps: { db: Repositories; clock: Clock }) {
  return {
    async get() {
      const item = await deps.db.petPolicy.get();
      if (!item) {
        throw Errors.notFound("PET_POLICY_NOT_FOUND", "Pet taxi policy not found.");
      }
      return item;
    },

    async update(input: UpdatePetPolicyInput) {
      const current = await this.get();
      const now = toIso(deps.clock.now());

      const updated = await deps.db.petPolicy.update({
        ...current,
        isOffered: input.is_offered ?? current.isOffered,
        seatProtectionNote: input.seat_protection_note ?? current.seatProtectionNote,
        breedRestrictionNote: input.breed_restriction_note ?? current.breedRestrictionNote,
        comfortStopNote: input.comfort_stop_note ?? current.comfortStopNote,
        bookingInstruction: input.booking_instruction ?? current.bookingInstruction,
        updatedAt: now,
      });

      await triggerFrontendRebuild();
      return updated;
    },
  };
}
