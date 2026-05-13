"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { z } from "zod/v4";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { timeSlots, bookings } from "@/lib/db/schema";
import type { BookingStatus } from "@/lib/db/schema";
import { nanoid } from "nanoid";
import { getAiEnabled } from "@/lib/actions/settings";
import { classifyTriage } from "@/lib/ai/triage";

const BookingSchema = z.object({
  slotId: z.string().uuid(),
  patientName: z.string().min(2, "Full name is required"),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Valid date of birth required").refine(
    (val) => new Date(val) <= new Date(),
    "Date of birth cannot be in the future"
  ),
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

  const [booking] = await db.insert(bookings).values({
    slotId,
    reference,
    patientName: patientData.patientName,
    dob: patientData.dob,
    email: patientData.email,
    phone: patientData.phone,
    reason: patientData.reason,
    notes: patientData.notes ?? null,
  }).returning({ id: bookings.id });

  after(async () => {
    const aiEnabled = await getAiEnabled();
    if (!aiEnabled) return;

    const level = await classifyTriage(patientData.reason, patientData.notes ?? null);
    if (!level) return;

    await db
      .update(bookings)
      .set({ triageLevel: level })
      .where(eq(bookings.id, booking.id));
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
