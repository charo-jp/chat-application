import { describe, it, expect, vi, beforeEach } from "vitest";
import Fastify, { type FastifyRequest } from "fastify";
import { signupHandler, loginHandler, logoutHandler } from "../../routes/auth.ts";
import { loginSchema } from "../../schemas/auth.schema.ts";
import { errorHandler } from "../../middleware/error-handler.ts";
import { createMockRequest, createMockReply } from "../helpers.ts";
import {
  REFRESH_TOKEN_COOKIE_NAME,
  PASSWORD_MAX_LENGTH,
} from "../../config.ts";
import {
  authenticateUser,
  createSession,
  deleteLoginStatus,
  clearAuthCookies,
  doesUserExist,
  isUsernameUnique,
  isPasswordSafe,
} from "../../services/auth.ts";
import prisma from "../../prisma.ts";
import bcrypt from "bcrypt";

vi.mock("../../services/auth.ts", () => ({
  authenticateUser: vi.fn(),
  createSession: vi.fn(),
  deleteLoginStatus: vi.fn(),
  clearAuthCookies: vi.fn(),
  doesUserExist: vi.fn(),
  isUsernameUnique: vi.fn(),
  isPasswordSafe: vi.fn(),
}));

vi.mock("../../prisma.ts", () => ({
  default: {
    user: {
      create: vi.fn(),
    },
  },
}));

vi.mock("bcrypt", () => ({
  default: {
    hash: vi.fn(),
  },
}));

const createAuthMockRequest = (body: {
  email: string;
  password: string;
  deviceId: string;
}) =>
  createMockRequest({ body, server: {} }) as FastifyRequest<{
    Body: { email: string; password: string; deviceId: string };
  }>;

// Arrange the mocks for a fully successful login. Individual tests override
// pieces as needed.
const arrangeSuccessfulLogin = () => {
  const mockUser = { id: "123" };
  (authenticateUser as any).mockResolvedValue(mockUser);
  (createSession as any).mockResolvedValue(undefined);
  return mockUser;
};

const createSignupMockRequest = (body: {
  email: string;
  password: string;
  username: string;
  deviceId: string;
}) =>
  createMockRequest({ body, server: {} }) as FastifyRequest<{
    Body: { email: string; password: string; username: string; deviceId: string };
  }>;

// Arrange the mocks for a fully successful signup. Individual tests override
// pieces as needed.
const arrangeSuccessfulSignup = () => {
  const mockUser = { id: "123" };
  (doesUserExist as any).mockResolvedValue(false);
  (isUsernameUnique as any).mockResolvedValue(true);
  (isPasswordSafe as any).mockReturnValue({ isSafe: true });
  (bcrypt.hash as any).mockResolvedValue("hashed-pw");
  (prisma.user.create as any).mockResolvedValue(mockUser);
  (createSession as any).mockResolvedValue(undefined);
  return mockUser;
};

describe("signupHandler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates the user, creates a session, and returns 201", async () => {
    const mockUser = arrangeSuccessfulSignup();
    const request = createSignupMockRequest({
      email: "alice@example.com",
      password: "Str0ngP@ssphrase!",
      username: "alice",
      deviceId: "device-abc",
    });
    const reply = createMockReply();

    await signupHandler(request, reply);

    expect(doesUserExist).toHaveBeenCalledWith("alice@example.com");
    expect(isUsernameUnique).toHaveBeenCalledWith("alice");
    expect(isPasswordSafe).toHaveBeenCalledWith("Str0ngP@ssphrase!");
    expect(bcrypt.hash).toHaveBeenCalledWith("Str0ngP@ssphrase!", 10);
    expect(prisma.user.create).toHaveBeenCalledWith({
      data: {
        email: "alice@example.com",
        username: "alice",
        password: "hashed-pw",
      },
    });
    expect(createSession).toHaveBeenCalledWith(
      request.server,
      reply,
      mockUser.id,
      "device-abc",
    );
    expect(reply.status).toHaveBeenCalledWith(201);
  });

  // -------------------------------------------------------------------------
  // 1. Email Existence
  // -------------------------------------------------------------------------
  describe("1. Email Existence", () => {
    it("returns 400 when an account with the email already exists", async () => {
      (doesUserExist as any).mockResolvedValue(true);

      const request = createSignupMockRequest({
        email: "alice@example.com",
        password: "Str0ngP@ssphrase!",
        username: "alice",
        deviceId: "device-abc",
      });
      const reply = createMockReply();

      await signupHandler(request, reply);

      expect(reply.status).toHaveBeenCalledWith(400);
      expect(reply.send).toHaveBeenCalledWith({
        error: "An account with this email already exists",
      });
      expect(isUsernameUnique).not.toHaveBeenCalled();
      expect(prisma.user.create).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // 2. Username Uniqueness
  // -------------------------------------------------------------------------
  describe("2. Username Uniqueness", () => {
    it("returns 400 when the username is already taken", async () => {
      (doesUserExist as any).mockResolvedValue(false);
      (isUsernameUnique as any).mockResolvedValue(false);

      const request = createSignupMockRequest({
        email: "alice@example.com",
        password: "Str0ngP@ssphrase!",
        username: "alice",
        deviceId: "device-abc",
      });
      const reply = createMockReply();

      await signupHandler(request, reply);

      expect(reply.status).toHaveBeenCalledWith(400);
      expect(reply.send).toHaveBeenCalledWith({
        error: "This username is already taken",
      });
      expect(isPasswordSafe).not.toHaveBeenCalled();
      expect(prisma.user.create).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // 3. Password Strength
  // -------------------------------------------------------------------------
  describe("3. Password Strength", () => {
    it("returns 400 with the warning and suggestions when the password is weak", async () => {
      (doesUserExist as any).mockResolvedValue(false);
      (isUsernameUnique as any).mockResolvedValue(true);
      (isPasswordSafe as any).mockReturnValue({
        isSafe: false,
        warning: "This is a top-10 common password",
        suggestions: "Add another word or two",
      });

      const request = createSignupMockRequest({
        email: "alice@example.com",
        password: "password123",
        username: "alice",
        deviceId: "device-abc",
      });
      const reply = createMockReply();

      await signupHandler(request, reply);

      expect(reply.status).toHaveBeenCalledWith(400);
      expect(reply.send).toHaveBeenCalledWith({
        details: {
          warning: "This is a top-10 common password",
          suggestions: "Add another word or two",
        },
      });
      expect(prisma.user.create).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // 4. User Creation
  // -------------------------------------------------------------------------
  describe("4. User Creation", () => {
    it("propagates the error when prisma.user.create fails", async () => {
      (doesUserExist as any).mockResolvedValue(false);
      (isUsernameUnique as any).mockResolvedValue(true);
      (isPasswordSafe as any).mockReturnValue({ isSafe: true });
      (bcrypt.hash as any).mockResolvedValue("hashed-pw");
      (prisma.user.create as any).mockRejectedValue(new Error("DB down"));

      const request = createSignupMockRequest({
        email: "alice@example.com",
        password: "Str0ngP@ssphrase!",
        username: "alice",
        deviceId: "device-abc",
      });
      const reply = createMockReply();

      await expect(signupHandler(request, reply)).rejects.toThrow("DB down");
      expect(createSession).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // 5. Session Creation
  // -------------------------------------------------------------------------
  describe("5. Session Creation", () => {
    it("propagates the error when createSession fails", async () => {
      (doesUserExist as any).mockResolvedValue(false);
      (isUsernameUnique as any).mockResolvedValue(true);
      (isPasswordSafe as any).mockReturnValue({ isSafe: true });
      (bcrypt.hash as any).mockResolvedValue("hashed-pw");
      (prisma.user.create as any).mockResolvedValue({ id: "123" });
      (createSession as any).mockRejectedValue(
        new Error("DB connection lost"),
      );

      const request = createSignupMockRequest({
        email: "alice@example.com",
        password: "Str0ngP@ssphrase!",
        username: "alice",
        deviceId: "device-abc",
      });
      const reply = createMockReply();

      await expect(signupHandler(request, reply)).rejects.toThrow(
        "DB connection lost",
      );
    });
  });
});

describe("loginHandler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("logs the user in: authenticates, generates tokens, persists the session, sets cookies, and returns 200", async () => {
    arrangeSuccessfulLogin();
    const request = createAuthMockRequest({
      email: "alice@example.com",
      password: "password123",
      deviceId: "device-abc",
    });
    const reply = createMockReply();

    await loginHandler(request, reply);

    expect(authenticateUser).toHaveBeenCalledWith(
      "alice@example.com",
      "password123",
    );
    expect(createSession).toHaveBeenCalledWith(
      request.server,
      reply,
      "123",
      "device-abc",
    );
    expect(reply.status).toHaveBeenCalledWith(200);
  });

  // -------------------------------------------------------------------------
  // 1. User Existence
  // -------------------------------------------------------------------------
  describe("1. User Existence", () => {
    it("returns 401 when the user is not found or credentials are invalid", async () => {
      (authenticateUser as any).mockResolvedValue(null);

      const request = createAuthMockRequest({
        email: "nobody@example.com",
        password: "password123",
        deviceId: "device-abc",
      });
      const reply = createMockReply();

      await loginHandler(request, reply);

      expect(reply.status).toHaveBeenCalledWith(401);
      expect(reply.send).toHaveBeenCalledWith({ error: "Invalid credentials" });
      expect(createSession).not.toHaveBeenCalled();
    });

    it("propagates the error when authenticateUser throws", async () => {
      (authenticateUser as any).mockRejectedValue(
        new Error("DB connection failed"),
      );

      const request = createAuthMockRequest({
        email: "alice@example.com",
        password: "password123",
        deviceId: "device-abc",
      });
      const reply = createMockReply();

      await expect(loginHandler(request, reply)).rejects.toThrow(
        "DB connection failed",
      );
    });
  });

  // -------------------------------------------------------------------------
  // 2. Session Upsert
  // -------------------------------------------------------------------------
  describe("2. Session Upsert", () => {
    it("propagates the error when createSession fails", async () => {
      (authenticateUser as any).mockResolvedValue({ id: "123" });
      (createSession as any).mockRejectedValue(new Error("DB connection lost"));

      const request = createAuthMockRequest({
        email: "alice@example.com",
        password: "password123",
        deviceId: "device-abc",
      });
      const reply = createMockReply();

      await expect(loginHandler(request, reply)).rejects.toThrow(
        "DB connection lost",
      );
    });
  });
});

// Password length is enforced by the JSON Schema (loginSchema) at Fastify's
// validation step, BEFORE loginHandler runs — so it cannot be covered by a
// direct handler unit test. We boot a minimal Fastify instance with the schema
// AND the real global error handler attached, then inject a request so both the
// validation and the error-handler's response shaping actually fire.
describe("login route validation", () => {
  const buildValidationApp = () => {
    const app = Fastify();
    app.addSchema(loginSchema);
    // The same error handler used in index.ts, so we assert the real response
    // shape it produces for validation failures — not Fastify's default.
    app.setErrorHandler(errorHandler);
    // Stub handler: should never run when validation rejects the body.
    app.post("/login", { schema: { body: loginSchema } }, async () => ({
      ok: true,
    }));
    return app;
  };

  it("rejects a password that exceeds the max length with 400 and the validation error", async () => {
    const app = buildValidationApp();

    const response = await app.inject({
      method: "POST",
      url: "/login",
      payload: {
        email: "alice@example.com",
        password: "x".repeat(PASSWORD_MAX_LENGTH + 1),
        deviceId: "device-abc",
      },
    });

    expect(response.statusCode).toBe(400);

    const body = response.json();
    expect(body).toHaveProperty("error");
    expect(JSON.stringify(body.error)).toContain("password");

    await app.close();
  });

  it("accepts a password within the allowed length", async () => {
    const app = buildValidationApp();

    const response = await app.inject({
      method: "POST",
      url: "/login",
      payload: {
        email: "alice@example.com",
        password: "x".repeat(PASSWORD_MAX_LENGTH),
        deviceId: "device-abc",
      },
    });

    expect(response.statusCode).toBe(200);

    await app.close();
  });

  it("rejects a request missing deviceId with 400", async () => {
    const app = buildValidationApp();

    const response = await app.inject({
      method: "POST",
      url: "/login",
      payload: {
        email: "alice@example.com",
        password: "password123",
      },
    });

    expect(response.statusCode).toBe(400);

    const body = response.json();
    expect(body).toHaveProperty("error");
    expect(JSON.stringify(body.error)).toContain("deviceId");

    await app.close();
  });
});

// -------------------------------------------------------------------------
// logoutHandler
// -------------------------------------------------------------------------
describe("logoutHandler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deletes the session, clears both cookies, and returns 200", async () => {
    (deleteLoginStatus as any).mockResolvedValue(undefined);
    (clearAuthCookies as any).mockReturnValue(undefined);

    const request = createMockRequest({
      cookies: { [REFRESH_TOKEN_COOKIE_NAME]: "some-refresh-token" },
    });
    const reply = createMockReply();

    await logoutHandler(request, reply);

    expect(deleteLoginStatus).toHaveBeenCalledWith("some-refresh-token");
    expect(clearAuthCookies).toHaveBeenCalledWith(reply);
    expect(reply.status).toHaveBeenCalledWith(200);
  });

  // -------------------------------------------------------------------------
  // 1. Missing Refresh Token
  // -------------------------------------------------------------------------
  describe("1. Missing Refresh Token", () => {
    it("still clears cookies and returns 200 when no refresh token cookie is present", async () => {
      (clearAuthCookies as any).mockReturnValue(undefined);

      const request = createMockRequest({ cookies: {} });
      const reply = createMockReply();

      await logoutHandler(request, reply);

      expect(deleteLoginStatus).not.toHaveBeenCalled();
      expect(clearAuthCookies).toHaveBeenCalledWith(reply);
      expect(reply.status).toHaveBeenCalledWith(200);
    });
  });

  // -------------------------------------------------------------------------
  // 2. Database Error
  // -------------------------------------------------------------------------
  describe("2. Database Error", () => {
    it("propagates the error when deleteLoginStatus fails", async () => {
      (deleteLoginStatus as any).mockRejectedValue(
        new Error("DB connection lost"),
      );

      const request = createMockRequest({
        cookies: { [REFRESH_TOKEN_COOKIE_NAME]: "some-refresh-token" },
      });
      const reply = createMockReply();

      await expect(logoutHandler(request, reply)).rejects.toThrow(
        "DB connection lost",
      );
      expect(clearAuthCookies).not.toHaveBeenCalled();
    });
  });
});
