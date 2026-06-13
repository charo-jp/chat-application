/*
  Warnings:

  - You are about to drop the column `refresh_token` on the `user` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "user" DROP COLUMN "refresh_token";

-- CreateTable
CREATE TABLE "login_status" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "device_id" TEXT NOT NULL,
    "refresh_token" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "login_status_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "login_status_refresh_token_key" ON "login_status"("refresh_token");

-- CreateIndex
CREATE UNIQUE INDEX "login_status_user_id_device_id_key" ON "login_status"("user_id", "device_id");

-- AddForeignKey
ALTER TABLE "login_status" ADD CONSTRAINT "login_status_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
