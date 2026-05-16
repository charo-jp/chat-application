import "dotenv/config";
import fastify from "fastify";
import { userRoutes } from "./routes/users.ts";
import { Prisma } from "./generated/prisma/client.ts";

/**
 * server
 */
const server = fastify({
  logger: {
    transport: {
      // Use pino-pretty for pretty-printing logs in development
      // Use request object if you want to log request details
      target: "pino-pretty",
    },
  },
});

/**
 * Error Handler
 */
server.setErrorHandler((error, _request, reply) => {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    // Error Codes Reference URL: https://www.prisma.io/docs/orm/reference/error-reference
    if (error.code === "P2025") {
      const message = `${error.meta?.modelName} Not Found`;
      // Not Found is not a server error so warn is used instead of error.
      server.log.warn(message);
      return reply.status(404).send({ error: message });
    }
    // Add error codes here:
  }

  server.log.error(error);
  return reply.status(500).send({ error: "Internal Server Error" });
});

/**
 * Register Routes with prefixs
 */
server.register(userRoutes, { prefix: "/users" });

server.listen({ port: 8080 }, (err, address) => {
  if (err) {
    server.log.error(err);
    process.exit(1);
  }
  server.log.info(`Server listening at ${address}`);
});
