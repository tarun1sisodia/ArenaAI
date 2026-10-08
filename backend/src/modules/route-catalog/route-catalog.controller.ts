import type { FastifyReply, FastifyRequest } from "fastify";
import { requireUser } from "../../middlewares/authGuard.js";
import { sendSuccess } from "../../middlewares/errorHandler.js";
import { CONTENT_ROLES, requireRole, SUPER_ADMIN_ROLES } from "../../middlewares/roleGuard.js";
import { createRouteCatalogService, makeRouteSlug } from "./route-catalog.service.js";
import { CreateRouteCatalogSchema, RouteCatalogIdSchema, RouteCatalogQuerySchema, SlugCheckSchema, SuggestFaresSchema, UpdateRouteCatalogSchema } from "./route-catalog.schema.js";

export function createRouteCatalogController(service: ReturnType<typeof createRouteCatalogService>) {
  const admin = (request: FastifyRequest) => requireRole(request, CONTENT_ROLES);
  return {
    async list(request: FastifyRequest, reply: FastifyReply) { admin(request); return sendSuccess(reply, await service.list(RouteCatalogQuerySchema.parse(request.query ?? {}))); },
    async get(request: FastifyRequest, reply: FastifyReply) { admin(request); const { id } = RouteCatalogIdSchema.parse(request.params); return sendSuccess(reply, await service.get(id)); },
    async create(request: FastifyRequest, reply: FastifyReply) { admin(request); requireUser(request); return sendSuccess(reply, await service.create(CreateRouteCatalogSchema.parse(request.body)), 201); },
    async update(request: FastifyRequest, reply: FastifyReply) { admin(request); requireUser(request); const { id } = RouteCatalogIdSchema.parse(request.params); return sendSuccess(reply, await service.update(id, UpdateRouteCatalogSchema.parse(request.body))); },
    async publish(request: FastifyRequest, reply: FastifyReply) { requireRole(request, SUPER_ADMIN_ROLES); requireUser(request); const { id } = RouteCatalogIdSchema.parse(request.params); return sendSuccess(reply, await service.publish(id)); },
    async archive(request: FastifyRequest, reply: FastifyReply) { requireRole(request, SUPER_ADMIN_ROLES); requireUser(request); const { id } = RouteCatalogIdSchema.parse(request.params); return sendSuccess(reply, await service.archive(id)); },
    async remove(request: FastifyRequest, reply: FastifyReply) { admin(request); requireUser(request); const { id } = RouteCatalogIdSchema.parse(request.params); await service.remove(id); return sendSuccess(reply, { deleted: true }); },
    async slugCheck(request: FastifyRequest, reply: FastifyReply) { admin(request); return sendSuccess(reply, await service.checkSlug(SlugCheckSchema.parse(request.query ?? {}).slug)); },
    async suggestFares(request: FastifyRequest, reply: FastifyReply) { admin(request); return sendSuccess(reply, await service.suggestFares(SuggestFaresSchema.parse(request.body))); },
    async manifest(_request: FastifyRequest, reply: FastifyReply) {
      const items = (await service.list({ status: "published", limit: 1000 })).items;
      const result: typeof items = [];
      const seenSlugs = new Set<string>();
      for (const item of items) {
        if (!seenSlugs.has(item.slug)) {
          seenSlugs.add(item.slug);
          result.push(item);
        }
        if (item.destinationCity && item.tripType !== "local-tour") {
          const revSlug = makeRouteSlug(item.tripType, item.destinationCity, item.sourceCity);
          if (!seenSlugs.has(revSlug)) {
            seenSlugs.add(revSlug);
            result.push({
              ...item,
              id: `${item.id}-rev`,
              slug: revSlug,
              sourceCity: item.destinationCity,
              destinationCity: item.sourceCity,
            });
          }
        }
      }
      return sendSuccess(reply, result);
    },
    async fleets(_request: FastifyRequest, reply: FastifyReply) { return sendSuccess(reply, await service.fleets()); },
  };
}

