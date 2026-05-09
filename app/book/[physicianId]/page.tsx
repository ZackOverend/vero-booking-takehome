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

async function SlotPickerContent({
  params,
  searchParams,
}: {
  params: Promise<{ physicianId: string }>;
  searchParams: Promise<Record<string, string>>;
}) {
  const [{ physicianId }, sp] = await Promise.all([params, searchParams]);
  const date = parseDate(sp.date ?? null);

  const physician = await getPhysician(physicianId);
  if (!physician) notFound();

  return (
    <>
      <BackLink href="/book" />
      <h1 className="text-2xl font-semibold text-foreground mb-1">
        Select a time
      </h1>
      <p className="text-muted mb-8">
        Booking with{" "}
        <span className="text-foreground font-medium">{physician.name}</span>
        {" · "}
        <span>{physician.specialty}</span>
      </p>

      <DateNav physicianId={physicianId} />

      <Suspense
        key={date.toISOString()}
        fallback={
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="h-10 rounded-lg bg-surface animate-pulse" />
            ))}
          </div>
        }
      >
        <SlotGrid physicianId={physicianId} date={date} />
      </Suspense>
    </>
  );
}

export default function SlotPickerPage(
  props: PageProps<"/book/[physicianId]">
) {
  return (
    <main>
      <StepIndicator current={2} />
      <Suspense
        fallback={
          <div className="flex flex-col gap-4 mt-6">
            <div className="h-4 w-48 rounded bg-surface animate-pulse" />
            <div className="h-8 w-64 rounded bg-surface animate-pulse" />
            <div className="h-10 w-48 rounded-lg bg-surface animate-pulse mt-4" />
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-2">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="h-10 rounded-lg bg-surface animate-pulse" />
              ))}
            </div>
          </div>
        }
      >
        <SlotPickerContent
          params={props.params as Promise<{ physicianId: string }>}
          searchParams={props.searchParams as Promise<Record<string, string>>}
        />
      </Suspense>
    </main>
  );
}
