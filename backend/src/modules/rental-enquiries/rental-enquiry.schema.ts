import { z } from "zod";
export const RENTAL_CARS = ["sedan", "ertiga", "innova", "tempo", "urbania"] as const;
export const RENTAL_STATUSES = ["new", "contacted", "quoted", "done", "closed", "spam"] as const;
const clean = (value: string) => value.replace(/<[^>]*>/g, "").trim();
export const CreateRentalEnquirySchema = z.object({
  name: z.string().trim().min(2).max(80).regex(/^[a-zA-Z\s.'-]+$/).transform(clean),
  phone: z.string().trim().regex(/^(?:\+91[-\s]?)?[6-9]\d{9}$/).transform((v) => `+91${v.replace(/\D/g, "").slice(-10)}`),
  email: z.string().trim().email().max(255).optional().or(z.literal("")),
  carTier: z.enum(RENTAL_CARS),
  pickupDate: z.string().date(),
  returnDate: z.string().date(),
  pickupLocation: z.string().trim().min(2).max(160).transform(clean),
  withDriver: z.boolean().optional().default(false),
  note: z.string().trim().max(1000).optional().or(z.literal("")).transform((v) => v ? clean(v) : undefined),
  website: z.string().max(0).optional(),
}).strict().superRefine((value, ctx) => {
  if (value.returnDate < value.pickupDate) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["returnDate"], message: "Return date must be on or after pickup date." });
  if (value.website) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["website"], message: "Invalid submission." });
});
export const RentalIdParamSchema = z.object({ id: z.string().uuid() });
export const AdminRentalQuerySchema = z.object({
  status: z.enum(RENTAL_STATUSES).optional(),
  car: z.enum(RENTAL_CARS).optional(),
  from: z.string().date().optional(),
  to: z.string().date().optional(),
  q: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});
export const UpdateRentalSchema = z.object({ status: z.enum(RENTAL_STATUSES).optional(), note: z.string().trim().min(1).max(1000).optional() }).strict();
export type CreateRentalEnquiry = z.infer<typeof CreateRentalEnquirySchema>;
