"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

function formatDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function parseDate(s: string | null): Date {
  if (!s) return stripTime(new Date());
  const d = new Date(s + "T00:00:00");
  return isNaN(d.getTime()) ? stripTime(new Date()) : d;
}

function stripTime(d: Date) {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
}

function relativeLabel(d: Date): string | null {
  const today = stripTime(new Date());
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  if (d.getTime() === today.getTime()) return "Today";
  if (d.getTime() === tomorrow.getTime()) return "Tomorrow";
  return null;
}

const ChevronIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 640 640"
    width="12"
    height="12"
    fill="currentColor"
    aria-hidden
    className={className}
  >
    <path d="M297.4 470.6C309.9 483.1 330.2 483.1 342.7 470.6L534.7 278.6C547.2 266.1 547.2 245.8 534.7 233.3C522.2 220.8 501.9 220.8 489.4 233.3L320 402.7L150.6 233.4C138.1 220.9 117.8 220.9 105.3 233.4C92.8 245.9 92.8 266.2 105.3 278.7L297.3 470.7z" />
  </svg>
);

export default function DateNav({ physicianId }: { physicianId: string }) {
  const router = useRouter();
  const sp = useSearchParams();
  const today = stripTime(new Date());
  const selected = parseDate(sp.get("date"));

  useEffect(() => {
    if (!sp.get("date")) {
      router.replace(`/book/${physicianId}?date=${formatDate(today)}`);
    }
  }, []);

  function navigate(delta: number) {
    const next = new Date(selected);
    next.setDate(selected.getDate() + delta);
    if (next < today) return;
    router.push(`/book/${physicianId}?date=${formatDate(next)}`);
  }

  const isPast = selected <= today;
  const relative = relativeLabel(selected);
  const dateLabel = relative
    ? `${relative}, ${selected.toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" })}`
    : selected.toLocaleDateString("en-CA", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      });

  const navBtn = "w-8 h-8 rounded-lg border border-border flex items-center justify-center text-muted hover:border-brand hover:text-brand disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors";

  return (
    <div className="flex items-center gap-2 mb-6">
      <button onClick={() => navigate(-7)} disabled={isPast} aria-label="Previous week" className={navBtn}>
        <span className="flex">
          <ChevronIcon className="rotate-90" />
          <ChevronIcon className="rotate-90 -ml-1.5" />
        </span>
      </button>

      <button onClick={() => navigate(-1)} disabled={isPast} aria-label="Previous day" className={navBtn}>
        <ChevronIcon className="rotate-90" />
      </button>

      <span className="text-sm font-medium text-foreground w-48 text-center">
        {dateLabel}
      </span>

      <button onClick={() => navigate(1)} aria-label="Next day" className={navBtn}>
        <ChevronIcon className="-rotate-90" />
      </button>

      <button onClick={() => navigate(7)} aria-label="Next week" className={navBtn}>
        <span className="flex">
          <ChevronIcon className="-rotate-90" />
          <ChevronIcon className="-rotate-90 -ml-1.5" />
        </span>
      </button>
    </div>
  );
}
