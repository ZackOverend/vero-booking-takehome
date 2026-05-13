import Link from "next/link";
import { getAvailableSlots } from "@/lib/actions/physicians";

const TZ = "America/Toronto";

function formatTime(d: Date) {
  return d.toLocaleTimeString("en-CA", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: TZ,
  });
}

function toDateParam(d: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(d);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

export default async function SlotGrid({
  physicianId,
  date,
}: {
  physicianId: string;
  date: Date;
}) {
  const slots = await getAvailableSlots(physicianId, date);

  if (slots.length === 0) {
    return (
      <p className="text-muted text-sm py-8 text-center">
        No available slots for this day.
      </p>
    );
  }

  return (
    <ul className="grid grid-cols-3 sm:grid-cols-4 gap-2">
      {slots.map((slot) => (
        <li key={slot.id}>
          <Link
            href={`/book/${physicianId}/details?slotId=${slot.id}&date=${toDateParam(slot.startsAt)}`}
            className="block rounded-lg border border-border bg-surface text-center px-3 py-2.5 text-sm font-medium text-foreground hover:border-brand hover:bg-white hover:text-brand transition-colors"
          >
            {formatTime(slot.startsAt)}
          </Link>
        </li>
      ))}
    </ul>
  );
}
