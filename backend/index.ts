import "dotenv/config";
import fastify from "fastify";
import puppeteer from "puppeteer";
import { PrismaClient } from "./generated/prisma/client.js";

/**
 * server
 */
const server = fastify();

/**
 * prisma
 */
const prisma = new PrismaClient();

server.get("/ping", async (request, reply) => {
  return "pong\n";
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
