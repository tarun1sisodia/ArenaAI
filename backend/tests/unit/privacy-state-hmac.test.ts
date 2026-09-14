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
    expect(phonesMatch("+919876543221", "3221")).toBe(true);
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
});

describe("ids and money", () => {
  it("formats AGR-YYYYMMDD-XXXX tickets", () => {
    const ticket = newTicketId({ now: () => new Date("2026-09-13T10:00:00+05:30") }, 21);
    expect(ticket).toMatch(/^AGR-20260913-0021$/);
  });

  it("converts rupees to integer paise", () => {
    expect(rupeesToPaise(1400)).toBe(140000);
  });
});
