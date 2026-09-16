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

export const ADMIN_ROLES = ["super_admin"] as const satisfies readonly UserRole[];
export const DISPATCH_ROLES = ADMIN_ROLES;
export const CONTENT_ROLES = ADMIN_ROLES;
export const REVIEW_ROLES = ADMIN_ROLES;
export const FINANCE_ROLES = ADMIN_ROLES;
export const SUPER_ADMIN_ROLES = ADMIN_ROLES;
