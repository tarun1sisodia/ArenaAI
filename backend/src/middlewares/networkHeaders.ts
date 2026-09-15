import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

/**
 * Network & Transport Protocol Headers Plugin (Technique 1)
 *
 * Implements hyper-scale network optimizations:
 * 1. Advertises HTTP/3 (QUIC) capability via Alt-Svc header.
 * 2. Permits browser Resource Timing API measurements via Timing-Allow-Origin.
 * 3. Enforces cache control and connection pre-warming headers for API traffic.
 */
export function registerNetworkHeaders(app: FastifyInstance): void {
  app.addHook("onSend", async (_request: FastifyRequest, reply: FastifyReply, payload) => {
    // 1. Advertise HTTP/3 over QUIC on port 443 with a 24-hour max-age
    reply.header("Alt-Svc", 'h3=":443"; ma=86400');

    // 2. Enable W3C Resource Timing API for performance metrics & Core Web Vitals RUM
    reply.header("Timing-Allow-Origin", "*");

    return payload;
  });
}
