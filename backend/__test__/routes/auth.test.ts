import { describe, it, expect, vi, beforeEach } from "vitest";
import Fastify, { type FastifyRequest } from "fastify";
import { loginHandler, logoutHandler } from "../../routes/auth.ts";
import { loginSchema } from "../../schemas/auth.schema.ts";
import { errorHandler } from "../../middleware/error-handler.ts";
import { createMockRequest, createMockReply } from "../helpers.ts";
import {
  REFRESH_TOKEN_COOKIE_NAME,
  PASSWORD_MAX_LENGTH,
} from "../../config.ts";
import {
  authenticateUser,
  generateTokens,
  upsertLoginStatus,
  setAuthCookies,
  deleteLoginStatus,
  clearAuthCookies,
} from "../../services/auth.ts";

vi.mock("../../services/auth.ts", () => ({
  authenticateUser: vi.fn(),
  generateTokens: vi.fn(),
  upsertLoginStatus: vi.fn(),
  setAuthCookies: vi.fn(),
  deleteLoginStatus: vi.fn(),
  clearAuthCookies: vi.fn(),
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
  (generateTokens as any).mockReturnValue({
    accessToken: "mocked-access-token",
    refreshToken: "mocked-refresh-token",
  });
  (upsertLoginStatus as any).mockResolvedValue(undefined);
  (setAuthCookies as any).mockReturnValue(undefined);
  return mockUser;
};

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
    expect(generateTokens).toHaveBeenCalledWith(request.server, "123");
    expect(upsertLoginStatus).toHaveBeenCalledWith(
      "123",
      "device-abc",
      "mocked-refresh-token",
    );
    expect(setAuthCookies).toHaveBeenCalledWith(
      reply,
      "mocked-access-token",
      "mocked-refresh-token",
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
      expect(generateTokens).not.toHaveBeenCalled();
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
    it("propagates the error and does not set cookies when upsertLoginStatus fails", async () => {
      arrangeSuccessfulLogin();
      (upsertLoginStatus as any).mockRejectedValue(
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
      expect(setAuthCookies).not.toHaveBeenCalled();
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
