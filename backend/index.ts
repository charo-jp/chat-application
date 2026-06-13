import { isProduction } from "./load-env.ts";
import fastify from "fastify";
import rateLimit from "@fastify/rate-limit";
import cookie from "@fastify/cookie";
import { jwtPlugin } from "./plugins/jwt.ts";
import { authRoutes } from "./routes/auth.ts";
import { userRoutes } from "./routes/users.ts";
import { rateLimitConfigurations } from "./plugins/rate-limit.ts";
import { errorHandler } from "./error-handler.ts";

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
server.setErrorHandler(errorHandler);

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
