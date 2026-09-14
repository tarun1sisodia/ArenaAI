import type { FastifyInstance } from "fastify";

export function registerRawBody(app: FastifyInstance): void {
  // Preserve raw body for HMAC verification on webhooks
  // Also handle JSON parsing safely with size limits
  app.addContentTypeParser("application/json", { parseAs: "buffer" }, (request, body, done) => {
    const buffer = Buffer.isBuffer(body) ? body : Buffer.from(String(body));
    request.rawBody = buffer;
    if (buffer.length === 0) {
      done(null, {});
      return;
    }
    // Enforce max size already via bodyLimit, but double-check
    if (buffer.length > 1_000_000) {
      done(new Error("Payload too large"), undefined);
      return;
    }
    try {
      const parsed = JSON.parse(buffer.toString("utf8")) as unknown;
      // Prevent prototype pollution - check own properties only
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        const obj = parsed as Record<string, unknown>;
        if (
          Object.prototype.hasOwnProperty.call(obj, "__proto__") ||
          Object.prototype.hasOwnProperty.call(obj, "constructor") ||
          Object.prototype.hasOwnProperty.call(obj, "prototype")
        ) {
          done(new Error("Invalid payload: prototype pollution"), undefined);
          return;
        }
      }
      done(null, parsed);
    } catch (error) {
      done(error as Error, undefined);
    }
  });
}
