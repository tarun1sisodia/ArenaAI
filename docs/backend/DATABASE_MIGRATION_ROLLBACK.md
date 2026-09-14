# Database Migration and Rollback Safety — Initial Phase

**Project:** SK Baghel Tour & Travels  
**Database:** Supabase PostgreSQL 16  
**Phase:** Initial production-ready MVP  
**Related documents:** [BACKEND_ARCHITECTURE_PLAN.md](BACKEND_ARCHITECTURE_PLAN.md), [MODELS.md](MODELS.md), [BACKEND_STARTING_APPROACH.md](BACKEND_STARTING_APPROACH.md)

## 1. Core Principle

Treat database migrations as versioned application code. Every schema change must be reviewed, tested, applied through automation, recorded in source control, and compatible with the application version that is running during deployment.

The safest initial-phase strategy is:

> **Expand → migrate data → switch application behavior → contract.**

Avoid destructive, irreversible changes during a normal application release.

## 2. Establish One Migration Authority

Choose one migration tool and use it consistently. Do not mix manual SQL changes, dashboard edits, ORM-generated migrations, and ad hoc scripts without a defined ownership rule.

For this architecture, migrations should be stored in the repository and applied to Supabase PostgreSQL through the selected migration tool. The exact tool may be Drizzle, Prisma, or Supabase CLI, but the project should have only one authoritative migration history.

A migration directory should be ordered and descriptive:

```text
migrations/
├── 0001_enable_extensions.sql
├── 0002_create_profiles.sql
├── 0003_create_vehicles_and_drivers.sql
├── 0004_create_bookings.sql
├── 0005_create_payments_and_refunds.sql
├── 0006_add_indexes_and_rls.sql
└── 0007_add_booking_updated_at_trigger.sql
```

Migration files should be immutable after they have been applied to a shared environment. If a migration is wrong, create a new corrective migration rather than editing the old file.

## 3. Separate Environments

Maintain at least three database environments:

| Environment | Purpose | Data policy |
|---|---|---|
| Local | Fast development and automated tests | Disposable synthetic data |
| Staging | Migration rehearsal and release validation | Sanitized or synthetic data |
| Production | Live bookings and payments | Protected, backed up, restricted access |

Never test an unverified migration first on production. Staging should be structurally equivalent to production, including PostgreSQL extensions, RLS policies, indexes, and relevant database settings.

## 4. Baseline and Migration Ledger

The migration system must maintain a ledger recording which migrations have been applied, when they were applied, and which release applied them. The deployment pipeline should fail if the database is behind the application-required migration version.

At the start of the project, capture the intended schema as migrations rather than treating the existing dashboard schema as the baseline. If a database already exists, create and verify a baseline migration before adding incremental changes.

## 5. Write Expand-and-Contract Migrations

### Expand

Add new structures without removing or invalidating old structures. Examples include adding a nullable column, creating a new table, adding a new enum value where supported, or creating a new index concurrently.

### Migrate data

Backfill existing rows in bounded batches. Record progress and make the backfill restartable. Do not hold a long transaction while updating a large table.

### Switch behavior

Deploy application code that can read the old and new representations, then begin writing the new representation. Feature flags can control the switch when the change is operationally sensitive.

### Contract

After the application no longer reads or writes the old representation, remove it in a later release. Destructive cleanup should be a separate migration with an explicit review.

## 6. Safe Examples for This Project

### Adding a booking column

Do not add a required column to a populated table without a safe default or a backfill plan.

```sql
-- Expand: safe while the old application is still running.
ALTER TABLE bookings ADD COLUMN passenger_count INTEGER;

-- Backfill in a controlled job, then enforce the rule later.
-- Contract migration happens only after application rollout and verification.
ALTER TABLE bookings ALTER COLUMN passenger_count SET NOT NULL;
```

The actual backfill and constraint timing must be chosen based on the existing data and traffic volume. Avoid making a large table rewrite part of the peak-traffic deployment.

### Renaming a column

Use a compatibility period instead of an immediate rename:

1. Add the new column.
2. Application reads the new column and falls back to the old column.
3. Application writes both columns temporarily.
4. Backfill the new column.
5. Verify parity.
6. Stop using the old column.
7. Drop the old column in a later release.

### Adding an index

For production tables with meaningful traffic, prefer a concurrent index when PostgreSQL supports it. A concurrent index avoids blocking normal writes but has operational requirements and cannot run inside a normal transaction block.

Test the index operation in staging and monitor database load. Do not add indexes speculatively; use query plans and observed access patterns.

## 7. Transaction Safety

Use transactions for changes that must succeed or fail together. In this project, payment ledger updates and booking status transitions must be atomic. A payment must not be recorded as captured while the booking remains in an inconsistent state because one statement failed.

Do not assume that every migration should be one large transaction. Small structural changes can use a transaction. Large data backfills and concurrent index creation may require separate operational procedures.

Each migration should state whether it is transactional and why. If a migration contains multiple statements that cannot be atomic, document the intermediate state and recovery step.

## 8. Application Compatibility During Deployment

Use a deployment order that keeps the old and new application versions compatible:

```text
1. Apply expand migration
2. Deploy backward-compatible application
3. Run and verify backfill
4. Enable new behavior
5. Observe metrics and logs
6. Apply contract cleanup later
```

Do not deploy application code that requires a column or table before the migration is applied. Do not remove a column while an older application instance may still be running.

For multiple running instances, assume old and new versions can overlap during a rolling deployment.

## 9. Rollback Safety Model

A deployment rollback and a database rollback are not the same operation. Rolling application code back is usually safer than reversing a production schema change. A migration that has changed or deleted data may not be safely reversible.

Use these rules:

| Change type | Preferred recovery |
|---|---|
| Application bug with compatible schema | Roll back application version |
| Additive schema change | Keep schema; roll back application if compatible |
| Bad data transformation | Stop the job, restore from backup or run a corrective migration |
| Destructive schema change | Restore to a verified recovery point or use a planned forward fix |
| Payment or booking inconsistency | Reconcile against provider records and PostgreSQL ledger; do not blindly reverse rows |

Do not automatically run a down migration in production after a failed application deployment. A down migration can destroy data needed by the previous or current application version.

## 10. Backup and Restore Requirements

Before a production migration that changes data, confirm:

- A recent Supabase backup or recovery point exists.
- The restore procedure has been tested in a non-production project.
- The migration, application release, and rollback owner are recorded.
- The expected recovery point objective and recovery time objective are understood.
- Payment and booking reconciliation steps are defined.

A backup is not sufficient evidence of safety until a restore has been rehearsed. Keep migration SQL, release identifiers, and validation queries with the recovery record.

## 11. Pre-Migration Checklist

Before applying a production migration, the engineer should verify:

- The migration is committed and reviewed.
- It has been applied successfully to a clean local database.
- It has been applied successfully to staging.
- Existing production-like data passes validation queries.
- The migration duration and lock behavior are known.
- The application version is compatible with the intermediate schema.
- A backup or recovery point is available.
- Monitoring and database access are available during the change.
- A named engineer owns execution and a second engineer reviews the plan.
- The rollback or forward-repair procedure is written down.

## 12. Post-Migration Checklist

After applying the migration:

1. Confirm the migration ledger records the expected version.
2. Run schema and constraint validation queries.
3. Check application readiness and error rates.
4. Exercise fare, booking, payment, and booking-retrieval smoke tests as relevant.
5. Check query latency and database connections.
6. Verify RLS behavior for customer, driver, dispatcher, and administrator roles.
7. Confirm that background jobs and webhooks still write successfully.
8. Observe the system for a defined period before performing contract cleanup.

## 13. Validation Queries for This Project

The release checklist should include checks for:

- Unique booking ticket IDs.
- Unique Razorpay order IDs and idempotency keys.
- Valid booking and payment status values.
- No negative fare, advance, balance, payment, or refund amounts.
- Foreign-key integrity between bookings, payments, refunds, drivers, and vehicles.
- Expected indexes on ticket ID, status, customer phone, pickup time, order ID, and booking ID.
- Correct RLS behavior and absence of public access to service-role data.

## 14. Handling Failed Migrations

If a migration fails:

1. Stop the deployment pipeline.
2. Capture the exact database error, migration version, and partial execution state.
3. Determine whether the migration transaction rolled back completely.
4. Do not rerun blindly if non-transactional statements may have succeeded.
5. Inspect the database and migration ledger.
6. Decide between a corrected forward migration, a controlled restore, or application rollback.
7. Record the incident and add a regression test or validation query.

The engineer must know whether the database is in the old state, the new state, or an intermediate state before proceeding.

## 15. Initial-Phase Recommendation

For the first production release, keep migrations small and mostly additive. Avoid renaming or deleting columns, changing payment amount types, modifying booking status semantics, or rewriting large tables during the launch window.

The first migrations should establish the core schema, constraints, indexes, and RLS. Once booking and payment traffic exists, prefer forward-compatible migrations and explicit reconciliation over automatic destructive rollback.

## 16. Definition of Done

A migration is ready for production when it is versioned, reviewed, tested locally and in staging, compatible with the deployment sequence, covered by validation queries, supported by a verified recovery point, and accompanied by a documented recovery decision.

A release is not considered safe merely because the migration command succeeds. It is safe when the application, database, payment ledger, booking lifecycle, and recovery procedure have been verified together.

## References

[1]: BACKEND_ARCHITECTURE_PLAN.md "Backend Architecture Plan — SK Baghel Tour & Travels"
[2]: MODELS.md "Backend Data Models — SK Baghel Tour & Travels"
[3]: BACKEND_STARTING_APPROACH.md "Backend Starting Approach — Engineer Workflow"

The database boundaries and initial-phase posture are based on [1] and [2]. The development workflow follows [3].
