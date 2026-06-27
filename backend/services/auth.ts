import type { FastifyInstance, FastifyReply } from "fastify";
import bcrypt from "bcrypt";
import prisma from "../prisma.ts";
import { TOKEN_TYPES } from "../plugins/jwt.ts";
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
import { isRecordNotFound } from "../utils/error-checks.ts";

/**
 * Authenticate a user
 * @param email
 * @param password
 * @returns user or null
 */
export const authenticateUser = async (email: string, password: string) => {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, password: true },
  });

  // Always runs bcrypt.compare even when user is null to prevent timing attacks.
  const isCorrectPassword = await bcrypt.compare(
    password,
    user ? user.password : BCRYPT_TIMING_DUMMY,
  );
  return user && isCorrectPassword ? user : null;
};

/**
 * Generate accessToken and refreshToken
 * @param server
 * @param userId
 * @returns accessToken, refreshToken
 */
export const generateTokens = (server: FastifyInstance, userId: string) => {
  const accessToken = server.accessTokenJwt.sign(
    { id: userId, type: TOKEN_TYPES.ACCESS },
    { expiresIn: JWT_VALID_DURATION },
  );
  // Refresh token: longer-lived, used to mint new access tokens without forcing re-login.
  const refreshToken = server.refreshTokenJwt.sign(
    { id: userId, type: TOKEN_TYPES.REFRESH },
    { expiresIn: JWT_REFRESH_DURATION },
  );
  return { accessToken, refreshToken };
};

/**
 * Update login status when a combination of userId and deviceId exists in the DB,
 * otherwise insert a new record.
 * @param userId
 * @param deviceId
 * @param refreshToken
 */
export const upsertLoginStatus = async (
  userId: string,
  deviceId: string,
  refreshToken: string,
): Promise<void> => {
  await prisma.loginStatus.upsert({
    where: { userId_deviceId: { userId, deviceId } },
    update: { refreshToken },
    create: { userId, deviceId, refreshToken },
  });
};

/**
 * httpOnly so client-side JS cannot read it (mitigates XSS theft)
 * @param reply
 * @param accessToken
 * @param refreshToken
 */
export const setAuthCookies = (
  reply: FastifyReply,
  accessToken: string,
  refreshToken: string,
): void => {
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
};

/**
 * Delete login status
 * @param refreshToken
 */
export const deleteLoginStatus = async (
  refreshToken: string,
): Promise<void> => {
  try {
    await prisma.loginStatus.delete({ where: { refreshToken } });
  } catch (error) {
    // swallow P2025 (record not found) — logout is idempotent; session may have already expired
    if (!isRecordNotFound(error)) throw error;
  }
};

/**
 * Clear auth cookies
 * @param reply
 */
export const clearAuthCookies = (reply: FastifyReply): void => {
  reply.clearCookie(ACCESS_TOKEN_COOKIE_NAME, { path: "/" });
  reply.clearCookie(REFRESH_TOKEN_COOKIE_NAME, { path: "/auth/refresh" });
};
