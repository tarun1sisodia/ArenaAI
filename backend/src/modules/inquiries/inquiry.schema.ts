import { z } from "zod";

export const CreateInquirySchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2)
      .max(80)
      .regex(/^[a-zA-Z\s.'-]+$/, "Name must contain only letters and spaces")
      .transform((v) => v.replace(/<[^>]*>/g, "").trim()),
    phone: z.string().regex(/^\+?[0-9]{10,14}$/),
    email: z.string().email().max(255).optional(),
    message: z
      .string()
      .trim()
      .min(10)
      .max(2000)
      .refine((v) => !/<script|javascript:|on\w+=/i.test(v), "Invalid message content")
      .transform((v) => v.replace(/<[^>]*>/g, "").trim()),
    tripInterest: z
      .string()
      .trim()
      .max(160)
      .optional()
      .refine((v) => !v || !/<script/i.test(v), "Invalid trip interest"),
  })
  .strict();
