// backend/src/modules/company-profile/company-profile.service.ts
import type { Repositories } from "../../db/types.js";
import type { Clock } from "../../shared/clock.js";
import { toIso } from "../../shared/clock.js";
import { Errors } from "../../shared/errors.js";
import { triggerFrontendRebuild } from "../../shared/deploy-hook.js";
import type { UpdateCompanyProfileInput } from "./company-profile.schema.js";

export function createCompanyProfileService(deps: { db: Repositories; clock: Clock }) {
  return {
    async get() {
      const item = await deps.db.companyProfile.get();
      if (!item) {
        throw Errors.notFound("COMPANY_PROFILE_NOT_FOUND", "Company profile not found.");
      }
      return item;
    },

    async update(input: UpdateCompanyProfileInput) {
      const current = await this.get();
      const now = toIso(deps.clock.now());

      const updated = await deps.db.companyProfile.update({
        ...current,
        brandName: input.brand_name ?? current.brandName,
        officeAddress: input.office_address ?? current.officeAddress,
        primaryPhone: input.primary_phone ?? current.primaryPhone,
        whatsappNumber: input.whatsapp_number ?? current.whatsappNumber,
        email: input.email ?? current.email,
        gstin: input.gstin ?? current.gstin,
        operatingHours: input.operating_hours ?? current.operatingHours,
        mapsLocation: input.maps_location ?? current.mapsLocation,
        dossierVersion: input.dossier_version ?? current.dossierVersion,
        dossierStatus: input.dossier_status ?? current.dossierStatus,
        updatedAt: now,
      });

      await triggerFrontendRebuild();
      return updated;
    },
  };
}
