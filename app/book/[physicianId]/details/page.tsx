import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getPhysician } from "@/lib/actions/physicians";
import BackLink from "@/app/_components/BackLink";
import { createBooking } from "@/lib/actions/bookings";
import StepIndicator from "../../_components/StepIndicator";
import DetailsForm from "./_components/DetailsForm";
import { db } from "@/lib/db";
import { timeSlots } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

async function DetailsContent({
  params,
  searchParams,
}: {
  params: Promise<{ physicianId: string }>;
  searchParams: Promise<Record<string, string>>;
}) {
  const [{ physicianId }, sp] = await Promise.all([params, searchParams]);
  const slotId = sp.slotId;
  const dateParam = sp.date;

  if (!slotId) notFound();

  const [physician, slotRows] = await Promise.all([
    getPhysician(physicianId),
    db.select().from(timeSlots).where(eq(timeSlots.id, slotId)).limit(1),
  ]);

  if (!physician || slotRows.length === 0) notFound();

  const slot = slotRows[0];

  if (!slot.available) {
    return (
      <p className="text-muted">
        That slot is no longer available. Please{" "}
        <a href={`/book/${physicianId}`} className="text-brand underline">
          choose another time
        </a>
        .
      </p>
    );
  }

  const slotLabel =
    slot.startsAt.toLocaleDateString("en-CA", {
      weekday: "short",
      month: "short",
      day: "numeric",
    }) +
    " at " +
    slot.startsAt.toLocaleTimeString("en-CA", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

  const backHref = dateParam
    ? `/book/${physicianId}?date=${dateParam}`
    : `/book/${physicianId}`;

  return (
    <>
      <BackLink href={backHref} />
      <h1 className="text-2xl font-semibold text-foreground mb-1">
        Your details
      </h1>
      <p className="text-muted mb-8">
        Complete the form below to confirm your appointment.
      </p>
      <DetailsForm
        key={slotId}
        slotId={slotId}
        slotLabel={slotLabel}
        physicianName={physician.name}
        specialty={physician.specialty}
        action={createBooking}
      />
    </>
  );
}

function DetailsSkeleton() {
  return (
    <div className="flex flex-col gap-5 mt-14">
      <div className="h-14 rounded-xl bg-surface animate-pulse" />
      <div className="grid grid-cols-2 gap-5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-12 rounded-lg bg-surface animate-pulse" />
        ))}
      </div>
      <div className="h-12 rounded-lg bg-surface animate-pulse" />
      <div className="h-24 rounded-lg bg-surface animate-pulse" />
      <div className="h-12 rounded-lg bg-surface animate-pulse" />
    </div>
  );
}

export default function DetailsPage(
  props: PageProps<"/book/[physicianId]/details">
) {
  return (
    <main>
      <StepIndicator current={3} />
      <Suspense fallback={<DetailsSkeleton />}>
        <DetailsContent
          params={props.params as Promise<{ physicianId: string }>}
          searchParams={props.searchParams as Promise<Record<string, string>>}
        />
      </Suspense>
    </main>
  );
}
