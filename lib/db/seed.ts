import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { physicians, timeSlots, bookings } from "./schema";
import type { BookingStatus, TriageLevel } from "./schema";
import { PHYSICIAN_DATA } from "./physician-data";
import { eq, and, asc } from "drizzle-orm";
import { nanoid } from "nanoid";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

function generateSlots(physicianId: string): { physicianId: string; startsAt: Date }[] {
  const slots: { physicianId: string; startsAt: Date }[] = [];
  const now = new Date();

  for (let day = 1; day <= 30; day++) {
    const date = new Date(now);
    date.setDate(now.getDate() + day);

    if (date.getDay() === 0 || date.getDay() === 6) continue;

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

type BookingSeed = {
  physicianName: string;
  patientName: string;
  dob: string;
  email: string;
  phone: string;
  reason: string;
  notes: string | null;
  status: BookingStatus;
  triageLevel: TriageLevel | null;
};

const BOOKING_SEED_DATA: BookingSeed[] = [
  // Dr. Sarah Chen — General Practice
  {
    physicianName: "Dr. Sarah Chen",
    patientName: "Emma Whitfield",
    dob: "1985-03-14",
    email: "emma.whitfield@email.com",
    phone: "+1 (416) 555-0101",
    reason: "Annual physical",
    notes: null,
    status: "confirmed",
    triageLevel: "routine",
  },
  {
    physicianName: "Dr. Sarah Chen",
    patientName: "Tyler Brooks",
    dob: "1992-07-22",
    email: "tyler.brooks@email.com",
    phone: "+1 (647) 555-0182",
    reason: "Fever for 4 days, sore throat getting worse",
    notes: "No known allergies. Has been taking ibuprofen.",
    status: "pending",
    triageLevel: "soon",
  },
  {
    physicianName: "Dr. Sarah Chen",
    patientName: "Rachel Kim",
    dob: "1990-11-05",
    email: "rachel.kim@email.com",
    phone: "+1 (416) 555-0143",
    reason: "Sick note for work",
    notes: null,
    status: "confirmed",
    triageLevel: null,
  },

  // Dr. James Okafor — Cardiology
  {
    physicianName: "Dr. James Okafor",
    patientName: "Marcus Reid",
    dob: "1968-09-30",
    email: "marcus.reid@email.com",
    phone: "+1 (905) 555-0167",
    reason: "New chest discomfort, started three days ago",
    notes: "Discomfort is mild, no radiation. History of high cholesterol.",
    status: "pending",
    triageLevel: "urgent",
  },
  {
    physicianName: "Dr. James Okafor",
    patientName: "Claire Dubois",
    dob: "1975-04-18",
    email: "claire.dubois@email.com",
    phone: "+1 (416) 555-0129",
    reason: "Blood pressure follow-up",
    notes: "Currently on lisinopril 10mg.",
    status: "confirmed",
    triageLevel: "routine",
  },
  {
    physicianName: "Dr. James Okafor",
    patientName: "Omar Hassan",
    dob: "1980-12-03",
    email: "omar.hassan@email.com",
    phone: "+1 (647) 555-0194",
    reason: "Sudden onset heart palpitations, happening daily for a week",
    notes: null,
    status: "pending",
    triageLevel: "urgent",
  },

  // Dr. Priya Nair — Dermatology
  {
    physicianName: "Dr. Priya Nair",
    patientName: "Lily Park",
    dob: "1995-06-11",
    email: "lily.park@email.com",
    phone: "+1 (416) 555-0155",
    reason: "Suspicious mole on left shoulder, growing over past month",
    notes: null,
    status: "pending",
    triageLevel: "urgent",
  },
  {
    physicianName: "Dr. Priya Nair",
    patientName: "Aisha Mohammed",
    dob: "1988-02-27",
    email: "aisha.mohammed@email.com",
    phone: "+1 (905) 555-0138",
    reason: "Eczema flare-up, worse than usual",
    notes: "Using hydrocortisone cream, minimal improvement.",
    status: "cancelled",
    triageLevel: "soon",
  },
  {
    physicianName: "Dr. Priya Nair",
    patientName: "Ben Larson",
    dob: "1983-08-16",
    email: "ben.larson@email.com",
    phone: "+1 (416) 555-0172",
    reason: "Referral letter for dermatology specialist",
    notes: null,
    status: "cancelled",
    triageLevel: null,
  },

  // Dr. Michael Torres — Paediatrics
  {
    physicianName: "Dr. Michael Torres",
    patientName: "Nathan Osei",
    dob: "2022-04-09",
    email: "kwame.osei@email.com",
    phone: "+1 (647) 555-0116",
    reason: "Routine 2-year check",
    notes: null,
    status: "confirmed",
    triageLevel: "routine",
  },
  {
    physicianName: "Dr. Michael Torres",
    patientName: "Isabelle Martin",
    dob: "2020-10-21",
    email: "sophie.martin@email.com",
    phone: "+1 (416) 555-0147",
    reason: "Recurring ear infections, third episode this year",
    notes: "Completed two courses of amoxicillin.",
    status: "cancelled",
    triageLevel: "soon",
  },
  {
    physicianName: "Dr. Michael Torres",
    patientName: "Zara Ahmed",
    dob: "2021-07-03",
    email: "tariq.ahmed@email.com",
    phone: "+1 (905) 555-0163",
    reason: "Rash appeared two days ago, spreading",
    notes: "No fever. No recent medication changes.",
    status: "pending",
    triageLevel: "soon",
  },

  // Dr. Amara Diallo — Psychiatry
  {
    physicianName: "Dr. Amara Diallo",
    patientName: "Sofia Reyes",
    dob: "1997-01-29",
    email: "sofia.reyes@email.com",
    phone: "+1 (416) 555-0189",
    reason: "Anxiety has been much worse over the past month, hard to function at work",
    notes: null,
    status: "pending",
    triageLevel: "soon",
  },
  {
    physicianName: "Dr. Amara Diallo",
    patientName: "David Kowalski",
    dob: "1979-05-14",
    email: "david.kowalski@email.com",
    phone: "+1 (647) 555-0131",
    reason: "Stable depression check-in, currently on medication",
    notes: "On sertraline 50mg for 8 months. Doing well overall.",
    status: "confirmed",
    triageLevel: null,
  },
  {
    physicianName: "Dr. Amara Diallo",
    patientName: "Fatima Al-Rashid",
    dob: "2000-03-08",
    email: "fatima.alrashid@email.com",
    phone: "+1 (416) 555-0104",
    reason: "First appointment, referred by GP for low mood and sleep issues",
    notes: null,
    status: "pending",
    triageLevel: null,
  },
];

async function seed() {
  console.log("Seeding physicians...");

  const physicianIdMap: Record<string, string> = {};

  for (const data of PHYSICIAN_DATA) {
    const existing = await db
      .select({ id: physicians.id })
      .from(physicians)
      .where(eq(physicians.name, data.name))
      .limit(1);

    if (existing.length > 0) {
      console.log(`  Skipping ${data.name} — already exists`);
      physicianIdMap[data.name] = existing[0].id;
      continue;
    }

    const [physician] = await db.insert(physicians).values(data).returning();
    console.log(`  Inserted ${physician.name}`);
    physicianIdMap[data.name] = physician.id;

    const slots = generateSlots(physician.id);
    await db.insert(timeSlots).values(slots);
    console.log(`  Inserted ${slots.length} slots for ${physician.name}`);
  }

  console.log("Seeding bookings...");

  const existingBookings = await db.select({ id: bookings.id }).from(bookings).limit(1);
  if (existingBookings.length > 0) {
    console.log("  Skipping bookings — already exist");
    console.log("Done.");
    return;
  }

  for (const data of BOOKING_SEED_DATA) {
    const physicianId = physicianIdMap[data.physicianName];
    if (!physicianId) {
      console.log(`  Skipping booking for ${data.patientName} — physician not found`);
      continue;
    }

    const [slot] = await db
      .select({ id: timeSlots.id })
      .from(timeSlots)
      .where(and(eq(timeSlots.physicianId, physicianId), eq(timeSlots.available, true)))
      .orderBy(asc(timeSlots.startsAt))
      .limit(1);

    if (!slot) {
      console.log(`  Skipping booking for ${data.patientName} — no available slots`);
      continue;
    }

    await db
      .update(timeSlots)
      .set({ available: false })
      .where(eq(timeSlots.id, slot.id));

    await db.insert(bookings).values({
      slotId: slot.id,
      reference: nanoid(10),
      patientName: data.patientName,
      dob: data.dob,
      email: data.email,
      phone: data.phone,
      reason: data.reason,
      notes: data.notes,
      status: data.status,
      triageLevel: data.triageLevel,
    });

    console.log(`  Inserted booking for ${data.patientName}`);
  }

  console.log("Done.");
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
