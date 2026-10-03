// backend/src/modules/cancellation-policies/cancellation-policies.schema.ts
import { z } from "zod";

const cleanText = (min: number, max: number) =>
  z
    .string()
    .trim()
    .min(min)
    .max(max)
    .transform((value) => value.replace(/<[^>]*>/g, "").trim());

export const CancellationPolicyIdSchema = z.object({
  id: z.string().uuid(),
});

export const UpdateCancellationPolicySchema = z
  .object({
    notice_period_text: cleanText(1, 120).optional(),
    fee_retained_percent: z.number().min(0).max(100).optional(),
    refund_percent: z.number().min(0).max(100).optional(),
    rule_text: cleanText(1, 500).optional(),
    refund_timeline_note: cleanText(1, 300).optional(),
  })
  .strict();

export type UpdateCancellationPolicyInput = z.infer<typeof UpdateCancellationPolicySchema>;
