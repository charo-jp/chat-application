import fp from "fastify-plugin";
import fastifyJwt from "@fastify/jwt";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import {
  ACCESS_TOKEN_COOKIE_NAME,
  REFRESH_TOKEN_COOKIE_NAME,
} from "../config.ts";

export const TOKEN_TYPES = {
  ACCESS: "access",
  REFRESH: "refresh",
} as const;
type TokenTypes = (typeof TOKEN_TYPES)[keyof typeof TOKEN_TYPES];

type JwtInstance = {
  sign(
    payload: Record<string, unknown>,
    options?: { expiresIn?: string },
  ): string;
};

/**
 * It defines the TypeScript types (or shape) for the decoded
 * JWT payload and the resulting request.user object
 */
declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: { id: string; type?: TokenTypes };
    user: { id: string; type?: TokenTypes };
  }
}

/**
 * It tells TypeScript that you added a specific method (decorator) called "authenticate"
 * to FastifyInstance
 */
declare module "fastify" {
  interface FastifyInstance {
    authenticate: (
      request: FastifyRequest,
      reply: FastifyReply,
    ) => Promise<void>;
    accessTokenJwt: JwtInstance;
    refreshTokenJwt: JwtInstance;
  }
  interface FastifyRequest {
    accessTokenJwtVerify(): Promise<{ id: string; type?: TokenTypes }>;
    refreshTokenJwtVerify(): Promise<{ id: string; type?: TokenTypes }>;
  }
}

export const jwtPlugin = fp(async (fastify: FastifyInstance) => {
  // Refresh token config
  await fastify.register(fastifyJwt, {
    namespace: REFRESH_TOKEN_COOKIE_NAME,
    secret: process.env.JWT_REFRESH_TOKEN_SECRET!,
    cookie: {
      cookieName: REFRESH_TOKEN_COOKIE_NAME,
      signed: false,
    },
  });

  // Access token config
  await fastify.register(fastifyJwt, {
    namespace: ACCESS_TOKEN_COOKIE_NAME,
    secret: process.env.JWT_ACCESS_TOKEN_SECRET!,
    cookie: {
      cookieName: ACCESS_TOKEN_COOKIE_NAME,
      signed: false,
    },
  });

  // Register jwt plugin
  // Authentication decorator needs to be applied all the routes except logout and auth/refresh.
  fastify.decorate(
    "authenticate",
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        await request.accessTokenJwtVerify();
        if (request.user.type !== TOKEN_TYPES.ACCESS) {
          return reply.status(401).send({ error: "Unauthorized" });
        }
      } catch {
        reply.status(401).send({ error: "Unauthorized" });
      }
    },
  );
});
