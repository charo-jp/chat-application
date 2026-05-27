import { describe, it, expect, vi, beforeEach } from "vitest";
import type { FastifyReply, FastifyRequest } from "fastify";
import prisma from "../../prisma.ts";
import {
  getMyUserInfoHandler,
  getOtherUserInfoHandler,
  getUserProfileHandler,
} from "../../routes/users.ts";
import { otherUserInfoSelect } from "../../schemas/user.schema.ts";

const createMockRequest = (params: any, user?: { id: string }) =>
  ({
    params,
    user: user ?? {},
    log: {
      info: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
      warn: vi.fn(),
      trace: vi.fn(),
      fatal: vi.fn(),
      silent: vi.fn(),
      child: () => ({}) as any,
    },
  }) as any;

const createMockReply = () => {
  const reply = {
    status: vi.fn(),
    send: vi.fn(),
  };
  reply.status.mockReturnValue(reply);
  return reply as unknown as FastifyReply;
};

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
      const mockUser = {
        id: "123",
        username: "testuser",
        email: "test@example.com",
        createdAt: new Date(),
        updatedAt: new Date(),
        profile: null,
      };
      (prisma.user.findUnique as any).mockResolvedValue(mockUser);

      const request = createMockRequest({}, { id: "123" }) as unknown as FastifyRequest;
      const reply = createMockReply();

      const result = await getMyUserInfoHandler(request, reply);

      expect(prisma.user.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: "123" } }),
      );
      expect(result).toEqual(mockUser);
    });

    it("should return 404 when the authenticated user is not found", async () => {
      (prisma.user.findUnique as any).mockResolvedValue(null);

      const request = createMockRequest({}, { id: "123" }) as unknown as FastifyRequest;
      const reply = createMockReply();

      await getMyUserInfoHandler(request, reply);

      expect(reply.status).toHaveBeenCalledWith(404);
      expect(reply.send).toHaveBeenCalledWith({ error: "User not found" });
    });
  });

  describe("getOtherUserInfoHandler", () => {
    it("should return user data when user exists", async () => {
      const mockUser = {
        id: "123",
        username: "testuser",
        email: "test@example.com",
      };
      (prisma.user.findUnique as any).mockResolvedValue(mockUser);

      const request = createMockRequest({ id: "123" }) as unknown as FastifyRequest<{
        Params: { id: string };
      }>;
      const reply = createMockReply();

      const result = await getOtherUserInfoHandler(request, reply);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: "123" },
        select: otherUserInfoSelect,
      });
      expect(result).toEqual(mockUser);
    });

    it("should return 404 when user does not exist", async () => {
      (prisma.user.findUnique as any).mockResolvedValue(null);

      const request = createMockRequest({ id: "123" }) as unknown as FastifyRequest<{
        Params: { id: string };
      }>;
      const reply = createMockReply();

      await getOtherUserInfoHandler(request, reply);

      expect(reply.status).toHaveBeenCalledWith(404);
      expect(reply.send).toHaveBeenCalledWith({ error: "User not found" });
    });
  });

  describe("getUserProfileHandler", () => {
    it("should return profile data when profile exists", async () => {
      const mockProfile = { id: "123", bio: "Hello world" };
      (prisma.profile.findUnique as any).mockResolvedValue(mockProfile);

      const request = createMockRequest({ id: "123" }) as unknown as FastifyRequest<{
        Params: { id: string };
      }>;
      const reply = createMockReply();

      const result = await getUserProfileHandler(request, reply);

      expect(prisma.profile.findUnique).toHaveBeenCalledWith({
        where: { id: "123" },
      });
      expect(result).toEqual(mockProfile);
    });

    it("should return 404 when profile does not exist", async () => {
      (prisma.profile.findUnique as any).mockResolvedValue(null);

      const request = createMockRequest({ id: "999" }) as unknown as FastifyRequest<{
        Params: { id: string };
      }>;
      const reply = createMockReply();

      await getUserProfileHandler(request, reply);

      expect(reply.status).toHaveBeenCalledWith(404);
      expect(reply.send).toHaveBeenCalledWith({ error: "Profile not found" });
    });
  });
});
