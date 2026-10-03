// backend/src/modules/transfer-routes/transfer-routes.controller.ts
import type { FastifyReply, FastifyRequest } from "fastify";
import { requireUser } from "../../middlewares/authGuard.js";
import { sendSuccess } from "../../middlewares/errorHandler.js";
import { CONTENT_ROLES, requireRole, SUPER_ADMIN_ROLES } from "../../middlewares/roleGuard.js";
import type { createTransferRoutesService } from "./transfer-routes.service.js";
import {
  CreateTransferRouteSchema,
  TransferRouteCodeSchema,
  TransferRouteIdSchema,
  TransferRouteQuerySchema,
  UpdateTransferRouteSchema,
} from "./transfer-routes.schema.js";

export function createTransferRoutesController(service: ReturnType<typeof createTransferRoutesService>) {
  const admin = (request: FastifyRequest) => requireRole(request, CONTENT_ROLES);

  return {
    async manifest(_request: FastifyRequest, reply: FastifyReply) {
      const result = await service.list({ status: "published", limit: 100 });
      return sendSuccess(reply, result.items);
    },
    async publicGetByCode(request: FastifyRequest, reply: FastifyReply) {
      const { code } = TransferRouteCodeSchema.parse(request.params);
      const item = await service.getByCode(code);
      if (item.status !== "published") {
        reply.code(404);
        return reply.send({ success: false, error: { code: "NOT_FOUND", message: "Transfer route not found" } });
      }
      return sendSuccess(reply, item);
    },
    async list(request: FastifyRequest, reply: FastifyReply) {
      admin(request);
      return sendSuccess(reply, await service.list(TransferRouteQuerySchema.parse(request.query ?? {})));
    },
    async get(request: FastifyRequest, reply: FastifyReply) {
      admin(request);
      const { id } = TransferRouteIdSchema.parse(request.params);
      return sendSuccess(reply, await service.get(id));
    },
    async create(request: FastifyRequest, reply: FastifyReply) {
      admin(request);
      requireUser(request);
      return sendSuccess(reply, await service.create(CreateTransferRouteSchema.parse(request.body)), 201);
    },
    async update(request: FastifyRequest, reply: FastifyReply) {
      admin(request);
      requireUser(request);
      const { id } = TransferRouteIdSchema.parse(request.params);
      return sendSuccess(reply, await service.update(id, UpdateTransferRouteSchema.parse(request.body)));
    },
    async publish(request: FastifyRequest, reply: FastifyReply) {
      requireRole(request, SUPER_ADMIN_ROLES);
      requireUser(request);
      const { id } = TransferRouteIdSchema.parse(request.params);
      return sendSuccess(reply, await service.publish(id));
    },
    async archive(request: FastifyRequest, reply: FastifyReply) {
      requireRole(request, SUPER_ADMIN_ROLES);
      requireUser(request);
      const { id } = TransferRouteIdSchema.parse(request.params);
      return sendSuccess(reply, await service.archive(id));
    },
    async remove(request: FastifyRequest, reply: FastifyReply) {
      admin(request);
      requireUser(request);
      const { id } = TransferRouteIdSchema.parse(request.params);
      await service.remove(id);
      return sendSuccess(reply, { deleted: true });
    },
    async checkCode(request: FastifyRequest, reply: FastifyReply) {
      admin(request);
      const { code } = TransferRouteCodeSchema.parse(request.query ?? {});
      return sendSuccess(reply, await service.checkCode(code));
    },
  };
}
