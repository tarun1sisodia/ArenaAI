import { createRemoteJWKSet, jwtVerify } from "jose";
import type { FastifyRequest } from "fastify";
import type { Env } from "../config/env.js";
import { Errors } from "../shared/errors.js";
import { USER_ROLES, type AuthUser, type UserRole } from "../types/domain.js";

const TEST_ROLE_PREFIX = "test-";

export async function authenticateRequest(request: FastifyRequest, env: Env): Promise<AuthUser | null> {
  const header = request.headers.authorization;
  if (!header?.startsWith("Bearer ")) return null;
  const token = header.slice("Bearer ".length).trim();
  if (!token) return null;

  if (env.ALLOW_TEST_AUTH && token.startsWith(TEST_ROLE_PREFIX)) {
    const role = token.slice(TEST_ROLE_PREFIX.length) as UserRole;
    if (!USER_ROLES.includes(role)) {
      throw Errors.unauthorized("Unknown test role.");
    }
    return {
      id: `00000000-0000-4000-a000-0000000000${USER_ROLES.indexOf(role)}`,
      role,
      email: `${role}@test.local`,
      phone: null,
    };
  }

  if (env.SUPABASE_JWT_SECRET) {
    const secret = new TextEncoder().encode(env.SUPABASE_JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    return principalFromPayload(payload as unknown as Record<string, unknown>);
  }

  if (env.SUPABASE_URL) {
    const jwks = createRemoteJWKSet(new URL(`${env.SUPABASE_URL}/auth/v1/.well-known/jwks.json`));
    const { payload } = await jwtVerify(token, jwks);
    return principalFromPayload(payload as unknown as Record<string, unknown>);
  }

  return null;
}

function principalFromPayload(payload: Record<string, unknown>): AuthUser {
  const appMeta = asRecord(payload.app_metadata);
  const userMeta = asRecord(payload.user_metadata);
  const roleRaw = String(appMeta.role ?? userMeta.role ?? payload.role ?? "customer");
  const role = USER_ROLES.includes(roleRaw as UserRole) ? (roleRaw as UserRole) : "customer";
  return {
    id: String(payload.sub ?? ""),
    role,
    email: payload.email ? String(payload.email) : null,
    phone: payload.phone ? String(payload.phone) : null,
  };
}

export function requireUser(request: FastifyRequest): AuthUser {
  if (!request.user) throw Errors.unauthorized();
  return request.user;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}
