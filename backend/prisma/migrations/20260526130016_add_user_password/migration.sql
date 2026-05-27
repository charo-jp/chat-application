-- AlterTable: add password with a temporary default for existing rows, then remove the default
ALTER TABLE "user" ADD COLUMN "password" TEXT NOT NULL DEFAULT '';
ALTER TABLE "user" ALTER COLUMN "password" DROP DEFAULT;
