import "dotenv/config";
import fastify from "fastify";
import { PrismaClient, type User } from "./generated/prisma/client.ts";
import { PrismaClientKnownRequestError } from "./generated/prisma/internal/prismaNamespace.ts";

/**
 * server
 */
const server = fastify();

/**
 * prisma
 */
const prisma = new PrismaClient();

/**
 * Get A User Information
 */
server.get<{ Params: { id: string } }>("/user/:id", async (request, reply) => {
  // It needs to be aligned with key's name on a table
  const { id } = request.params;

  try {
    const user = await prisma.user.findFirstOrThrow({
      where: { id: id },
    });

    if (!user) {
      return reply.status(404).send({ error: "User not found" });
    }

    return user;
  } catch (error) {
    return reply.status(500).send({ error: "Internal Server Error" });
  }
});

server.listen({ port: 8080 }, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`Server listening at ${address}`);
});

async function main() {
  // ... you will write your Prisma Client queries here
  const allUsers = await prisma.user.findMany();
  console.log(allUsers);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
