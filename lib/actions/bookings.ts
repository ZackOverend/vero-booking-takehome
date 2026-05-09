"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod/v4";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { timeSlots, bookings } from "@/lib/db/schema";
import type { BookingStatus } from "@/lib/db/schema";
import { nanoid } from "nanoid";

const BookingSchema = z.object({
  slotId: z.string().uuid(),
  patientName: z.string().min(2, "Full name is required"),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Valid date of birth required"),
  email: z.email("Valid email required"),
  phone: z.string().min(6, "Phone number is required"),
  reason: z.string().min(3, "Reason for visit is required"),
  notes: z.string().optional(),
});

export type FieldErrors = Partial<Record<keyof z.infer<typeof BookingSchema>, string[]>>;

export type BookingActionState =
  | { error: "slot-taken" }
  | { error: "validation"; fieldErrors: FieldErrors }
  | null;

export async function createBooking(
  _prev: BookingActionState,
  formData: FormData
): Promise<BookingActionState> {
  const raw = Object.fromEntries(formData);
  const parsed = BookingSchema.safeParse(raw);

  if (!parsed.success) {
    return {
      error: "validation",
      fieldErrors: parsed.error.flatten().fieldErrors as FieldErrors,
    };
  }

  const { slotId, ...patientData } = parsed.data;

  const [claimed] = await db
    .update(timeSlots)
    .set({ available: false })
    .where(and(eq(timeSlots.id, slotId), eq(timeSlots.available, true)))
    .returning({ id: timeSlots.id });

  if (!claimed) {
    return { error: "slot-taken" };
  }

  const reference = nanoid(10);

  await db.insert(bookings).values({
    slotId,
    reference,
    patientName: patientData.patientName,
    dob: patientData.dob,
    email: patientData.email,
    phone: patientData.phone,
    reason: patientData.reason,
    notes: patientData.notes ?? null,
  });

  redirect(`/confirmation?ref=${reference}`);
}

export async function updateBookingStatus(id: string, status: BookingStatus) {
  await db
    .update(bookings)
    .set({ status })
    .where(eq(bookings.id, id));

  revalidatePath("/admin");
}
