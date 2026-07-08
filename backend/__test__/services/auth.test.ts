import { describe, it, expect, vi, beforeEach } from "vitest";
import prisma from "../../prisma.ts";
import bcrypt from "bcrypt";
import { Prisma } from "../../generated/prisma/client.ts";
import {
  doesUserExist,
  isUsernameUnique,
  createSession,
  authenticateUser,
  generateTokens,
  upsertLoginStatus,
  setAuthCookies,
  deleteLoginStatus,
  clearAuthCookies,
} from "../../services/auth.ts";
import {
  BCRYPT_TIMING_DUMMY,
  ACCESS_TOKEN_COOKIE_NAME,
  REFRESH_TOKEN_COOKIE_NAME,
  JWT_VALID_DURATION,
  JWT_REFRESH_DURATION,
} from "../../config.ts";
import { TOKEN_TYPES } from "../../plugins/jwt.ts";
import { createMockReply } from "../helpers.ts";

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

// -------------------------------------------------------------------------
// doesUserExist
// -------------------------------------------------------------------------
describe("doesUserExist", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns true when a user with the given email exists", async () => {
    // 1. preparation
    (prisma.user.findUnique as any).mockResolvedValue({
      email: "alice@example.com",
    });

    // 2. execution
    const result = await doesUserExist("alice@example.com");

    // 3. evaluation
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: "alice@example.com" },
      select: { email: true },
    });
    expect(result).toBe(true);
  });

  it("returns false when no user with the given email exists", async () => {
    // 1. preparation
    (prisma.user.findUnique as any).mockResolvedValue(null);

    // 2. execution
    const result = await doesUserExist("nobody@example.com");

    // 3. evaluation
    expect(result).toBe(false);
  });
});

// -------------------------------------------------------------------------
// isUsernameUnique
// -------------------------------------------------------------------------
describe("isUsernameUnique", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns false when the username is already taken", async () => {
    // 1. preparation
    (prisma.user.findUnique as any).mockResolvedValue({ username: "alice" });

    // 2. execution
    const result = await isUsernameUnique("alice");

    // 3. evaluation
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { username: "alice" },
      select: { username: true },
    });
    expect(result).toBe(false);
  });

  it("returns true when the username is available", async () => {
    // 1. preparation
    (prisma.user.findUnique as any).mockResolvedValue(null);

    // 2. execution
    const result = await isUsernameUnique("newuser");

    // 3. evaluation
    expect(result).toBe(true);
  });
});

// -------------------------------------------------------------------------
// createSession
// -------------------------------------------------------------------------
describe("createSession", () => {
  beforeEach(() => vi.clearAllMocks());

  it("generates tokens, persists the session, and sets auth cookies", async () => {
    // 1. preparation
    const mockServer = {
      accessTokenJwt: { sign: vi.fn().mockReturnValue("access-tok") },
      refreshTokenJwt: { sign: vi.fn().mockReturnValue("refresh-tok") },
    } as any;
    const reply = createMockReply();
    (prisma.loginStatus.upsert as any).mockResolvedValue({});

    // 2. execution
    await createSession(mockServer, reply, "user-1", "device-1");

    // 3. evaluation
    expect(prisma.loginStatus.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId_deviceId: { userId: "user-1", deviceId: "device-1" } },
        update: { refreshToken: "refresh-tok" },
        create: {
          userId: "user-1",
          deviceId: "device-1",
          refreshToken: "refresh-tok",
        },
      }),
    );
    expect(reply.setCookie).toHaveBeenCalledTimes(2);
    // confirms the tokens generated above actually reach setAuthCookies and flow through to the reply
    expect(reply.setCookie).toHaveBeenCalledWith(
      ACCESS_TOKEN_COOKIE_NAME,
      "access-tok",
      expect.objectContaining({ httpOnly: true, path: "/" }),
    );
    expect(reply.setCookie).toHaveBeenCalledWith(
      REFRESH_TOKEN_COOKIE_NAME,
      "refresh-tok",
      expect.objectContaining({ httpOnly: true, path: "/auth/refresh" }),
    );
  });

  // -------------------------------------------------------------------------
  // 1. Database Error
  // -------------------------------------------------------------------------
  describe("1. Database Error", () => {
    it("propagates the error and does not set cookies when the session upsert fails", async () => {
      // 1. preparation
      const mockServer = {
        accessTokenJwt: { sign: vi.fn().mockReturnValue("access-tok") },
        refreshTokenJwt: { sign: vi.fn().mockReturnValue("refresh-tok") },
      } as any;
      const reply = createMockReply();
      (prisma.loginStatus.upsert as any).mockRejectedValue(
        new Error("DB down"),
      );

      // 2. execution + evaluation
      await expect(
        createSession(mockServer, reply, "user-1", "device-1"),
      ).rejects.toThrow("DB down");
      expect(reply.setCookie).not.toHaveBeenCalled();
    });
  });
});

// -------------------------------------------------------------------------
// authenticateUser
// -------------------------------------------------------------------------
describe("authenticateUser", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns the user when email and password are both correct", async () => {
    // 1. preparation
    const mockUser = { id: "user-1", password: "hashed-pw" };
    (prisma.user.findUnique as any).mockResolvedValue(mockUser);

    // mock bcrypt so the test doesn't need a real hash in mockUser.password
    (bcrypt.compare as any).mockResolvedValue(true);

    // 2. execution
    const result = await authenticateUser("alice@example.com", "correct-pw");

    // 3. evaluation
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: "alice@example.com" },
      select: { id: true, password: true },
    });

    expect(bcrypt.compare).toHaveBeenCalledWith("correct-pw", "hashed-pw");

    expect(result).toEqual(mockUser);
  });

  // -------------------------------------------------------------------------
  // 1. User Not Found
  // -------------------------------------------------------------------------
  describe("1. User Not Found", () => {
    it("runs bcrypt against the dummy hash and returns null when the user does not exist", async () => {
      // 1. preparation
      (prisma.user.findUnique as any).mockResolvedValue(null);
      // bcrypt must be mocked even for a missing user — it will still be called with the dummy hash
      (bcrypt.compare as any).mockResolvedValue(false);

      // 2. execution
      const result = await authenticateUser("nobody@example.com", "any-pw");

      // 3. evaluation
      // timing attack defense: bcrypt must run even when user is null so response time doesn't reveal user existence
      expect(bcrypt.compare).toHaveBeenCalledWith(
        "any-pw",
        BCRYPT_TIMING_DUMMY,
      );
      expect(result).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // 2. Wrong Password
  // -------------------------------------------------------------------------
  describe("2. Wrong Password", () => {
    it("returns null when the password does not match", async () => {
      // 1. preparation
      (prisma.user.findUnique as any).mockResolvedValue({
        id: "user-1",
        password: "hashed-pw",
      });
      // bcrypt returns false to simulate a password mismatch
      (bcrypt.compare as any).mockResolvedValue(false);

      // 2. execution
      const result = await authenticateUser("alice@example.com", "wrong-pw");

      // 3. evaluation
      expect(bcrypt.compare).toHaveBeenCalledWith("wrong-pw", "hashed-pw");
      expect(result).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // 3. Database Error
  // -------------------------------------------------------------------------
  describe("3. Database Error", () => {
    it("propagates the error when the database lookup fails", async () => {
      // 1. preparation
      (prisma.user.findUnique as any).mockRejectedValue(new Error("DB down"));

      // 2. execution + evaluation — error throws before bcrypt is ever called
      await expect(authenticateUser("alice@example.com", "pw")).rejects.toThrow(
        "DB down",
      );
    });
  });
});

// -------------------------------------------------------------------------
// generateTokens
// -------------------------------------------------------------------------
describe("generateTokens", () => {
  it("signs and returns an access token and a refresh token with the correct payloads", () => {
    // 1. preparation
    // two separate signers because access and refresh tokens use different secrets
    const mockServer = {
      accessTokenJwt: { sign: vi.fn().mockReturnValue("access-tok") },
      refreshTokenJwt: { sign: vi.fn().mockReturnValue("refresh-tok") },
    } as any;

    // 2. execution
    const result = generateTokens(mockServer, "user-1");

    // 3. evaluation
    // type in the payload prevents a refresh token from being accepted where an access token is expected
    expect(mockServer.accessTokenJwt.sign).toHaveBeenCalledWith(
      { id: "user-1", type: TOKEN_TYPES.ACCESS },
      { expiresIn: JWT_VALID_DURATION },
    );
    expect(mockServer.refreshTokenJwt.sign).toHaveBeenCalledWith(
      { id: "user-1", type: TOKEN_TYPES.REFRESH },
      { expiresIn: JWT_REFRESH_DURATION },
    );
    expect(result).toEqual({
      accessToken: "access-tok",
      refreshToken: "refresh-tok",
    });
  });
});

// -------------------------------------------------------------------------
// upsertLoginStatus
// -------------------------------------------------------------------------
describe("upsertLoginStatus", () => {
  beforeEach(() => vi.clearAllMocks());

  it("upserts a login session for the given user and device", async () => {
    // 1. preparation
    (prisma.loginStatus.upsert as any).mockResolvedValue({});

    // 2. execution
    await upsertLoginStatus("user-1", "device-1", "refresh-tok");

    // 3. evaluation
    // userId_deviceId is Prisma's compound unique key syntax — one session per user+device pair
    expect(prisma.loginStatus.upsert).toHaveBeenCalledWith({
      where: { userId_deviceId: { userId: "user-1", deviceId: "device-1" } },
      update: { refreshToken: "refresh-tok" },
      create: {
        userId: "user-1",
        deviceId: "device-1",
        refreshToken: "refresh-tok",
      },
    });
  });

  // -------------------------------------------------------------------------
  // 1. Database Error
  // -------------------------------------------------------------------------
  describe("1. Database Error", () => {
    it("propagates the error when the upsert fails", async () => {
      // 1. preparation
      (prisma.loginStatus.upsert as any).mockRejectedValue(
        new Error("DB down"),
      );

      // 2. execution + evaluation
      await expect(
        upsertLoginStatus("user-1", "device-1", "tok"),
      ).rejects.toThrow("DB down");
    });
  });
});

// -------------------------------------------------------------------------
// setAuthCookies
// -------------------------------------------------------------------------
describe("setAuthCookies", () => {
  it("sets both the access token and refresh token as httpOnly cookies with correct paths", () => {
    // 1. preparation
    const reply = createMockReply();

    // 2. execution
    setAuthCookies(reply, "access-tok", "refresh-tok");

    // 3. evaluation
    // access token is sent on every request ("/"); refresh token is scoped to the refresh endpoint only
    expect(reply.setCookie).toHaveBeenCalledWith(
      ACCESS_TOKEN_COOKIE_NAME,
      "access-tok",
      expect.objectContaining({ httpOnly: true, path: "/" }),
    );
    expect(reply.setCookie).toHaveBeenCalledWith(
      REFRESH_TOKEN_COOKIE_NAME,
      "refresh-tok",
      expect.objectContaining({ httpOnly: true, path: "/auth/refresh" }),
    );
  });
});

// -------------------------------------------------------------------------
// deleteLoginStatus
// -------------------------------------------------------------------------
describe("deleteLoginStatus", () => {
  beforeEach(() => vi.clearAllMocks());

  it("deletes the login session matching the given refresh token", async () => {
    // 1. preparation
    (prisma.loginStatus.delete as any).mockResolvedValue({});

    // 2. execution
    await deleteLoginStatus("refresh-tok");

    // 3. evaluation
    // delete by refreshToken so each device session can be individually targeted on logout
    expect(prisma.loginStatus.delete).toHaveBeenCalledWith({
      where: { refreshToken: "refresh-tok" },
    });
  });

  // -------------------------------------------------------------------------
  // 1. Record Not Found
  // -------------------------------------------------------------------------
  describe("1. Record Not Found", () => {
    it("silently swallows a P2025 error when the session no longer exists", async () => {
      // 1. preparation
      // P2025 is Prisma's "record not found" error — session may have already expired or been cleaned up
      const p2025 = new Prisma.PrismaClientKnownRequestError("not found", {
        code: "P2025",
        clientVersion: "0.0.0",
      });
      (prisma.loginStatus.delete as any).mockRejectedValue(p2025);

      // 2. execution + evaluation — logout is idempotent; a missing session is not an error
      await expect(deleteLoginStatus("refresh-tok")).resolves.toBeUndefined();
    });
  });

  // -------------------------------------------------------------------------
  // 2. Other Database Error
  // -------------------------------------------------------------------------
  describe("2. Other Database Error", () => {
    it("propagates non-P2025 database errors", async () => {
      // 1. preparation
      (prisma.loginStatus.delete as any).mockRejectedValue(
        new Error("DB down"),
      );

      // 2. execution + evaluation — non-P2025 errors are unexpected and must not be silenced
      await expect(deleteLoginStatus("refresh-tok")).rejects.toThrow("DB down");
    });
  });
});

// -------------------------------------------------------------------------
// clearAuthCookies
// -------------------------------------------------------------------------
describe("clearAuthCookies", () => {
  it("clears both the access token and refresh token cookies with their correct paths", () => {
    // 1. preparation
    const reply = createMockReply();

    // 2. execution
    clearAuthCookies(reply);

    // 3. evaluation
    // paths must match the paths used in setCookie, or the browser will not remove the cookie
    expect(reply.clearCookie).toHaveBeenCalledWith(ACCESS_TOKEN_COOKIE_NAME, {
      path: "/",
    });
    expect(reply.clearCookie).toHaveBeenCalledWith(REFRESH_TOKEN_COOKIE_NAME, {
      path: "/auth/refresh",
    });
  });
});
