// backend/src/modules/dossier-signoffs/dossier-signoffs.service.ts
import type { Repositories } from "../../db/types.js";
import type { Clock } from "../../shared/clock.js";
import { toIso } from "../../shared/clock.js";
import { Errors } from "../../shared/errors.js";
import { triggerFrontendRebuild } from "../../shared/deploy-hook.js";
import type { UpdateDossierSignoffInput } from "./dossier-signoffs.schema.js";

export function createDossierSignoffsService(deps: { db: Repositories; clock: Clock }) {
  return {
    async list() {
      return deps.db.dossierSignoffs.list();
    },

    async get(id: string) {
      const items = await deps.db.dossierSignoffs.list();
      const found = items.find((item) => item.id === id);
      if (!found) {
        throw Errors.notFound("DOSSIER_SIGNOFF_NOT_FOUND", "Dossier signoff item not found.");
      }
      return found;
    },

    async update(id: string, input: UpdateDossierSignoffInput, userId?: string) {
      const current = await this.get(id);
      const now = toIso(deps.clock.now());

      const nextStatus = input.status ?? current.status;
      const isApproved = nextStatus === "approved";

      const updated = await deps.db.dossierSignoffs.update({
        ...current,
        status: nextStatus,
        clientNotes: input.client_notes === undefined ? current.clientNotes : input.client_notes,
        approvedBy: isApproved ? (userId ?? current.approvedBy) : null,
        approvedAt: isApproved ? (current.approvedAt ?? now) : null,
        updatedAt: now,
      });

      // Synchronize company_profile dossier_status based on all sign-off rows
      const allSignoffs = await deps.db.dossierSignoffs.list();
      const allApproved = allSignoffs.length > 0 && allSignoffs.every((s) => s.status === "approved");
      const anyModifications = allSignoffs.some((s) => s.status === "modification_requested");

      const companyProfile = await deps.db.companyProfile.get();
      if (companyProfile) {
        const nextDossierStatus = allApproved
          ? "signed_off"
          : anyModifications
            ? "modifications_needed"
            : "pending_review";

        if (companyProfile.dossierStatus !== nextDossierStatus) {
          await deps.db.companyProfile.update({
            ...companyProfile,
            dossierStatus: nextDossierStatus,
            updatedAt: now,
          });
        }
      }

      await triggerFrontendRebuild();
      return updated;
    },
  };
}
