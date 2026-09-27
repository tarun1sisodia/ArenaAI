import type { FastifyReply, FastifyRequest } from "fastify";
import { requireUser } from "../../middlewares/authGuard.js";
import { sendSuccess } from "../../middlewares/errorHandler.js";
import { CONTENT_ROLES, requireRole, SUPER_ADMIN_ROLES } from "../../middlewares/roleGuard.js";
import {
  AdminCatalogQuerySchema,
  AttachMediaSchema,
  CatalogIdParamSchema,
  CatalogSlugParamSchema,
  CreateCatalogSchema,
  MediaIdParamSchema,
  UpdateCatalogSchema,
  UpdateMediaSchema,
} from "./catalog.schema.js";
import type { createCatalogService } from "./catalog.service.js";

export function createCatalogController(service: ReturnType<typeof createCatalogService>) {
  return {
    async getManifest(request: FastifyRequest, reply: FastifyReply) {
      const { manifest, etag } = await service.getManifest();
      const ifNoneMatch = request.headers["if-none-match"];
      if (ifNoneMatch && ifNoneMatch === etag) {
        return reply.status(304).send();
      }
      return reply
        .header("Cache-Control", "public, max-age=60, stale-while-revalidate=300")
        .header("ETag", etag)
        .status(200)
        .send({ status: "success", data: manifest });
    },
    async getManifestStatus(request: FastifyRequest, reply: FastifyReply) {
      requireRole(request, CONTENT_ROLES);
      const data = await service.getManifestStatus();
      return sendSuccess(reply, data);
    },
    async republish(request: FastifyRequest, reply: FastifyReply) {
      requireRole(request, CONTENT_ROLES);
      const actor = requireUser(request);
      const data = await service.republish(actor, request.requestId);
      return sendSuccess(reply, data);
    },
    async getPublished(request: FastifyRequest, reply: FastifyReply) {
      const params = CatalogSlugParamSchema.parse(request.params);
      const data = await service.getPublished(params.slug);
      return sendSuccess(reply, data);
    },
    async listAdmin(request: FastifyRequest, reply: FastifyReply) {
      requireRole(request, CONTENT_ROLES);
      const query = AdminCatalogQuerySchema.parse(request.query);
      const data = await service.listAdmin(query);
      return sendSuccess(reply, data);
    },
    async create(request: FastifyRequest, reply: FastifyReply) {
      requireRole(request, CONTENT_ROLES);
      const actor = requireUser(request);
      const body = CreateCatalogSchema.parse(request.body);
      const data = await service.create(body, actor);
      return sendSuccess(reply, data, 201);
    },
    async update(request: FastifyRequest, reply: FastifyReply) {
      requireRole(request, CONTENT_ROLES);
      const actor = requireUser(request);
      const params = CatalogIdParamSchema.parse(request.params);
      const body = UpdateCatalogSchema.parse(request.body);
      const data = await service.update(params.id, body, actor);
      return sendSuccess(reply, data);
    },
    async publish(request: FastifyRequest, reply: FastifyReply) {
      requireRole(request, SUPER_ADMIN_ROLES);
      const actor = requireUser(request);
      const params = CatalogIdParamSchema.parse(request.params);
      const data = await service.publish(params.id, actor, request.requestId);
      return sendSuccess(reply, data);
    },
    async archive(request: FastifyRequest, reply: FastifyReply) {
      requireRole(request, SUPER_ADMIN_ROLES);
      const actor = requireUser(request);
      const params = CatalogIdParamSchema.parse(request.params);
      const data = await service.archive(params.id, actor, request.requestId);
      return sendSuccess(reply, data);
    },
    async attachMedia(request: FastifyRequest, reply: FastifyReply) {
      requireRole(request, CONTENT_ROLES);
      const actor = requireUser(request);
      const params = CatalogIdParamSchema.parse(request.params);
      const body = AttachMediaSchema.parse(request.body);
      const data = await service.attachMedia(params.id, body, actor);
      return sendSuccess(reply, data, 201);
    },
    async updateMedia(request: FastifyRequest, reply: FastifyReply) {
      requireRole(request, CONTENT_ROLES);
      const actor = requireUser(request);
      const params = MediaIdParamSchema.parse(request.params);
      const body = UpdateMediaSchema.parse(request.body);
      const data = await service.updateMedia(params.id, body, actor);
      return sendSuccess(reply, data);
    },
  };
}
