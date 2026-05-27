import {
  type FastifyInstance,
  type FastifyRequest,
  type FastifyReply,
} from "fastify";
import bcrypt from "bcrypt";
import prisma from "../prisma.ts";
import type { LoginRequest, LoginResponse } from "../schemas/auth.schema.ts";

// API Definitions------------------------------------------------------

/**
 * Login
 */
export const loginHandler = async (
  request: FastifyRequest<{ Body: LoginRequest }>,
  reply: FastifyReply,
): Promise<LoginResponse> => {
  const { email, password } = request.body;

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, password: true },
  });

  if (!user) {
    return reply.status(404).send({ error: "User not found" });
  }

  const isCorrectPassword = await bcrypt.compare(
    password,
    user?.password ?? "",
  );

  if (!isCorrectPassword) {
    // Not telling users which one is incorrect for security reason.
    return reply.status(401).send({ error: "Invalid credentials" });
  }

  const token = request.server.jwt.sign({ id: user.id });
  return { token };
};

// Routes Definitions------------------------------------------------------
export async function authRoutes(server: FastifyInstance) {
  server.post("/login", loginHandler);
}
