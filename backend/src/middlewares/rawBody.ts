import type { FastifyInstance } from "fastify";

export function registerRawBody(app: FastifyInstance): void {
  app.addContentTypeParser("application/json", { parseAs: "buffer" }, (request, body, done) => {
    const buffer = Buffer.isBuffer(body) ? body : Buffer.from(String(body));
    request.rawBody = buffer;
    if (buffer.length === 0) {
      done(null, {});
      return;
    }
    try {
      done(null, JSON.parse(buffer.toString("utf8")) as unknown);
    } catch (error) {
      done(error as Error, undefined);
    }
  });
}
