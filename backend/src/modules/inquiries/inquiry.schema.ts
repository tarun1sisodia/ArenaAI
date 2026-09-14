import { z } from "zod";

export const CreateInquirySchema = z
  .object({
    name: z.string().trim().min(2).max(80),
    phone: z.string().regex(/^\+?[0-9]{10,14}$/),
    email: z.string().email().optional(),
    message: z.string().trim().min(10).max(2000),
    tripInterest: z.string().max(160).optional(),
  })
  .strict();
