// backend/src/modules/content/content.routes.ts
import type { FastifyInstance } from "fastify";
import { sendSuccess } from "../../middlewares/errorHandler.js";
import type { createCancellationPoliciesService } from "../cancellation-policies/cancellation-policies.service.js";
import type { createMonumentsService } from "../monuments/monuments.service.js";
import type { createPetPolicyService } from "../pet-policy/pet-policy.service.js";
import type { createCompanyProfileService } from "../company-profile/company-profile.service.js";
import type { createDossierSignoffsService } from "../dossier-signoffs/dossier-signoffs.service.js";

export async function registerContentManifestRoutes(
  app: FastifyInstance,
  deps: {
    cancellationPoliciesService: ReturnType<typeof createCancellationPoliciesService>;
    monumentsService: ReturnType<typeof createMonumentsService>;
    petPolicyService: ReturnType<typeof createPetPolicyService>;
    companyProfileService: ReturnType<typeof createCompanyProfileService>;
    dossierSignoffsService: ReturnType<typeof createDossierSignoffsService>;
  }
): Promise<void> {
  // Combined content manifest for public / build consumption
  app.get("/api/v1/content/manifest", {
    config: { rateLimit: { max: 120, timeWindow: "1 minute" } },
    handler: async (_request, reply) => {
      const [cancellationPolicies, monuments, petPolicy, companyProfile, dossierSignoffs] =
        await Promise.all([
          deps.cancellationPoliciesService.list(),
          deps.monumentsService.list(),
          deps.petPolicyService.get(),
          deps.companyProfileService.get(),
          deps.dossierSignoffsService.list(),
        ]);

      return sendSuccess(reply, {
        cancellationPolicies,
        monuments,
        petPolicy,
        companyProfile,
        dossierSignoffs,
      });
    },
  });
}
