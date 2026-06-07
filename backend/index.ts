import { isProduction } from "./load-env.ts";
import fastify from "fastify";
import rateLimit from "@fastify/rate-limit";
import cookie from "@fastify/cookie";
import { jwtPlugin } from "./plugins/jwt.ts";
import { authRoutes } from "./routes/auth.ts";
import { userRoutes } from "./routes/users.ts";
import { rateLimitConfigurations } from "./plugins/rate-limit.ts";

/**
 * server
 */
const server = fastify({
  logger: {
    // Redaction protects sensitive data by preventing it from showing up in logs.
    // For more details, visit https://getpino.io/#/docs/redaction
    redact: ["req.headers.authorization", "*.password", "*.token"],
    // Pretty-print logs in development; emit raw JSON in production.
    // pino-pretty is a devDependency, so it must not be referenced in prod.
    ...(isProduction
      ? {}
      : {
          transport: {
            target: "pino-pretty",
          },
        }),
  },
});

/**
 * Error Handler
 */
server.setErrorHandler((error, request, reply) => {
  if (error.validation) {
    // I want to customize the error so that I know what endpoint, what user if exists, and what field
    // maybe so that I can improve UI or something

    const method = request.method;
    const url = request.url;

    const user = request.user ? request.user : "";

    const errorMessage = `Validation Error in ${method}: ${url}, message: ${error.validation} ${user ? `by ${user}` : ""}`;

    request.log.warn(errorMessage);

    return reply.status(400).send({ error: error.validation });
  } else {
    request.log.error(error);
    return reply.status(500).send({ error: "Internal Server Error" });
  }
});

/**
 * Register Plugins
 */
server.register(jwtPlugin);
server.register(rateLimit, rateLimitConfigurations);
server.register(cookie);

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
