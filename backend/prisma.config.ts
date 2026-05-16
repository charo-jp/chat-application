import "dotenv/config";
import { defineConfig, env } from "prisma/config";

// This file is used to define runtime behavior and logic.
// It tells Prisma how to behave while your application is atcually running.

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  engine: "classic",
  datasource: {
    url: env("DATABASE_URL"),
  },
});
