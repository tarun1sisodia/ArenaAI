import { AppError } from "../shared/errors.js";

/**
 * Concurrency & Race Condition Elimination Helpers (Phase H2 · Technique 8)
 *
 * Implements:
 * 1. ConcurrencyError: Thrown on version conflicts or lock contention (HTTP 409 Conflict).
 * 2. updateWithOptimisticLock: Atomic CAS (Compare-And-Swap) on the `version` column.
 * 3. withRowLock: Row-level locking via PostgreSQL `SELECT ... FOR UPDATE [NOWAIT]`.
 */

export class ConcurrencyError extends AppError {
  readonly currentVersion?: number;
  readonly expectedVersion?: number;

  constructor(
    message = "The record was modified concurrently by another transaction. Please reload and retry.",
    details?: { currentVersion?: number; expectedVersion?: number; entityId?: string },
  ) {
    super("CONCURRENCY_CONFLICT", message, 409, details);
    this.name = "ConcurrencyError";
    this.currentVersion = details?.currentVersion;
    this.expectedVersion = details?.expectedVersion;
  }
}

export interface SqlQueryable {
  query(sql: string, params?: unknown[]): Promise<{ rowCount: number | null; rows: unknown[] }>;
}

export interface OptimisticUpdateParams<T> {
  client: SqlQueryable;
  table: string;
  id: string;
  expectedVersion: number;
  setClause: string;
  params: unknown[];
  mapRow: (row: Record<string, unknown>) => T;
}

/**
 * Executes an optimistic locking update query.
 * Verifies that the version matches the expected version before updating.
 * Increments version by 1 upon success.
 * If 0 rows were updated, verifies whether the record was modified concurrently or deleted.
 */
export async function updateWithOptimisticLock<T>(
  options: OptimisticUpdateParams<T>,
): Promise<T> {
  const { client, table, id, expectedVersion, setClause, params, mapRow } = options;
  const newVersion = expectedVersion + 1;

  // The caller provides params without id and expectedVersion; we append them
  const idParamIndex = params.length + 1;
  const versionParamIndex = params.length + 2;
  const newVersionParamIndex = params.length + 3;

  const sql = `
    UPDATE ${table}
    SET ${setClause}, version = $${newVersionParamIndex}
    WHERE id = $${idParamIndex} AND version = $${versionParamIndex}
    RETURNING *
  `;

  const queryParams = [...params, id, expectedVersion, newVersion];
  const result = await client.query(sql, queryParams);

  if (!result.rows || result.rows.length === 0) {
    // Determine exact cause for rich diagnostics
    const checkResult = await client.query(
      `SELECT version FROM ${table} WHERE id = $1`,
      [id],
    );

    if (checkResult.rows && checkResult.rows.length > 0) {
      const currentVersion = Number((checkResult.rows[0] as { version?: unknown })?.version);
      throw new ConcurrencyError(
        `Optimistic lock failed on ${table}:${id}. Expected version ${expectedVersion}, but database has version ${currentVersion}.`,
        { currentVersion, expectedVersion, entityId: id },
      );
    }

    throw new AppError(
      "RECORD_NOT_FOUND",
      `Record in ${table} with id ${id} was not found for update.`,
      404,
      { entityId: id },
    );
  }

  return mapRow(result.rows[0] as Record<string, unknown>);
}

export interface RowLockOptions {
  client: SqlQueryable;
  table: string;
  id: string;
  noWait?: boolean;
}

/**
 * Acquires a pessimistic row-level lock on a record within a transaction.
 * Uses SELECT ... FOR UPDATE [NOWAIT].
 */
export async function withRowLock<T = Record<string, unknown>>(
  options: RowLockOptions,
): Promise<T> {
  const { client, table, id, noWait = false } = options;
  const lockClause = noWait ? "FOR UPDATE NOWAIT" : "FOR UPDATE";
  const sql = `SELECT * FROM ${table} WHERE id = $1 ${lockClause}`;

  try {
    const result = await client.query(sql, [id]);
    if (!result.rows || result.rows.length === 0) {
      throw new AppError(
        "RECORD_NOT_FOUND",
        `Record in ${table} with id ${id} not found for locking.`,
        404,
        { entityId: id },
      );
    }
    return result.rows[0] as T;
  } catch (err: unknown) {
    // PostgreSQL error code '55P03' is lock_not_available (raised by NOWAIT)
    if (
      err &&
      typeof err === "object" &&
      "code" in err &&
      (err as { code: unknown }).code === "55P03"
    ) {
      throw new ConcurrencyError(
        `Record in ${table}:${id} is locked by another concurrent transaction. Please retry shortly.`,
        { entityId: id },
      );
    }
    throw err;
  }
}
