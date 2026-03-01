import { describe, it, expect, vi, beforeEach } from "vitest";
import type { FastifyRequest } from "fastify";
import prisma from "../../prisma.ts";
import { getUserHandler, getUserProfileHandler } from "../../routes/user.ts";

// Mock the prisma client
vi.mock("../../prisma.ts", () => ({
  default: {
    user: {
      findFirstOrThrow: vi.fn(),
    },
    profile: {
      findFirstOrThrow: vi.fn(),
    },
  },
}));

describe("User Handlers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getUserHandler", () => {
    it("should return user data when user exists", async () => {
      const mockUser = {
        id: "123",
        username: "testuser",
        email: "test@example.com",
      };
      // Type casting mock to any to avoid TS issues with deep partial mocking
      (prisma.user.findFirstOrThrow as any).mockResolvedValue(mockUser);

      const request = {
        params: { id: "123" },
      } as FastifyRequest<{ Params: { id: string } }>;

      const result = await getUserHandler(request);

      expect(prisma.user.findFirstOrThrow).toHaveBeenCalledWith({
        where: { id: "123" },
      });
      expect(result).toEqual(mockUser);
    });

    it("should throw error when user does not exist", async () => {
      const error = new Error("User not found");
      (prisma.user.findFirstOrThrow as any).mockRejectedValue(error);

      const request = {
        params: { id: "999" },
      } as FastifyRequest<{ Params: { id: string } }>;

      await expect(getUserHandler(request)).rejects.toThrow("User not found");
    });
  });

  describe("getUserProfileHandler", () => {
    it("should return profile data when profile exists", async () => {
      const mockProfile = { id: "123", bio: "Hello world" };
      (prisma.profile.findFirstOrThrow as any).mockResolvedValue(mockProfile);

      const request = {
        params: { id: "123" },
      } as FastifyRequest<{ Params: { id: string } }>;

      const result = await getUserProfileHandler(request);

      expect(prisma.profile.findFirstOrThrow).toHaveBeenCalledWith({
        where: { id: "123" },
      });
      expect(result).toEqual(mockProfile);
    });

    it("should throw error when profile does not exist", async () => {
      const error = new Error("Profile not found");
      (prisma.profile.findFirstOrThrow as any).mockRejectedValue(error);

      const request = {
        params: { id: "999" },
      } as FastifyRequest<{ Params: { id: string } }>;

      await expect(getUserProfileHandler(request)).rejects.toThrow(
        "Profile not found",
      );
    });
  });
});
