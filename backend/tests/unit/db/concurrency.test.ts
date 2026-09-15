import { describe, expect, it, vi } from "vitest";
import {
  ConcurrencyError,
  updateWithOptimisticLock,
  withRowLock,
  type SqlQueryable,
} from "../../../src/db/concurrency.js";
import { createMemoryRepositories } from "../../../src/db/memory.js";
import { calculateFare } from "../../../src/modules/fares/fare.engine.js";

describe("Database Concurrency Control & Optimistic Locking (Phase H2)", () => {
  describe("ConcurrencyError", () => {
    it("instantiates with HTTP 409 Conflict status and metadata", () => {
      const err = new ConcurrencyError("Record conflict", {
        currentVersion: 3,
        expectedVersion: 2,
        entityId: "bkg-123",
      });

      expect(err.code).toBe("CONCURRENCY_CONFLICT");
      expect(err.statusCode).toBe(409);
      expect(err.currentVersion).toBe(3);
      expect(err.expectedVersion).toBe(2);
      expect(err.details).toEqual({
        currentVersion: 3,
        expectedVersion: 2,
        entityId: "bkg-123",
      });
    });
  });

  describe("updateWithOptimisticLock", () => {
    it("successfully updates when expected version matches", async () => {
      const mockQuery = vi.fn().mockResolvedValue({
        rowCount: 1,
        rows: [{ id: "bkg-1", status: "confirmed", version: 2 }],
      });
      const client: SqlQueryable = { query: mockQuery };

      const result = await updateWithOptimisticLock({
        client,
        table: "bookings",
        id: "bkg-1",
        expectedVersion: 1,
        setClause: "status = $1",
        params: ["confirmed"],
        mapRow: (row) => row,
      });

      expect(result).toEqual({ id: "bkg-1", status: "confirmed", version: 2 });
      expect(mockQuery).toHaveBeenCalledTimes(1);
      const [sql, params] = mockQuery.mock.calls[0] as [string, unknown[]];
      expect(sql).toContain("WHERE id = $2 AND version = $3");
      expect(params).toEqual(["confirmed", "bkg-1", 1, 2]);
    });

    it("throws ConcurrencyError with version metadata when version has changed", async () => {
      // First update returns 0 rows; secondary check reveals current version is 3
      const mockQuery = vi
        .fn()
        .mockResolvedValueOnce({ rowCount: 0, rows: [] })
        .mockResolvedValueOnce({ rowCount: 1, rows: [{ version: 3 }] });
      const client: SqlQueryable = { query: mockQuery };

      await expect(
        updateWithOptimisticLock({
          client,
          table: "bookings",
          id: "bkg-1",
          expectedVersion: 1,
          setClause: "status = $1",
          params: ["confirmed"],
          mapRow: (row) => row,
        }),
      ).rejects.toThrow(ConcurrencyError);

      expect(mockQuery).toHaveBeenCalledTimes(2);
    });

    it("throws 404 AppError when record does not exist", async () => {
      const mockQuery = vi
        .fn()
        .mockResolvedValueOnce({ rowCount: 0, rows: [] })
        .mockResolvedValueOnce({ rowCount: 0, rows: [] });
      const client: SqlQueryable = { query: mockQuery };

      await expect(
        updateWithOptimisticLock({
          client,
          table: "bookings",
          id: "bkg-ghost",
          expectedVersion: 1,
          setClause: "status = $1",
          params: ["confirmed"],
          mapRow: (row) => row,
        }),
      ).rejects.toThrowError("Record in bookings with id bkg-ghost was not found");
    });
  });

  describe("withRowLock", () => {
    it("executes SELECT ... FOR UPDATE when locking a row", async () => {
      const mockQuery = vi.fn().mockResolvedValue({
        rowCount: 1,
        rows: [{ id: "bkg-1", status: "pending" }],
      });
      const client: SqlQueryable = { query: mockQuery };

      const locked = await withRowLock({
        client,
        table: "bookings",
        id: "bkg-1",
        noWait: false,
      });

      expect(locked).toEqual({ id: "bkg-1", status: "pending" });
      const [sql, params] = mockQuery.mock.calls[0] as [string, unknown[]];
      expect(sql).toBe("SELECT * FROM bookings WHERE id = $1 FOR UPDATE");
      expect(params).toEqual(["bkg-1"]);
    });

    it("executes SELECT ... FOR UPDATE NOWAIT when noWait is true", async () => {
      const mockQuery = vi.fn().mockResolvedValue({
        rowCount: 1,
        rows: [{ id: "bkg-1", status: "pending" }],
      });
      const client: SqlQueryable = { query: mockQuery };

      await withRowLock({
        client,
        table: "bookings",
        id: "bkg-1",
        noWait: true,
      });

      const [sql] = mockQuery.mock.calls[0] as [string, unknown[]];
      expect(sql).toBe("SELECT * FROM bookings WHERE id = $1 FOR UPDATE NOWAIT");
    });

    it("converts PostgreSQL 55P03 lock_not_available error into ConcurrencyError", async () => {
      const pgLockError = new Error("could not obtain lock on row in relation \"bookings\"") as Error & {
        code: string;
      };
      pgLockError.code = "55P03";

      const mockQuery = vi.fn().mockRejectedValue(pgLockError);
      const client: SqlQueryable = { query: mockQuery };

      await expect(
        withRowLock({
          client,
          table: "bookings",
          id: "bkg-contended",
          noWait: true,
        }),
      ).rejects.toThrow(ConcurrencyError);
    });
  });

  describe("Memory Repository Concurrency Integrity", () => {
    it("enforces monotonic version increments and detects concurrent conflicts", async () => {
      const repos = createMemoryRepositories();
      const created = await repos.bookings.create({
        id: "bkg-test-concurrency",
        ticketId: "AGR-20260915-1111",
        userId: null,
        guestAccessToken: "valid_guest_token_12345",
        tripType: "one-way",
        vehicleTier: "sedan",
        originName: "Agra",
        destinationName: "Delhi",
        pickupAddress: "Taj East Gate",
        dropAddress: "IGI Airport",
        pickupDatetime: new Date().toISOString(),
        returnDatetime: null,
        flightTrainNumber: null,
        distanceKm: 230,
        customerName: "Aman",
        customerPhone: "9876543210",
        customerEmail: "aman@example.com",
        baseFare: 3500,
        nightAllowance: 0,
        driverAllowance: 0,
        discountAmount: 0,
        promoCode: null,
        totalFare: 3500,
        advanceAmount: 1000,
        balanceAmount: 2500,
        fareRulesVersion: "2026-09-13",
        fareSnapshot: calculateFare({
          tripType: "one-way",
          vehicleTier: "sedan",
          originName: "Agra",
          destinationName: "Delhi",
          pickupDatetime: new Date().toISOString(),
          distanceKm: 230,
        }),
        status: "pending_payment",
        version: 1,
        specialNotes: null,
        packageId: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      expect(created.version).toBe(1);

      // Successful update incrementing to version 2
      const updated = await repos.bookings.update({
        ...created,
        status: "paid_confirmed",
        version: 2,
      });
      expect(updated.version).toBe(2);

      // Stale update still trying to update from version 1 to 2
      await expect(
        repos.bookings.update({
          ...created,
          status: "cancelled",
          version: 2,
        }),
      ).rejects.toThrow(ConcurrencyError);
    });
  });
});
