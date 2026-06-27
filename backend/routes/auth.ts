import {
  type FastifyInstance,
  type FastifyRequest,
  type FastifyReply,
} from "fastify";
import { loginSchema, type LoginRequest } from "../schemas/auth.schema.ts";
import { REFRESH_TOKEN_COOKIE_NAME } from "../config.ts";
import {
  authenticateUser,
  generateTokens,
  upsertLoginStatus,
  setAuthCookies,
  deleteLoginStatus,
  clearAuthCookies,
} from "../services/auth.ts";

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
  const { email, password, deviceId } = request.body;
  request.log.info({ email }, "loginHandler called");

  const user = await authenticateUser(email, password);

  // Not telling users which one is incorrect for security reason.
  if (!user) {
    request.log.error({ email }, "loginHandler: invalid credentials");
    reply.status(401).send({ error: "Invalid credentials" });
    return;
  }

  request.log.info({ userId: user.id }, "loginHandler found user");

  const { accessToken, refreshToken } = generateTokens(request.server, user.id);

  await upsertLoginStatus(user.id, deviceId, refreshToken);

  setAuthCookies(reply, accessToken, refreshToken);

  request.log.info({ email }, "Login successful");
  reply.status(200).send();
};

/**
 * Logout
 */
export const logoutHandler = async (
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> => {
  request.log.info({}, "logoutHandler called");

  const refreshToken = request.cookies[REFRESH_TOKEN_COOKIE_NAME];

  if (refreshToken) {
    await deleteLoginStatus(refreshToken);
  }

  // always leave the client in a clean state
  clearAuthCookies(reply);

  reply.status(200).send();
};

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
  server.post("/logout", logoutHandler);
}
