import type { FastifyReply, FastifyRequest } from "fastify";
import { sendSuccess } from "../../middlewares/errorHandler.js";
import { CreateInquirySchema } from "./inquiry.schema.js";
import type { createInquiryService } from "./inquiry.service.js";

export function createInquiryController(service: ReturnType<typeof createInquiryService>) {
  return {
    async create(request: FastifyRequest, reply: FastifyReply) {
      const body = CreateInquirySchema.parse(request.body);
      const created = await service.create(body);
      return sendSuccess(reply, { id: created.id }, 201);
    },
  };
}
