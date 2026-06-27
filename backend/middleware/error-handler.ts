import type { FastifyError, FastifyReply, FastifyRequest } from "fastify";

/**
 * Global error handler.
 *
 * - Validation errors (thrown by Fastify's JSON Schema step) → 400 with the
 *   validation detail, logged at `warn` since they are client mistakes.
 * - Everything else → 500 with a generic message, logged at `error` with the
 *   request-scoped logger so the reqId is attached.
 */
export const errorHandler = (
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  if (error.validation) {
    const method = request.method;
    const url = request.url;

    const user = request.user ? request.user : "";

    const errorMessage = `Validation Error in ${method}: ${url}, message: ${JSON.stringify(error.validation)} ${user ? `by ${user.id}` : ""}`;

    request.log.warn(errorMessage);

    return reply.status(400).send({ error: JSON.stringify(error.validation) });
  } else {
    request.log.error(error);
    return reply.status(500).send({ error: "Internal Server Error" });
  }
};
