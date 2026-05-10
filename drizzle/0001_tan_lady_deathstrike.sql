CREATE TYPE "public"."triage_level" AS ENUM('urgent', 'soon', 'routine', 'administrative', 'safety_flag');--> statement-breakpoint
CREATE TABLE "settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ai_enabled" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "triage_level" "triage_level";