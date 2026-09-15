import { describe, expect, it } from "vitest";
import { hmacSha256Hex, verifyHmacSha256Hex } from "../../src/shared/hmac.js";
import { maskEmail, maskPhone, phonesMatch } from "../../src/shared/privacy.js";
import { assertTransition, canTransition } from "../../src/shared/stateMachine.js";
import { newTicketId } from "../../src/shared/ids.js";
import { rupeesToPaise } from "../../src/shared/money.js";

describe("privacy", () => {
  it("masks phone and email", () => {
    expect(maskPhone("+919876543221")).toMatch(/\*\*/);
    expect(maskEmail("sam@gmail.com")).toBe("s****@gmail.com");
    // Secure matching: exact match only, no last4 bypass
    expect(phonesMatch("+919876543221", "+919876543221")).toBe(true);
    expect(phonesMatch("9876543221", "9876543221")).toBe(true);
    // Normalization: with and without country code should match if same number
    expect(phonesMatch("+919876543221", "9876543221")).toBe(true);
    // Partial matching (last4) must fail for security
    expect(phonesMatch("+919876543221", "3221")).toBe(false);
    expect(phonesMatch("+919876543221", "43221")).toBe(false);
  });
});

describe("booking state machine", () => {
  it("allows the documented happy path", () => {
    expect(canTransition("draft", "pending_payment")).toBe(true);
    expect(canTransition("pending_payment", "paid_confirmed")).toBe(true);
    expect(canTransition("paid_confirmed", "in_transit")).toBe(true);
    expect(canTransition("in_transit", "completed")).toBe(true);
  });

  it("rejects skipping payment confirmation", () => {
    expect(canTransition("pending_payment", "in_transit")).toBe(false);
    expect(() => assertTransition("pending_payment", "completed")).toThrow(/Cannot transition booking/);
  });
});

describe("hmac", () => {
  it("verifies razorpay-style signatures over the raw body", () => {
    const body = Buffer.from('{"id":"evt_1"}');
    const signature = hmacSha256Hex("whsec_razorpay_test", body);
    expect(verifyHmacSha256Hex("whsec_razorpay_test", body, signature)).toBe(true);
    expect(verifyHmacSha256Hex("whsec_razorpay_test", body, "deadbeef")).toBe(false);
  });

  it("rejects empty secret or signature", () => {
    const body = Buffer.from('{"id":"evt_1"}');
    expect(verifyHmacSha256Hex("", body, "abc")).toBe(false);
    expect(verifyHmacSha256Hex("secret", body, "")).toBe(false);
  });
});

describe("ids and money", () => {
  it("formats AGR-YYYYMMDD-XXXX tickets", () => {
    const ticket = newTicketId({ now: () => new Date("2026-09-13T10:00:00+05:30") }, 21);
    expect(ticket).toMatch(/^AGR-20260913-0021$/);
  });

  it("converts rupees to integer paise", () => {
    expect(rupeesToPaise(1400)).toBe(140000);
  });

  it("validates advance calculation edge cases", async () => {
    const { advanceOf } = await import("../../src/shared/money.js");
    expect(advanceOf(1000)).toBe(500); // min 500
    expect(advanceOf(400)).toBe(400); // if total <500, advance = total
    expect(advanceOf(10000)).toBe(2800); // 28% rounded to 100
    expect(() => advanceOf(0)).toThrow();
    expect(() => advanceOf(NaN)).toThrow();
  });
});
