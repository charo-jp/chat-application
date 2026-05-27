import { describe, it, expect, vi, beforeEach } from "vitest";
import type { FastifyRequest } from "fastify";
import prisma from "../../prisma.ts";
import bcrypt from "bcrypt";
import { loginHandler } from "../../routes/auth.ts";
import { createMockRequest, createMockReply } from "../helpers.ts";

vi.mock("../../prisma.ts", () => ({
  default: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock("bcrypt", () => ({
  default: {
    compare: vi.fn(),
  },
}));

const createAuthMockRequest = (body: { email: string; password: string }) =>
  createMockRequest({
    body,
    server: { jwt: { sign: vi.fn().mockReturnValue("mocked-jwt-token") } },
  }) as FastifyRequest<{ Body: { email: string; password: string } }>;

describe("loginHandler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return a token when credentials are correct", async () => {
    // Data Preps
    const mockUser = { id: "123", password: "hashed-password" };

    const request = createAuthMockRequest({
      email: "alice@example.com",
      password: "password123",
    });

    // Mock Functions
    (prisma.user.findUnique as any).mockResolvedValue(mockUser);

    (bcrypt.compare as any).mockResolvedValue(true);

    const reply = createMockReply();

    // Execution of a targeted Function
    const result = await loginHandler(request, reply);

    // Evaluations
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: "alice@example.com" },
      select: { id: true, password: true },
    });

    expect(bcrypt.compare).toHaveBeenCalledWith(
      "password123",
      "hashed-password",
    );

    expect(request.server.jwt.sign).toHaveBeenCalledWith({ id: "123" });

    expect(result).toEqual({ token: "mocked-jwt-token" });
  });

  it("should return 404 when user is not found", async () => {
    // Data Preps
    const request = createAuthMockRequest({
      email: "nobody@example.com",
      password: "password123",
    });

    // Mock Functions
    (prisma.user.findUnique as any).mockResolvedValue(null);

    const reply = createMockReply();

    // Execution of a targeted Function
    await loginHandler(request, reply);

    // Evaluations
    expect(reply.status).toHaveBeenCalledWith(404);

    expect(reply.send).toHaveBeenCalledWith({ error: "User not found" });

    expect(bcrypt.compare).not.toHaveBeenCalled();
  });

  it("should return 401 when password is incorrect", async () => {
    // Data Preps
    const mockUser = { id: "123", password: "hashed-password" };

    const request = createAuthMockRequest({
      email: "alice@example.com",
      password: "wrong-password",
    });

    // Mock Functions
    (prisma.user.findUnique as any).mockResolvedValue(mockUser);

    (bcrypt.compare as any).mockResolvedValue(false);

    const reply = createMockReply();

    // Execution of a targeted Function
    await loginHandler(request, reply);

    // Evaluations
    expect(reply.status).toHaveBeenCalledWith(401);

    expect(reply.send).toHaveBeenCalledWith({ error: "Invalid credentials" });

    expect(request.server.jwt.sign).not.toHaveBeenCalled();
  });

  // This test verifies the handler does not swallow unexpected errors.
  // If it did, the global error handler would never run and the client would get an unexpected response.
  it("should propagate unexpected database errors", async () => {
    // Data Preps
    const request = createAuthMockRequest({
      email: "alice@example.com",
      password: "password123",
    });

    // Mock Functions
    (prisma.user.findUnique as any).mockRejectedValue(
      new Error("DB connection failed"),
    );

    const reply = createMockReply();

    // Execution of a targeted Function & Evaluations
    await expect(loginHandler(request, reply)).rejects.toThrow(
      "DB connection failed",
    );
  });
});
