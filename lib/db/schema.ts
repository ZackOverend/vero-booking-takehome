import {
  pgTable,
  uuid,
  text,
  boolean,
  timestamp,
  date,
  pgEnum,
  unique,
} from "drizzle-orm/pg-core";

export const bookingStatusEnum = pgEnum("booking_status", [
  "pending",
  "confirmed",
  "cancelled",
]);

export const physicians = pgTable("physicians", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  specialty: text("specialty").notNull(),
  bio: text("bio").notNull(),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const timeSlots = pgTable(
  "time_slots",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    physicianId: uuid("physician_id")
      .notNull()
      .references(() => physicians.id, { onDelete: "cascade" }),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    available: boolean("available").default(true).notNull(),
  },
  (t) => [unique().on(t.physicianId, t.startsAt)]
);

export const bookings = pgTable("bookings", {
  id: uuid("id").primaryKey().defaultRandom(),
  slotId: uuid("slot_id")
    .notNull()
    .references(() => timeSlots.id, { onDelete: "restrict" }),
  reference: text("reference").notNull().unique(),
  patientName: text("patient_name").notNull(),
  dob: date("dob").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  reason: text("reason").notNull(),
  notes: text("notes"),
  status: bookingStatusEnum("status").default("pending").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Physician = typeof physicians.$inferSelect;
export type TimeSlot = typeof timeSlots.$inferSelect;
export type Booking = typeof bookings.$inferSelect;
export type BookingStatus = typeof bookingStatusEnum.enumValues[number];
