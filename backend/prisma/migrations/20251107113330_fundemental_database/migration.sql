-- CreateEnum
CREATE TYPE "ChatRoomType" AS ENUM ('DM', 'GROUP');

-- AlterTable
ALTER TABLE "chatroom" ADD COLUMN     "type" "ChatRoomType" NOT NULL DEFAULT 'GROUP';
