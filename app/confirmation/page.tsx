import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { bookings, timeSlots, physicians } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export default async function ConfirmationPage(
  props: PageProps<"/confirmation">
) {
  const sp = await props.searchParams;
  const ref = (sp as Record<string, string>).ref;
  if (!ref) notFound();

  const rows = await db
    .select({
      reference: bookings.reference,
      patientName: bookings.patientName,
      status: bookings.status,
      startsAt: timeSlots.startsAt,
      physicianName: physicians.name,
      specialty: physicians.specialty,
    })
    .from(bookings)
    .innerJoin(timeSlots, eq(bookings.slotId, timeSlots.id))
    .innerJoin(physicians, eq(timeSlots.physicianId, physicians.id))
    .where(eq(bookings.reference, ref))
    .limit(1);

  if (rows.length === 0) notFound();

  const booking = rows[0];
  const apptDate = new Date(booking.startsAt);

  return (
    <div className="max-w-lg mx-auto px-4 pt-16 pb-12">
      <div className="w-12 h-12 rounded-full bg-brand/10 flex items-center justify-center mb-6">
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden>
          <path
            d="M4 11l5 5 9-9"
            stroke="#35a7d0"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <h1 className="text-2xl font-semibold text-foreground mb-1">
        Booking confirmed
      </h1>
      <p className="text-muted mb-8">
        We&apos;ve received your request. Your reference number is below.
      </p>

      <div className="rounded-xl border border-border bg-surface divide-y divide-border mb-8">
        <div className="px-5 py-4">
          <p className="text-xs text-muted uppercase tracking-wide mb-1">
            Reference
          </p>
          <p className="font-mono font-semibold text-foreground text-lg tracking-widest">
            {booking.reference}
          </p>
        </div>

        <div className="px-5 py-4 grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted uppercase tracking-wide mb-1">
              Physician
            </p>
            <p className="text-sm font-medium text-foreground">
              {booking.physicianName}
            </p>
            <p className="text-sm text-muted">{booking.specialty}</p>
          </div>
          <div>
            <p className="text-xs text-muted uppercase tracking-wide mb-1">
              Appointment
            </p>
            <p className="text-sm font-medium text-foreground">
              {apptDate.toLocaleDateString("en-CA", {
                weekday: "short",
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </p>
            <p className="text-sm text-muted">
              {apptDate.toLocaleTimeString("en-CA", {
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
              })}
            </p>
          </div>
        </div>

        <div className="px-5 py-4">
          <p className="text-xs text-muted uppercase tracking-wide mb-1">
            Patient
          </p>
          <p className="text-sm font-medium text-foreground">
            {booking.patientName}
          </p>
        </div>
      </div>

      <Link
        href="/book"
        className="text-sm text-brand hover:text-brand-hover underline"
      >
        Make another booking
      </Link>
    </div>
  );
}
