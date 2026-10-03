// backend/src/modules/monuments/monuments.service.ts
import type { Repositories } from "../../db/types.js";
import type { Clock } from "../../shared/clock.js";
import { toIso } from "../../shared/clock.js";
import { Errors } from "../../shared/errors.js";
import { triggerFrontendRebuild } from "../../shared/deploy-hook.js";
import type { UpdateMonumentInput } from "./monuments.schema.js";

export function createMonumentsService(deps: { db: Repositories; clock: Clock }) {
  return {
    async list() {
      return deps.db.monuments.list();
    },

    async get(id: string) {
      const items = await deps.db.monuments.list();
      const found = items.find((item) => item.id === id);
      if (!found) {
        throw Errors.notFound("MONUMENT_NOT_FOUND", "Monument not found.");
      }
      return found;
    },

    async update(id: string, input: UpdateMonumentInput) {
      const current = await this.get(id);
      const now = toIso(deps.clock.now());

      const updated = await deps.db.monuments.update({
        ...current,
        name: input.name ?? current.name,
        visitingHours: input.visiting_hours ?? current.visitingHours,
        closedNote: input.closed_note ?? current.closedNote,
        historicalContext: input.historical_context === undefined ? current.historicalContext : input.historical_context,
        sortOrder: input.sort_order ?? current.sortOrder,
        updatedAt: now,
      });

      await triggerFrontendRebuild();
      return updated;
    },
  };
}
