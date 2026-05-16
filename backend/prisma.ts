/**
 * This file initializes the Prisma client and exports it for use in other parts of the application.
 * It imports the PrismaClient class from the generated client and creates an instance of it.
 * This instance is then exported as the default export of the module, allowing other files to import and use it to interact with the database.
 */
import { PrismaClient } from "./generated/prisma/client.ts";

const prisma = new PrismaClient();

export default prisma;
