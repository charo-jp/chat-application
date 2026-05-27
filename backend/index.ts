import "dotenv/config";
import fastify from "fastify";
import { jwtPlugin } from "./plugins/jwt.ts";
import { authRoutes } from "./routes/auth.ts";
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
      // TODO: change this so that json is outputted on production mode.
      target: "pino-pretty",
    },
  },
});

/**
 * Error Handler
 */
server.setErrorHandler((error, _request, reply) => {
  server.log.error(error);
  return reply.status(500).send({ error: "Internal Server Error" });
});

/**
 * Register Plugins
 */
server.register(jwtPlugin);

/**
 * Register Routes with prefixs
 */
server.register(authRoutes, { prefix: "/auth" });
server.register(userRoutes, { prefix: "/users" });

server.listen({ port: 8080 }, (err, address) => {
  if (err) {
    server.log.error(err);
    process.exit(1);
  }
  server.log.info(`Server listening at ${address}`);
});
