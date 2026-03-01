import "dotenv/config";
import fastify from "fastify";
import { userRoutes } from "./routes/user.ts";
import { Prisma } from "./generated/prisma/client.ts";

/**
 * server
 */
const server = fastify();

/**
 * Error Handler
 */
server.setErrorHandler((error, _request, reply) => {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    // Error Codes Reference URL: https://www.prisma.io/docs/orm/reference/error-reference
    if (error.code === "P2025") {
      server.log.error(error);
      return reply.status(404).send({ error: "Not Found" });
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
    console.error(err);
    process.exit(1);
  }
  console.log(`Server listening at ${address}`);
});
