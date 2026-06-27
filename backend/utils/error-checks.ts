import { Prisma } from "../generated/prisma/client.ts";


export const isRecordNotFound = (error: unknown): boolean => {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2025"
  );
};
