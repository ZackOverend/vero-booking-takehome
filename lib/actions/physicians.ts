import { cacheLife } from "next/cache";
import { db } from "@/lib/db";
import { physicians, timeSlots } from "@/lib/db/schema";
import { eq, and, gte, lte } from "drizzle-orm";

export async function getPhysicians() {
  "use cache";
  cacheLife("hours");
  return db.select().from(physicians).orderBy(physicians.name);
}

export async function getPhysician(id: string) {
  "use cache";
  cacheLife("hours");
  const [physician] = await db
    .select()
    .from(physicians)
    .where(eq(physicians.id, id))
    .limit(1);
  return physician ?? null;
}

export async function getAvailableSlots(physicianId: string, date: Date) {
  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(date);
  dayEnd.setHours(23, 59, 59, 999);

  return db
    .select()
    .from(timeSlots)
    .where(
      and(
        eq(timeSlots.physicianId, physicianId),
        eq(timeSlots.available, true),
        gte(timeSlots.startsAt, dayStart),
        lte(timeSlots.startsAt, dayEnd)
      )
    )
    .orderBy(timeSlots.startsAt);
}
