ALTER TABLE "chat_messages" DROP CONSTRAINT "chat_messages_member_id_family_members_id_fk";
--> statement-breakpoint
ALTER TABLE "chat_messages" ADD COLUMN "member_name" text;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD COLUMN "member_image" text;--> statement-breakpoint
ALTER TABLE "rooms" ADD COLUMN "video_time" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "rooms" DROP COLUMN "current_time";