import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getPhysician } from "@/lib/actions/physicians";
import StepIndicator from "../_components/StepIndicator";
import BackLink from "@/app/_components/BackLink";
import DateNav from "./_components/DateNav";
import SlotGrid from "./_components/SlotGrid";

function today(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function parseDate(s: string | null): Date {
  if (!s) return today();
  const d = new Date(s + "T00:00:00");
  return isNaN(d.getTime()) ? today() : d;
}

export default async function SlotPickerPage(
  props: PageProps<"/book/[physicianId]">
) {
  const { physicianId } = await props.params;
  const sp = await props.searchParams;
  const date = parseDate((sp as Record<string, string>).date ?? null);

  const physician = await getPhysician(physicianId);
  if (!physician) notFound();

  return (
    <main>
      <StepIndicator current={2} />
      <BackLink href="/book" />
      <h1 className="text-2xl font-semibold text-foreground mb-1">
        Select a time
      </h1>
      <p className="text-muted mb-8">
        Booking with{" "}
        <span className="text-foreground font-medium">{physician.name}</span>
        {" "}·{" "}
        <span>{physician.specialty}</span>
      </p>

      <DateNav physicianId={physicianId} />

      <Suspense
        key={date.toISOString()}
        fallback={
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="h-10 rounded-lg bg-surface animate-pulse"
              />
            ))}
          </div>
        }
      >
        <SlotGrid physicianId={physicianId} date={date} />
      </Suspense>
    </main>
  );
}
