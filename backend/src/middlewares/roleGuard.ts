import type { FastifyRequest } from "fastify";
import { Errors } from "../shared/errors.js";
import type { UserRole } from "../types/domain.js";

export function requireRole(request: FastifyRequest, roles: readonly UserRole[]): void {
  const user = request.user;
  if (!user) throw Errors.unauthorized();
  if (user.role === "super_admin") return;
  if (!roles.includes(user.role)) {
    throw Errors.forbidden("Insufficient role for this operations endpoint.");
  }
}

export const DISPATCH_ROLES = ["dispatcher", "super_admin"] as const satisfies readonly UserRole[];
export const CONTENT_ROLES = ["content_editor", "super_admin"] as const satisfies readonly UserRole[];
export const REVIEW_ROLES = ["review_moderator", "super_admin"] as const satisfies readonly UserRole[];
export const FINANCE_ROLES = ["finance_operator", "super_admin"] as const satisfies readonly UserRole[];
export const SUPER_ADMIN_ROLES = ["super_admin"] as const satisfies readonly UserRole[];
