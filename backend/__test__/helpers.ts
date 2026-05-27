import { vi } from "vitest";
import type { FastifyReply } from "fastify";

export const createMockRequest = (overrides: Record<string, any> = {}) =>
  ({
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
    ...overrides,
  }) as any;

export const createMockReply = () => {
  const reply = { status: vi.fn(), send: vi.fn() };
  reply.status.mockReturnValue(reply);
  return reply as unknown as FastifyReply;
};
