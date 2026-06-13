import { describe, it, expect, vi, beforeEach } from "vitest";
import type { FastifyRequest } from "fastify";
import prisma from "../../prisma.ts";
import {
  getMyUserInfoHandler,
  getOtherUserInfoHandler,
  getUserProfileHandler,
} from "../../routes/users.ts";
import { otherUserInfoSelect } from "../../schemas/user.schema.ts";
import { createMockRequest, createMockReply } from "../helpers.ts";

vi.mock("../../prisma.ts", () => ({
  default: {
    user: {
      findUnique: vi.fn(),
    },
    profile: {
      findUnique: vi.fn(),
    },
  },
}));

describe("User Handlers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getMyUserInfoHandler", () => {
    it("should return the authenticated user's information", async () => {
      // Data Preps
      const mockUser = {
        id: "123",
        username: "testuser",
        email: "test@example.com",
        createdAt: new Date(),
        updatedAt: new Date(),
        profile: null,
      };

      const request = createMockRequest({ params: {}, user: { id: "123" } }) as unknown as FastifyRequest;

      // Mock Functions
      (prisma.user.findUnique as any).mockResolvedValue(mockUser);

      const reply = createMockReply();

      // Execution of a targeted Function
      const result = await getMyUserInfoHandler(request, reply);

      // Evaluations
      expect(prisma.user.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: "123" } }),
      );
      expect(result).toEqual(mockUser);
    });

    it("should return 404 when the authenticated user is not found", async () => {
      // Data Preps
      const request = createMockRequest({ params: {}, user: { id: "123" } }) as unknown as FastifyRequest;

      // Mock Functions
      (prisma.user.findUnique as any).mockResolvedValue(null);

      const reply = createMockReply();

      // Execution of a targeted Function
      await getMyUserInfoHandler(request, reply);

      // Evaluations
      expect(reply.status).toHaveBeenCalledWith(404);
      expect(reply.send).toHaveBeenCalledWith({ error: "User not found" });
    });
  });

  describe("getOtherUserInfoHandler", () => {
    it("should return user data when user exists", async () => {
      // Data Preps
      const mockUser = {
        id: "123",
        username: "testuser",
        email: "test@example.com",
      };

      const request = createMockRequest({ params: { id: "123" } }) as unknown as FastifyRequest<{
        Params: { id: string };
      }>;

      // Mock Functions
      (prisma.user.findUnique as any).mockResolvedValue(mockUser);

      const reply = createMockReply();

      // Execution of a targeted Function
      const result = await getOtherUserInfoHandler(request, reply);

      // Evaluations
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: "123" },
        select: otherUserInfoSelect,
      });
      expect(result).toEqual(mockUser);
    });

    it("should return 404 when user does not exist", async () => {
      // Data Preps
      const request = createMockRequest({ params: { id: "123" } }) as unknown as FastifyRequest<{
        Params: { id: string };
      }>;

      // Mock Functions
      (prisma.user.findUnique as any).mockResolvedValue(null);

      const reply = createMockReply();

      // Execution of a targeted Function
      await getOtherUserInfoHandler(request, reply);

      // Evaluations
      expect(reply.status).toHaveBeenCalledWith(404);
      expect(reply.send).toHaveBeenCalledWith({ error: "User not found" });
    });
  });

  describe("getUserProfileHandler", () => {
    it("should return profile data when profile exists", async () => {
      // Data Preps
      const mockProfile = { id: "123", bio: "Hello world" };

      const request = createMockRequest({ params: { id: "123" } }) as unknown as FastifyRequest<{
        Params: { id: string };
      }>;

      // Mock Functions
      (prisma.profile.findUnique as any).mockResolvedValue(mockProfile);

      const reply = createMockReply();

      // Execution of a targeted Function
      const result = await getUserProfileHandler(request, reply);

      // Evaluations
      expect(prisma.profile.findUnique).toHaveBeenCalledWith({
        where: { id: "123" },
      });
      expect(result).toEqual(mockProfile);
    });

    it("should return 404 when profile does not exist", async () => {
      // Data Preps
      const request = createMockRequest({ params: { id: "999" } }) as unknown as FastifyRequest<{
        Params: { id: string };
      }>;

      // Mock Functions
      (prisma.profile.findUnique as any).mockResolvedValue(null);

      const reply = createMockReply();

      // Execution of a targeted Function
      await getUserProfileHandler(request, reply);

      // Evaluations
      expect(reply.status).toHaveBeenCalledWith(404);
      expect(reply.send).toHaveBeenCalledWith({ error: "Profile not found" });
    });
  });
});
