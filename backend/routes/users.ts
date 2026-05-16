import { type FastifyInstance, type FastifyRequest } from "fastify";
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
): Promise<MyUserInfoResponse> => {
  request.log.info("getMyUserInfoHandler called");

  // TODO: Replace with authenticated user's ID from session/token when implementing login
  // const id = request.user.id;
  throw new Error("Not implemented: authentication required");
};

/**
 * Get other user's information
 * @param id
 */
export const getOtherUserInfoHandler = async (
  request: FastifyRequest<{ Params: { id: string } }>,
): Promise<OtherUserResponse> => {
  const { id } = request.params;
  request.log.info({ userId: id }, "getOtherUserInfoHandler called");

  // it only returns a user when the user is found. Otherwise it throws an error.
  const otherUser = await prisma.user.findFirstOrThrow({
    where: { id },
    select: otherUserInfoSelect,
  });

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
) => {
  const { id } = request.params;
  request.log.info({ profileId: id }, "getUserProfileHandler called");

  // it only returns a profile when the profile is found. Otherwise it throws an error.
  const profile = await prisma.profile.findFirstOrThrow({ where: { id } });

  request.log.info({ profileId: profile.id }, "getUserProfileHandler found profile");
  return profile;
};

// Routes Definitions------------------------------------------------------
export async function userRoutes(server: FastifyInstance) {
  server.get("/me", getMyUserInfoHandler);
  server.get("/:id", getOtherUserInfoHandler);
  server.get("/:id/profile", getUserProfileHandler);
}
