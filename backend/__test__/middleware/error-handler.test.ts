import { describe, it, expect } from "vitest";
import type { FastifyError } from "fastify";
import { errorHandler } from "../../middleware/error-handler.ts";
import { createMockRequest, createMockReply } from "../helpers.ts";

// -------------------------------------------------------------------------
// errorHandler
// -------------------------------------------------------------------------
describe("errorHandler", () => {
  it("logs at error level and returns 500 with a generic message for an unexpected error", () => {
    // 1. preparation
    // no `validation` property — this is what an unanticipated error (e.g. a DB connection failure) looks like
    const error = new Error("DB down") as FastifyError;
    const request = createMockRequest({
      method: "POST",
      url: "/auth/login",
      user: undefined,
    });
    const reply = createMockReply();

    // 2. execution
    errorHandler(error, request, reply);

    // 3. evaluation
    // the real error is logged server-side, but never leaked to the client
    expect(request.log.error).toHaveBeenCalledWith(error);
    expect(reply.status).toHaveBeenCalledWith(500);
    expect(reply.send).toHaveBeenCalledWith({ error: "Internal Server Error" });
  });

  // -------------------------------------------------------------------------
  // 1. Validation Error
  // -------------------------------------------------------------------------
  describe("1. Validation Error", () => {
    it("logs at warn level and returns 400 with the validation details", () => {
      // 1. preparation
      // Fastify's schema validation step attaches `validation` to the error it throws
      const error = {
        validation: [{ message: "must have required property 'email'" }],
      } as unknown as FastifyError;
      const request = createMockRequest({
        method: "POST",
        url: "/auth/signup",
        user: undefined,
      });
      const reply = createMockReply();

      // 2. execution
      errorHandler(error, request, reply);

      // 3. evaluation
      // validation failures are client mistakes, not server bugs — logged at warn, not error
      expect(request.log.warn).toHaveBeenCalledWith(
        expect.stringContaining(JSON.stringify(error.validation)),
      );
      expect(reply.status).toHaveBeenCalledWith(400);
      expect(reply.send).toHaveBeenCalledWith({
        error: JSON.stringify(error.validation),
      });
    });
  });
});
