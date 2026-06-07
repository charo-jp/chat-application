import {
  type FastifyInstance,
  type FastifyRequest,
  type FastifyReply,
} from "fastify";
import bcrypt from "bcrypt";
import prisma from "../prisma.ts";
import { loginSchema, type LoginRequest } from "../schemas/auth.schema.ts";
import {
  JWT_VALID_DURATION,
  JWT_REFRESH_DURATION,
  ACCESS_TOKEN_COOKIE_NAME,
  ACCESS_TOKEN_COOKIE_MAX_AGE,
  REFRESH_TOKEN_COOKIE_NAME,
  REFRESH_TOKEN_COOKIE_MAX_AGE,
  BCRYPT_TIMING_DUMMY,
} from "../config.ts";
import { isProduction } from "../load-env.ts";
import { TOKEN_TYPES } from "../plugins/jwt.ts";

// API Definitions------------------------------------------------------

/**
 * Signup
 */
// TODO: email verification, password verfication
// TODO: make sure to log necessary information in case errors happen.

/**
 * Login
 */
export const loginHandler = async (
  request: FastifyRequest<{ Body: LoginRequest }>,
  reply: FastifyReply,
): Promise<void> => {
  const { email, password } = request.body;
  request.log.info(`loginHandler called with email: ${email}`);

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, password: true },
  });

  const isCorrectPassword = await bcrypt.compare(
    password,
    user ? user.password : BCRYPT_TIMING_DUMMY,
  );

  // Not telling users which one is incorrect for security reason.
  // All the checks will be done here to prevent
  // Timing-attck leak because bcrypt compare is computaionally expensive.
  if (!user || !isCorrectPassword) {
    const errorMessage = "Invalid credentials";
    request.log.error(errorMessage);
    reply.status(401).send({ error: errorMessage });
    return;
  }

  const accessToken = request.server.accessTokenJwt.sign(
    { id: user.id, type: TOKEN_TYPES.ACCESS },
    { expiresIn: JWT_VALID_DURATION },
  );

  // Refresh token: longer-lived, used to mint new access tokens
  // without forcing the user to log in again.
  const refreshToken = request.server.refreshTokenJwt.sign(
    { id: user.id, type: TOKEN_TYPES.REFRESH },
    { expiresIn: JWT_REFRESH_DURATION },
  );

  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken },
  });

  // Store the refresh token in an httpOnly cookie so it is not readable by
  // client-side JS (mitigates XSS theft). Scoped to /auth so it is only sent
  // to the auth (refresh/logout) endpoints.
  reply.setCookie(ACCESS_TOKEN_COOKIE_NAME, accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "strict",
    path: "/",
    maxAge: ACCESS_TOKEN_COOKIE_MAX_AGE,
  });

  reply.setCookie(REFRESH_TOKEN_COOKIE_NAME, refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "strict",
    path: "/auth/refresh",
    maxAge: REFRESH_TOKEN_COOKIE_MAX_AGE,
  });

  reply.status(200).send();
};

/**
 * TODO: Implement Logout function
 */

/**
 * TODO: token refresh function
 */

// Routes Definitions------------------------------------------------------
export async function authRoutes(server: FastifyInstance) {
  server.addSchema(loginSchema);
  server.post(
    "/login",
    {
      schema: { body: loginSchema },
      // rate-limit setting
      config: {
        rateLimit: {
          max: 5,
          timeWindow: 1000 * 60,
          ban: 2,
        },
      },
    },
    loginHandler,
  );
}
