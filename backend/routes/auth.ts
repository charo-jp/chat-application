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
} from "../services/auth.ts";
import bcrypt from "bcrypt";
import { ZxcvbnFactory } from "@zxcvbn-ts/core";
import * as zxcvbnCommonPackage from "@zxcvbn-ts/language-common";
import * as zxcvbnEnPackage from "@zxcvbn-ts/language-en";
import * as zxcvbnJaPackage from "@zxcvbn-ts/language-ja";

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

  // It checks the password is not on the rainbow table.
  // Password Complexity seems ineffective according to NIST.
  // URL: https://pages.nist.gov/800-63-4/sp800-63b.html#complexity
  const options = {
    dictionary: {
      ...zxcvbnCommonPackage.dictionary,
      ...zxcvbnEnPackage.dictionary,
      ...zxcvbnJaPackage.dictionary,
    },
    graphs: zxcvbnCommonPackage.adjacencyGraphs,
  };

  const zxcvbn = new ZxcvbnFactory(options);
  const result = zxcvbn.check(password);

  if (result.score <= 2) {
    request.log.error("password is too weak");
    reply.status(400).send({ error: "Password is too weak. Please Change the password" });
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

  if (user) {
    request.log.info({ userId: user.id }, "user created");
  } else {
    request.log.error("user not created");
    reply.status(400).send({ error: "User is not created. Please Try again." });
    return;
  }

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
    "signup",
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
