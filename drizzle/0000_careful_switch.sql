CREATE TYPE "public"."booking_status" AS ENUM('pending', 'confirmed', 'cancelled');--> statement-breakpoint
CREATE TABLE "bookings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slot_id" uuid NOT NULL,
	"reference" text NOT NULL,
	"patient_name" text NOT NULL,
	"dob" date NOT NULL,
	"email" text NOT NULL,
	"phone" text NOT NULL,
	"reason" text NOT NULL,
	"notes" text,
	"status" "booking_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "bookings_reference_unique" UNIQUE("reference")
);
--> statement-breakpoint
CREATE TABLE "physicians" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"specialty" text NOT NULL,
	"bio" text NOT NULL,
	"avatar_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "time_slots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"physician_id" uuid NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"available" boolean DEFAULT true NOT NULL,
	CONSTRAINT "time_slots_physician_id_starts_at_unique" UNIQUE("physician_id","starts_at")
);
--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_slot_id_time_slots_id_fk" FOREIGN KEY ("slot_id") REFERENCES "public"."time_slots"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_slots" ADD CONSTRAINT "time_slots_physician_id_physicians_id_fk" FOREIGN KEY ("physician_id") REFERENCES "public"."physicians"("id") ON DELETE cascade ON UPDATE no action;