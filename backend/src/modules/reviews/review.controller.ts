import type { FastifyReply, FastifyRequest } from "fastify";
import { requireUser } from "../../middlewares/authGuard.js";
import { sendSuccess } from "../../middlewares/errorHandler.js";
import { requireRole, REVIEW_ROLES, SUPER_ADMIN_ROLES } from "../../middlewares/roleGuard.js";
import { CatalogSlugParamSchema } from "../catalog/catalog.schema.js";
import {
  AdminReviewQuerySchema,
  RejectReviewSchema,
  ReviewIdParamSchema,
  SubmitReviewSchema,
} from "./review.schema.js";
import type { createReviewService } from "./review.service.js";

export function createReviewController(service: ReturnType<typeof createReviewService>) {
  return {
    async listPublished(request: FastifyRequest, reply: FastifyReply) {
      const params = CatalogSlugParamSchema.parse({ slug: (request.params as { id?: string }).id });
      const data = await service.listPublished(params.slug);
      return sendSuccess(reply, data);
    },
    async submit(request: FastifyRequest, reply: FastifyReply) {
      const body = SubmitReviewSchema.parse(request.body);
      const data = await service.submit(body, request.user ?? null);
      return sendSuccess(
        reply,
        {
          id: data.id,
          status: data.status,
          verificationStatus: data.verificationStatus,
        },
        201,
      );
    },
    async listAdmin(request: FastifyRequest, reply: FastifyReply) {
      requireRole(request, REVIEW_ROLES);
      const query = AdminReviewQuerySchema.parse(request.query);
      const data = await service.listAdmin(query);
      return sendSuccess(reply, data);
    },
    async approve(request: FastifyRequest, reply: FastifyReply) {
      requireRole(request, REVIEW_ROLES);
      const actor = requireUser(request);
      const params = ReviewIdParamSchema.parse(request.params);
      const data = await service.approve(params.id, actor, request.requestId);
      return sendSuccess(reply, { id: data.id, status: data.status });
    },
    async reject(request: FastifyRequest, reply: FastifyReply) {
      requireRole(request, REVIEW_ROLES);
      const actor = requireUser(request);
      const params = ReviewIdParamSchema.parse(request.params);
      const body = RejectReviewSchema.parse(request.body ?? {});
      const data = await service.reject(params.id, actor, request.requestId, body.reason);
      return sendSuccess(reply, { id: data.id, status: data.status });
    },
    async publish(request: FastifyRequest, reply: FastifyReply) {
      requireRole(request, SUPER_ADMIN_ROLES);
      const actor = requireUser(request);
      const params = ReviewIdParamSchema.parse(request.params);
      const data = await service.publish(params.id, actor, request.requestId);
      return sendSuccess(reply, { id: data.id, status: data.status });
    },
    async archive(request: FastifyRequest, reply: FastifyReply) {
      requireRole(request, REVIEW_ROLES);
      const actor = requireUser(request);
      const params = ReviewIdParamSchema.parse(request.params);
      const data = await service.archive(params.id, actor, request.requestId);
      return sendSuccess(reply, { id: data.id, status: data.status });
    },
  };
}
