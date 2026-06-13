import { type FastifyInstance, type FastifyRequest, type FastifyReply } from "fastify";
import prisma from "../prisma.ts";
import {
  myInfoSelect,
  otherUserInfoSelect,
  type MyUserInfoResponse,
  type OtherUserResponse,
} from "../schemas/user.schema.ts";

// API Definitions------------------------------------------------------

/**
 * Get my user information
 */
export const getMyUserInfoHandler = async (
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<MyUserInfoResponse> => {
  const { id } = request.user;
  request.log.info({ userId: id }, "getMyUserInfoHandler called");

  const user = await prisma.user.findUnique({
    where: { id },
    select: myInfoSelect,
  });

  if (!user) return reply.status(404).send({ error: "User not found" });

  request.log.info({ userId: user.id }, "getMyUserInfoHandler found user");
  return user;
};

/**
 * Get other user's information
 * @param id
 */
export const getOtherUserInfoHandler = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
): Promise<OtherUserResponse> => {
  const { id } = request.params;
  request.log.info({ userId: id }, "getOtherUserInfoHandler called");

  const otherUser = await prisma.user.findUnique({
    where: { id },
    select: otherUserInfoSelect,
  });

  if (!otherUser) return reply.status(404).send({ error: "User not found" });

  request.log.info({ userId: otherUser.id }, "getOtherUserInfoHandler found user");
  return otherUser;
};

/**
 * Get a user Profile
 * This api exists considering that the number of data in Profile might increase in the future.
 * @param request
 * @returns
 */
export const getUserProfileHandler = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) => {
  const { id } = request.params;
  request.log.info({ profileId: id }, "getUserProfileHandler called");

  const profile = await prisma.profile.findUnique({ where: { id } });

  if (!profile) return reply.status(404).send({ error: "Profile not found" });

  request.log.info({ profileId: profile.id }, "getUserProfileHandler found profile");
  return profile;
};

// Routes Definitions------------------------------------------------------
export async function userRoutes(server: FastifyInstance) {
  server.addHook("preHandler", server.authenticate);

  server.get("/me", getMyUserInfoHandler);
  server.get("/:id", getOtherUserInfoHandler);
  server.get("/:id/profile", getUserProfileHandler);
}
