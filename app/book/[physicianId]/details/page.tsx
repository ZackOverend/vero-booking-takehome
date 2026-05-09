import { notFound } from "next/navigation";
import { getPhysician } from "@/lib/actions/physicians";
import BackLink from "@/app/_components/BackLink";
import { createBooking } from "@/lib/actions/bookings";
import StepIndicator from "../../_components/StepIndicator";
import DetailsForm from "./_components/DetailsForm";
import { db } from "@/lib/db";
import { timeSlots } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export default async function DetailsPage(
  props: PageProps<"/book/[physicianId]/details">
) {
  const { physicianId } = await props.params;
  const sp = await props.searchParams;
  const params = sp as Record<string, string>;

  const slotId = params.slotId;
  const dateParam = params.date;

  if (!slotId) notFound();

  const [physician, slotRows] = await Promise.all([
    getPhysician(physicianId),
    db.select().from(timeSlots).where(eq(timeSlots.id, slotId)).limit(1),
  ]);

  if (!physician || slotRows.length === 0) notFound();

  const slot = slotRows[0];

  if (!slot.available) {
    return (
      <main>
        <StepIndicator current={3} />
        <p className="text-muted">
          That slot is no longer available. Please{" "}
          <a href={`/book/${physicianId}`} className="text-brand underline">
            choose another time
          </a>
          .
        </p>
      </main>
    );
  }

  const slotDate = new Date(slot.startsAt);
  const slotLabel = slotDate.toLocaleDateString("en-CA", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }) + " at " + slotDate.toLocaleTimeString("en-CA", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  const backHref = dateParam
    ? `/book/${physicianId}?date=${dateParam}`
    : `/book/${physicianId}`;

  return (
    <main>
      <StepIndicator current={3} />
      <BackLink href={backHref} />
      <h1 className="text-2xl font-semibold text-foreground mb-1">
        Your details
      </h1>
      <p className="text-muted mb-8">
        Complete the form below to confirm your appointment.
      </p>

      <DetailsForm
        slotId={slotId}
        slotLabel={slotLabel}
        physicianName={physician.name}
        action={createBooking}
      />
    </main>
  );
}
