import {
  type FastifyInstance,
  type FastifyReply,
  type FastifyRequest,
} from "fastify";
import prisma from "../prisma.ts";

// API Definitions
/**
 * Get a user information
 * @param id
 */
export async function getUserHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
) {
  const { id } = request.params;

  // it only returns a user when the user is found. Otherwise it throws an error.
  const user = await prisma.user.findFirstOrThrow({ where: { id } });

  return user;
}

/**
 * Get a user Profile
 * @param request
 * @returns
 */
export async function getUserProfileHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
) {
  const { id } = request.params;

  // it only returns a user when the user is found. Otherwise it throws an error.
  const profile = await prisma.profile.findFirstOrThrow({ where: { id } });

  return profile;
}

// Route Definitions
export async function userRoutes(server: FastifyInstance) {
  server.get("/:id", getUserHandler);
}
