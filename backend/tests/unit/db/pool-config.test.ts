  import { describe, expect, it } from "vitest";
import { createPoolConfig, parsePositiveInt } from "../../../src/db/poolConfig.js";

describe("Database Connection Pool Configuration (Phase H2 · Technique 8)", () => {
  it("parses positive integers with fallback on invalid inputs", () => {
    expect(parsePositiveInt("42", 10)).toBe(42);
    expect(parsePositiveInt("-5", 10)).toBe(10);
    expect(parsePositiveInt("invalid", 10)).toBe(10);
    expect(parsePositiveInt("", 10)).toBe(10);
    expect(parsePositiveInt(undefined, 10)).toBe(10);
  });

  it("creates defensive pool config with defaults", () => {
    const config = createPoolConfig("postgres://user:pass@localhost:5432/db");

    expect(config.connectionString).toBe("postgres://user:pass@localhost:5432/db");
    expect(config.max).toBe(20);
    expect(config.min).toBe(4);
    expect(config.idleTimeoutMillis).toBe(30000);
    expect(config.connectionTimeoutMillis).toBe(3000);
    expect(config.statement_timeout).toBe(5000);
    expect(config.query_timeout).toBe(6000);
    expect(config.keepAlive).toBe(true);
    expect(config.keepAliveInitialDelayMillis).toBe(10000);
  });

  it("respects caller overrides", () => {
    const config = createPoolConfig("postgres://localhost:6543/db", {
      max: 50,
      min: 8,
      statementTimeoutMillis: 10000,
      connectionTimeoutMillis: 2000,
    });

    expect(config.max).toBe(50);
    expect(config.min).toBe(8);
    expect(config.statement_timeout).toBe(10000);
    expect(config.connectionTimeoutMillis).toBe(2000);
  });
});
