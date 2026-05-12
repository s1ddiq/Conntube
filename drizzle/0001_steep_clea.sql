ALTER TABLE "rooms" DROP CONSTRAINT "rooms_host_id_family_members_id_fk";
--> statement-breakpoint
ALTER TABLE "chat_messages" ALTER COLUMN "member_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "family_members" ALTER COLUMN "id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "family_members" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "rooms" ALTER COLUMN "host_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "rooms" ALTER COLUMN "host_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "watch_sessions" ALTER COLUMN "member_id" SET DATA TYPE text;