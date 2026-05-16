import { describe, it, expect, vi, beforeEach } from "vitest";
import type { FastifyRequest } from "fastify";
import prisma from "../../prisma.ts";
import {
  getMyUserInfoHandler,
  getOtherUserInfoHandler,
  getUserProfileHandler,
} from "../../routes/users.ts";
import { otherUserInfoSelect } from "../../schemas/user.schema.ts";

const createMockRequest = (params: any) =>
  ({
    params,
    log: {
      info: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
      warn: vi.fn(),
      trace: vi.fn(),
      fatal: vi.fn(),
      silent: vi.fn(),
      child: () => ({}) as any, // child loggerが必要な場合
    },
  }) as any;

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

  describe("getMyUserInfoHandler", () => {
    it("should throw until authentication is implemented", async () => {
      const request = createMockRequest({}) as unknown as FastifyRequest;

      await expect(getMyUserInfoHandler(request)).rejects.toThrow(
        "Not implemented: authentication required",
      );
    });
  });

  describe("getOtherUserInfoHandler", () => {
    it("should return user data when user exists", async () => {
      // 1. Data Preparation
      const mockUser = {
        id: "123",
        username: "testuser",
        email: "test@example.com",
      };
      // Type casting mock to any to avoid TS issues with deep partial mocking
      (prisma.user.findFirstOrThrow as any).mockResolvedValue(mockUser);

      const requestMock = createMockRequest({
        id: "123",
      }) as unknown as FastifyRequest<{
        Params: { id: string };
      }>;

      // 2. Execution
      const result = await getOtherUserInfoHandler(requestMock);

      // 3. Evaluation
      expect(prisma.user.findFirstOrThrow).toHaveBeenCalledWith({
        where: { id: "123" },
        select: otherUserInfoSelect,
      });

      expect(result).toEqual(mockUser);
    });

    it("should throw error when user does not exist", async () => {
      const error = new Error("User not found");

      (prisma.user.findFirstOrThrow as any).mockRejectedValue(error);

      const requestMock = createMockRequest({
        id: "123",
      }) as unknown as FastifyRequest<{
        Params: { id: string };
      }>;

      await expect(getOtherUserInfoHandler(requestMock)).rejects.toThrow(
        "User not found",
      );
    });
  });

  describe("getUserProfileHandler", () => {
    it("should return profile data when profile exists", async () => {
      const mockProfile = { id: "123", bio: "Hello world" };
      (prisma.profile.findFirstOrThrow as any).mockResolvedValue(mockProfile);

      const request = createMockRequest({ id: "123" }) as unknown as FastifyRequest<{
        Params: { id: string };
      }>;

      const result = await getUserProfileHandler(request);

      expect(prisma.profile.findFirstOrThrow).toHaveBeenCalledWith({
        where: { id: "123" },
      });
      expect(result).toEqual(mockProfile);
    });

    it("should throw error when profile does not exist", async () => {
      const error = new Error("Profile not found");
      (prisma.profile.findFirstOrThrow as any).mockRejectedValue(error);

      const request = createMockRequest({ id: "999" }) as unknown as FastifyRequest<{
        Params: { id: string };
      }>;

      await expect(getUserProfileHandler(request)).rejects.toThrow(
        "Profile not found",
      );
    });
  });
});
