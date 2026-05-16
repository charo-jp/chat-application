import { Prisma } from "../generated/prisma/client.ts";
/**
 * Select is used to specify which fields to return from the database.
 * It is useful for excluding sensitive fields or fields that are not needed in the response.
 */

/**
 * Get my user information.
 */
export const myInfoSelect = {
  id: true,
  username: true,
  email: true,
  createdAt: true,
  updatedAt: true,
  profile: true, // include the entire profile object
} as const;

/**
 * Type for the response of getMyUserInfoHandler.
 */
export type MyUserInfoResponse = Prisma.UserGetPayload<{
  select: typeof myInfoSelect;
}>;

/**
 * Get other user's information.
 * It excludes sensitive fields such as email.
 */
export const otherUserInfoSelect = {
  id: true,
  username: true,
  createdAt: true,
  updatedAt: true,
  profile: {
    select: {
      id: true,
      statusMessage: true,
      profilePicUrl: true,
    },
  },
} as const;

/**
 * Type for the response of getOtherUserInfoHandler.
 */
export type OtherUserResponse = Prisma.UserGetPayload<{
  select: typeof otherUserInfoSelect;
}>;
