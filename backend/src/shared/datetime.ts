import { z } from "zod";

export const IsoDatetimeSchema = z
  .string()
  .min(10)
  .refine((value) => !Number.isNaN(Date.parse(value)), { message: "Invalid ISO datetime" });

export function isIsoDatetime(value: string): boolean {
  return !Number.isNaN(Date.parse(value));
}
