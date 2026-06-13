import { describe, it, expect, vi, beforeEach } from "vitest";
import Fastify, { type FastifyRequest } from "fastify";
import prisma from "../../prisma.ts";
import bcrypt from "bcrypt";
import { loginHandler, logoutHandler } from "../../routes/auth.ts";
import { loginSchema } from "../../schemas/auth.schema.ts";
import { errorHandler } from "../../error-handler.ts";
import { createMockRequest, createMockReply } from "../helpers.ts";
import {
  ACCESS_TOKEN_COOKIE_NAME,
  REFRESH_TOKEN_COOKIE_NAME,
  PASSWORD_MAX_LENGTH,
  BCRYPT_TIMING_DUMMY,
} from "../../config.ts";
import { TOKEN_TYPES } from "../../plugins/jwt.ts";

vi.mock("../../prisma.ts", () => ({
  default: {
    user: {
      findUnique: vi.fn(),
    },
    loginStatus: {
      upsert: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

vi.mock("bcrypt", () => ({
  default: {
    compare: vi.fn(),
  },
}));

const createAuthMockRequest = (body: {
  email: string;
  password: string;
  deviceId: string;
}) =>
  createMockRequest({
    body,
    server: {
      accessTokenJwt: { sign: vi.fn().mockReturnValue("mocked-access-token") },
      refreshTokenJwt: {
        sign: vi.fn().mockReturnValue("mocked-refresh-token"),
      },
    },
  }) as FastifyRequest<{
    Body: { email: string; password: string; deviceId: string };
  }>;

// Arrange the mocks for a fully successful login (user found, password matches,
// session upserted). Individual tests override pieces as needed.
const arrangeSuccessfulLogin = () => {
  const mockUser = { id: "123", password: "hashed-password" };
  (prisma.user.findUnique as any).mockResolvedValue(mockUser);
  (bcrypt.compare as any).mockResolvedValue(true);
  (prisma.loginStatus.upsert as any).mockResolvedValue({});
  return mockUser;
};

describe("loginHandler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // One end-to-end happy path covers the success side of all three concerns:
  // user found, password correct, and the session upsert succeeding.
  // The blocks below only need to cover the failure / edge cases.
  it("logs the user in: looks up the user, verifies the password, signs and persists tokens, sets cookies, and returns 200", async () => {
    arrangeSuccessfulLogin();
    const request = createAuthMockRequest({
      email: "alice@example.com",
      password: "password123",
      deviceId: "device-abc",
    });
    const reply = createMockReply();

    await loginHandler(request, reply);

    // User lookup
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: "alice@example.com" },
      select: { id: true, password: true },
    });

    // Password verified against the stored hash
    expect(bcrypt.compare).toHaveBeenCalledWith(
      "password123",
      "hashed-password",
    );

    // Tokens signed with the user id and the matching token type
    expect(request.server.accessTokenJwt.sign).toHaveBeenCalledWith(
      { id: "123", type: TOKEN_TYPES.ACCESS },
      expect.any(Object),
    );
    expect(request.server.refreshTokenJwt.sign).toHaveBeenCalledWith(
      { id: "123", type: TOKEN_TYPES.REFRESH },
      expect.any(Object),
    );

    // Session upserted for the device
    expect(prisma.loginStatus.upsert).toHaveBeenCalledWith({
      where: { userId_deviceId: { userId: "123", deviceId: "device-abc" } },
      update: { refreshToken: "mocked-refresh-token" },
      create: {
        userId: "123",
        deviceId: "device-abc",
        refreshToken: "mocked-refresh-token",
      },
    });

    // Both tokens returned as httpOnly cookies
    expect(reply.setCookie).toHaveBeenCalledWith(
      ACCESS_TOKEN_COOKIE_NAME,
      "mocked-access-token",
      expect.objectContaining({ httpOnly: true }),
    );
    expect(reply.setCookie).toHaveBeenCalledWith(
      REFRESH_TOKEN_COOKIE_NAME,
      "mocked-refresh-token",
      expect.objectContaining({ httpOnly: true }),
    );

    expect(reply.status).toHaveBeenCalledWith(200);
  });

  // -------------------------------------------------------------------------
  // 1. User Existence
  // -------------------------------------------------------------------------
  describe("1. User Existence", () => {
    // When the user is not found we still run bcrypt.compare against a dummy
    // hash and return the same 401 as a wrong password, so neither the timing
    // nor the message leaks whether the email exists (timing attack defense).
    it("returns 401 when the user is not found", async () => {
      (prisma.user.findUnique as any).mockResolvedValue(null);
      (bcrypt.compare as any).mockResolvedValue(false);

      const request = createAuthMockRequest({
        email: "nobody@example.com",
        password: "password123",
        deviceId: "device-abc",
      });
      const reply = createMockReply();

      await loginHandler(request, reply);

      expect(reply.status).toHaveBeenCalledWith(401);
      expect(reply.send).toHaveBeenCalledWith({ error: "Invalid credentials" });
      // bcrypt.compare runs even for an unknown user, against the dummy hash,
      // so the response cost is identical to a real password check.
      expect(bcrypt.compare).toHaveBeenCalledWith(
        "password123",
        BCRYPT_TIMING_DUMMY,
      );
      expect(request.server.accessTokenJwt.sign).not.toHaveBeenCalled();
    });

    // Edge case: the DB throws while looking the user up. The handler must not
    // swallow it — the global error handler is responsible for the 500.
    it("propagates the error when the database fails while searching for the user", async () => {
      (prisma.user.findUnique as any).mockRejectedValue(
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
  // 2. Password Validation
  // -------------------------------------------------------------------------
  describe("2. Password Validation", () => {
    it("returns 401 when the password is incorrect", async () => {
      (prisma.user.findUnique as any).mockResolvedValue({
        id: "123",
        password: "hashed-password",
      });
      (bcrypt.compare as any).mockResolvedValue(false);

      const request = createAuthMockRequest({
        email: "alice@example.com",
        password: "wrong-password",
        deviceId: "device-abc",
      });
      const reply = createMockReply();

      await loginHandler(request, reply);

      expect(bcrypt.compare).toHaveBeenCalledWith(
        "wrong-password",
        "hashed-password",
      );
      expect(reply.status).toHaveBeenCalledWith(401);
      expect(reply.send).toHaveBeenCalledWith({ error: "Invalid credentials" });
      expect(request.server.accessTokenJwt.sign).not.toHaveBeenCalled();
    });

    // Edge case: an over-long password. This is rejected by loginSchema during
    // Fastify's validation step BEFORE loginHandler runs, so it cannot be
    // covered by a direct handler call — see the "login route validation"
    // suite below, which exercises it through app.inject().
  });

  // -------------------------------------------------------------------------
  // 3. Session Upsert (prisma.loginStatus.upsert)
  // -------------------------------------------------------------------------
  describe("3. Session Upsert (prisma.loginStatus.upsert)", () => {
    // Edge case: the upsert write fails (e.g. transient connection loss). The
    // error must propagate, and no cookies should be set since the token was
    // never stored.
    it("propagates the error when the upsert fails", async () => {
      arrangeSuccessfulLogin();
      (prisma.loginStatus.upsert as any).mockRejectedValue(
        new Error("DB connection lost"),
      );

      const request = createAuthMockRequest({
        email: "alice@example.com",
        password: "password123",
        deviceId: "device-abc",
      });
      const reply = createMockReply();

      await expect(loginHandler(request, reply)).rejects.toThrow(
        "DB connection lost",
      );
      expect(reply.setCookie).not.toHaveBeenCalled();
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
    // The validation detail must point at the offending field.
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
    (prisma.loginStatus.delete as any).mockResolvedValue({});

    const request = createMockRequest({
      cookies: { [REFRESH_TOKEN_COOKIE_NAME]: "some-refresh-token" },
    });
    const reply = createMockReply();

    await logoutHandler(request, reply);

    expect(prisma.loginStatus.delete).toHaveBeenCalledWith({
      where: { refreshToken: "some-refresh-token" },
    });
    expect(reply.clearCookie).toHaveBeenCalledWith(ACCESS_TOKEN_COOKIE_NAME, {
      path: "/",
    });
    expect(reply.clearCookie).toHaveBeenCalledWith(
      REFRESH_TOKEN_COOKIE_NAME,
      { path: "/auth/refresh" },
    );
    expect(reply.status).toHaveBeenCalledWith(200);
  });

  describe("1. Missing Refresh Token", () => {
    it("still clears cookies and returns 200 when no refresh token cookie is present", async () => {
      const request = createMockRequest({ cookies: {} });
      const reply = createMockReply();

      await logoutHandler(request, reply);

      expect(prisma.loginStatus.delete).not.toHaveBeenCalled();
      expect(reply.clearCookie).toHaveBeenCalledWith(
        ACCESS_TOKEN_COOKIE_NAME,
        { path: "/" },
      );
      expect(reply.clearCookie).toHaveBeenCalledWith(
        REFRESH_TOKEN_COOKIE_NAME,
        { path: "/auth/refresh" },
      );
      expect(reply.status).toHaveBeenCalledWith(200);
    });
  });

  describe("2. Database Error", () => {
    it("propagates the error when the session delete fails", async () => {
      (prisma.loginStatus.delete as any).mockRejectedValue(
        new Error("DB connection lost"),
      );

      const request = createMockRequest({
        cookies: { [REFRESH_TOKEN_COOKIE_NAME]: "some-refresh-token" },
      });
      const reply = createMockReply();

      await expect(logoutHandler(request, reply)).rejects.toThrow(
        "DB connection lost",
      );
      expect(reply.clearCookie).not.toHaveBeenCalled();
    });
  });
});
