/**
 * @file route.controller.ts — Fastify HTTP request handlers for Intercity Highway Routes.
 * @usage Registered by registerRouteRoutes in Fastify instance.
 */

import type { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { requireUser } from "../../middlewares/authGuard.js";
import { sendSuccess } from "../../middlewares/errorHandler.js";
import { CONTENT_ROLES, requireRole, SUPER_ADMIN_ROLES } from "../../middlewares/roleGuard.js";
import { createRouteService, makeRouteSlug } from "./route.service.js";
import {
  CreateRouteSchema,
  UpdateRouteSchema,
  RouteQuerySchema,
} from "./route.schema.js";

const RouteIdSchema = z.object({
  id: z.string().uuid("Invalid route UUID format."),
});

const RouteSlugSchema = z.object({
  slug: z.string().trim().min(2).max(120),
});

const SuggestFaresSchema = z.object({
  trip_type: z.enum(["one-way", "round-trip"]),
  distance_km: z.number().positive().max(10000),
});

export function createRouteController(service: ReturnType<typeof createRouteService>) {
  const admin = (request: FastifyRequest) => requireRole(request, CONTENT_ROLES);

  return {
    /**
     * Admin: List all routes with filters.
     */
    async list(request: FastifyRequest, reply: FastifyReply) {
      admin(request);
      return sendSuccess(reply, await service.list(RouteQuerySchema.parse(request.query ?? {})));
    },

    /**
     * Admin: Get a single route by UUID.
     */
    async get(request: FastifyRequest, reply: FastifyReply) {
      admin(request);
      const { id } = RouteIdSchema.parse(request.params);
      return sendSuccess(reply, await service.get(id));
    },

    /**
     * Admin: Create a new route.
     */
    async create(request: FastifyRequest, reply: FastifyReply) {
      admin(request);
      requireUser(request);
      return sendSuccess(reply, await service.create(CreateRouteSchema.parse(request.body)), 201);
    },

    /**
     * Admin: Update an existing route.
     */
    async update(request: FastifyRequest, reply: FastifyReply) {
      admin(request);
      requireUser(request);
      const { id } = RouteIdSchema.parse(request.params);
      return sendSuccess(reply, await service.update(id, UpdateRouteSchema.parse(request.body)));
    },

    /**
     * Super Admin: Publish route to make it live for customers.
     */
    async publish(request: FastifyRequest, reply: FastifyReply) {
      requireRole(request, SUPER_ADMIN_ROLES);
      requireUser(request);
      const { id } = RouteIdSchema.parse(request.params);
      return sendSuccess(reply, await service.publish(id));
    },

    /**
     * Super Admin: Archive an active route.
     */
    async archive(request: FastifyRequest, reply: FastifyReply) {
      requireRole(request, SUPER_ADMIN_ROLES);
      requireUser(request);
      const { id } = RouteIdSchema.parse(request.params);
      return sendSuccess(reply, await service.archive(id));
    },

    /**
     * Admin: Delete a draft/archived route.
     */
    async remove(request: FastifyRequest, reply: FastifyReply) {
      admin(request);
      requireUser(request);
      const { id } = RouteIdSchema.parse(request.params);
      await service.remove(id);
      return sendSuccess(reply, { deleted: true });
    },

    /**
     * Admin: Check if a proposed route slug is free.
     */
    async slugCheck(request: FastifyRequest, reply: FastifyReply) {
      admin(request);
      const { slug } = RouteSlugSchema.parse(request.query ?? {});
      return sendSuccess(reply, await service.checkSlug(slug));
    },

    /**
     * Admin: Suggest base fares for distance and vehicle tiers.
     */
    async suggestFares(request: FastifyRequest, reply: FastifyReply) {
      admin(request);
      return sendSuccess(reply, await service.suggestFares(SuggestFaresSchema.parse(request.body)));
    },

    /**
     * Public: Return published routes manifest for customer website with bidirectional corridors.
     */
    async manifest(_request: FastifyRequest, reply: FastifyReply) {
      const items = (await service.list({ status: "published", limit: 1000 })).items;
      const result: typeof items = [];
      const seenSlugs = new Set<string>();

      for (const item of items) {
        if (!seenSlugs.has(item.slug)) {
          seenSlugs.add(item.slug);
          result.push(item);
        }
        if (item.destinationCity) {
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

    /**
     * Public: Fetch published route by slug.
     */
    async getBySlug(request: FastifyRequest, reply: FastifyReply) {
      const { slug } = RouteSlugSchema.parse(request.params);
      const item = await service.getBySlug(slug);
      return sendSuccess(reply, item);
    },

    /**
     * Public: Fleet configurations.
     */
    async fleets(_request: FastifyRequest, reply: FastifyReply) {
      return sendSuccess(reply, await service.fleets());
    },
  };
}
