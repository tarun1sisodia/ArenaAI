import { createRemoteJWKSet, jwtVerify } from "jose";
import type { FastifyRequest } from "fastify";
import type { Env } from "../config/env.js";
import { Errors } from "../shared/errors.js";
import { USER_ROLES, type AuthUser, type UserRole } from "../types/domain.js";

const TEST_ROLE_PREFIX = "test-";

/**
 * Secure authentication:
 * - Only trusts app_metadata.role (server-controlled), never user_metadata or payload.role which are client-writable
 * - Validates sub exists
 * - Rejects expired/invalid JWTs via jose verification
 * - Test auth is strictly opt-in and blocked in production via env validation
 */
export async function authenticateRequest(request: FastifyRequest, env: Env): Promise<AuthUser | null> {
  const header = request.headers.authorization;
  if (!header?.startsWith("Bearer ")) return null;
  const token = header.slice("Bearer ".length).trim();
  if (!token) return null;
  if (token.length > 2048) throw Errors.unauthorized("Token too long.");

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

  try {
    if (env.SUPABASE_JWT_SECRET) {
      const secret = new TextEncoder().encode(env.SUPABASE_JWT_SECRET);
      const { payload } = await jwtVerify(token, secret);
      return principalFromPayload(payload as unknown as Record<string, unknown>);
    }

    if (env.SUPABASE_URL) {
      const jwks = createRemoteJWKSet(new URL(`${env.SUPABASE_URL}/auth/v1/.well-known/jwks.json`));
      const { payload } = await jwtVerify(token, jwks, {
        issuer: `${env.SUPABASE_URL}/auth/v1`,
      });
      return principalFromPayload(payload as unknown as Record<string, unknown>);
    }
  } catch {
    throw Errors.unauthorized("Invalid or expired access token.");
  }

  return null;
}

function principalFromPayload(payload: Record<string, unknown>): AuthUser {
  const sub = String(payload.sub ?? "").trim();
  if (!sub) throw Errors.unauthorized("Token missing subject.");

  // Only trust app_metadata.role which is server-controlled
  const appMeta = asRecord(payload.app_metadata);
  const roleRaw = String(appMeta.role ?? "customer").trim();
  const role = USER_ROLES.includes(roleRaw as UserRole) ? (roleRaw as UserRole) : "customer";

  const email = payload.email ? String(payload.email).trim() : null;
  const phone = payload.phone ? String(payload.phone).trim() : null;

  return {
    id: sub,
    role,
    email: email && email.includes("@") ? email : null,
    phone: phone && /^\+?[0-9]{10,14}$/.test(phone) ? phone : null,
  };
}

export function requireUser(request: FastifyRequest): AuthUser {
  if (!request.user) throw Errors.unauthorized();
  if (!request.user.id) throw Errors.unauthorized("Invalid principal.");
  return request.user;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}
