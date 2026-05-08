import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { physicians, timeSlots } from "./schema";
import { PHYSICIAN_DATA } from "./physician-data";
import { eq } from "drizzle-orm";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

function generateSlots(physicianId: string): { physicianId: string; startsAt: Date }[] {
  const slots: { physicianId: string; startsAt: Date }[] = [];
  const now = new Date();

  for (let day = 1; day <= 30; day++) {
    const date = new Date(now);
    date.setDate(now.getDate() + day);

    // Skip weekends
    if (date.getDay() === 0 || date.getDay() === 6) continue;

    // 9am–5pm in 30-min intervals
    for (let hour = 9; hour < 17; hour++) {
      for (const minute of [0, 30]) {
        const slot = new Date(date);
        slot.setHours(hour, minute, 0, 0);
        slots.push({ physicianId, startsAt: slot });
      }
    }
  }

  return slots;
}

async function seed() {
  console.log("Seeding physicians...");

  for (const data of PHYSICIAN_DATA) {
    const existing = await db
      .select({ id: physicians.id })
      .from(physicians)
      .where(eq(physicians.name, data.name))
      .limit(1);

    if (existing.length > 0) {
      console.log(`  Skipping ${data.name} — already exists`);
      continue;
    }

    const [physician] = await db.insert(physicians).values(data).returning();
    console.log(`  Inserted ${physician.name}`);

    const slots = generateSlots(physician.id);
    await db.insert(timeSlots).values(slots);
    console.log(`  Inserted ${slots.length} slots for ${physician.name}`);
  }

  console.log("Done.");
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
