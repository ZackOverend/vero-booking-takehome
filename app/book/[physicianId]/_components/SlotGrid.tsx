import Link from "next/link";
import { getAvailableSlots } from "@/lib/actions/physicians";

function formatTime(d: Date) {
  return d.toLocaleTimeString("en-CA", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
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
            href={`/book/${physicianId}/details?slotId=${slot.id}&date=${slot.startsAt.toISOString()}`}
            className="block rounded-lg border border-border bg-surface text-center px-3 py-2.5 text-sm font-medium text-foreground hover:border-brand hover:bg-white hover:text-brand transition-colors"
          >
            {formatTime(slot.startsAt)}
          </Link>
        </li>
      ))}
    </ul>
  );
}
