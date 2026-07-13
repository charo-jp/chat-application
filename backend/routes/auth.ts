import {
  type FastifyInstance,
  type FastifyRequest,
  type FastifyReply,
} from "fastify";
import {
  loginSchema,
  signupSchema,
  type LoginRequestType,
  type SignupRequestType,
} from "../schemas/auth.schema.ts";
import prisma from "../prisma.ts";
import { REFRESH_TOKEN_COOKIE_NAME } from "../config.ts";
import {
  authenticateUser,
  createSession,
  deleteLoginStatus,
  clearAuthCookies,
  doesUserExist,
  isUsernameUnique,
  isPasswordSafe,
} from "../services/auth.ts";
import bcrypt from "bcrypt";

// API Definitions------------------------------------------------------

/**
 * Signup
 */
// TODO: email verification, password verfication
export const signupHandler = async (
  request: FastifyRequest<{ Body: SignupRequestType }>,
  reply: FastifyReply,
) => {
  const { email, password, username, deviceId } = request.body;

  request.log.info({ email }, "signupHandler called");

  // email is unique (if not, direct to login!)
  const userExists = await doesUserExist(email);

  if (userExists) {
    request.log.error({ email }, "email already exists");
    reply
      .status(400)
      .send({ error: "An account with this email already exists" });
    return;
  }

  // check the username is unique
  const usernameUnique = await isUsernameUnique(username);

  if (!usernameUnique) {
    request.log.error({ username }, "username already exists");
    reply.status(400).send({ error: "This username is already taken" });
    return;
  }

  const { isSafe, warning, suggestions } = isPasswordSafe(password);

  if (!isSafe) {
    request.log.error(
      { email },
      `Warning: ${warning}, Suggestions: ${suggestions}`,
    );
    reply.status(400).send({ details: { warning, suggestions } });
    return;
  }

  // if succeed, let the user login
  const hashedPassword = await bcrypt.hash(password, 10);

  // create a user
  const user = await prisma.user.create({
    data: {
      email,
      username,
      password: hashedPassword,
    },
  });

  request.log.info({ userId: user.id }, "user created");

  await createSession(request.server, reply, user.id, deviceId);

  request.log.info({ userId: user.id }, "signupHandler signup successful");
  reply.status(201).send();
};

/**
 * Login
 */
export const loginHandler = async (
  request: FastifyRequest<{ Body: LoginRequestType }>,
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

  await createSession(request.server, reply, user.id, deviceId);

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
  server.addSchema(signupSchema);

  server.post(
    "/signup",
    {
      schema: { body: signupSchema },
      // rate-limit setting
      config: {
        rateLimit: {
          max: 5,
          timeWindow: 1000 * 60,
          ban: 2, // will be banned after 8th attempt
        },
      },
    },
    signupHandler,
  );
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
