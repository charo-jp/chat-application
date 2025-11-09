-- DropForeignKey
ALTER TABLE "public"."chatroom_member" DROP CONSTRAINT "chatroom_member_chat_room_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."chatroom_member" DROP CONSTRAINT "chatroom_member_user_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."message" DROP CONSTRAINT "message_chat_room_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."message_status" DROP CONSTRAINT "message_status_message_id_fkey";

-- AddForeignKey
ALTER TABLE "message" ADD CONSTRAINT "message_chat_room_id_fkey" FOREIGN KEY ("chat_room_id") REFERENCES "chatroom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_status" ADD CONSTRAINT "message_status_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "message"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chatroom_member" ADD CONSTRAINT "chatroom_member_chat_room_id_fkey" FOREIGN KEY ("chat_room_id") REFERENCES "chatroom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chatroom_member" ADD CONSTRAINT "chatroom_member_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
