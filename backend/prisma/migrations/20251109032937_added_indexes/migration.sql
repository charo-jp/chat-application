-- DropForeignKey
ALTER TABLE "public"."friend" DROP CONSTRAINT "friend_friend_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."friend" DROP CONSTRAINT "friend_user_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."profile" DROP CONSTRAINT "profile_id_fkey";

-- CreateIndex
CREATE INDEX "chatroom_room_name_idx" ON "chatroom"("room_name");

-- CreateIndex
CREATE INDEX "message_chat_room_id_idx" ON "message"("chat_room_id");

-- CreateIndex
CREATE INDEX "message_chat_room_id_sender_id_idx" ON "message"("chat_room_id", "sender_id");

-- AddForeignKey
ALTER TABLE "profile" ADD CONSTRAINT "profile_id_fkey" FOREIGN KEY ("id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "friend" ADD CONSTRAINT "friend_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "friend" ADD CONSTRAINT "friend_friend_id_fkey" FOREIGN KEY ("friend_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
