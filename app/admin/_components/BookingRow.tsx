"use client";

import { useState, useTransition, useCallback } from "react";
import type { BookingStatus, TriageLevel } from "@/lib/db/schema";
import { statusStyles, triageColor, triageBorder } from "@/lib/utils";
import TriageIcon from "./TriageIcon";

type Booking = {
  id: string;
  reference: string;
  patientName: string;
  dob: string;
  email: string;
  phone: string;
  reason: string;
  notes: string | null;
  status: BookingStatus;
  triageLevel: TriageLevel | null;
  createdAt: Date;
  startsAt: Date;
  physicianName: string;
  specialty: string;
};

type Props = {
  booking: Booking;
  updateStatusAction: (id: string, status: BookingStatus) => Promise<void>;
  aiEnabled: boolean;
};

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted uppercase tracking-wide mb-0.5">{label}</p>
      <p className="text-foreground">{value}</p>
    </div>
  );
}

export default function BookingRow({ booking, updateStatusAction, aiEnabled }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [selectPending, startSelectTransition] = useTransition();
  const [copied, setCopied] = useState<string | null>(null);

  const copy = useCallback((text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  }, []);

  const apptDate = new Date(booking.startsAt);
  const apptDateStr = apptDate.toLocaleDateString("en-CA", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "America/Toronto",
  });
  const apptDateStrShort = apptDate.toLocaleDateString("en-CA", {
    month: "short",
    day: "numeric",
    timeZone: "America/Toronto",
  });
  const apptTimeStr = apptDate.toLocaleTimeString("en-CA", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "America/Toronto",
  });
  const bookedAtStr = new Date(booking.createdAt).toLocaleDateString("en-CA", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const dob = new Date(booking.dob);
  const today = new Date(booking.createdAt);
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;

  return (
    <li className="pl-3 pr-5 py-4 cursor-pointer select-none" onClick={() => setExpanded((prev) => !prev)}>
      <div className="flex items-start justify-between gap-4">
        {aiEnabled && (
          <div className="flex items-center gap-3 self-stretch shrink-0">
            {booking.triageLevel ? (
              <>
                <span className={triageColor(booking.triageLevel)}>
                  <TriageIcon level={booking.triageLevel} size={20} />
                </span>
                <div className={`w-1 self-stretch rounded-full ${triageBorder(booking.triageLevel)}`} />
              </>
            ) : (
              <>
                <span className="w-5 h-5 shrink-0" />
                <div className="w-1" />
              </>
            )}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full border w-20 text-center inline-block mb-1 ${statusStyles(booking.status)}`}>
            {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
          </span>
          <div className="pl-1">
            <span className="font-medium text-foreground">{booking.patientName}</span>
            <p className="text-sm text-muted mt-0.5">
              <span className="xs:hidden">{`${booking.physicianName}`}</span>
              <span className="hidden xs:inline">{`${booking.physicianName} · ${booking.specialty}`}</span>
            </p>
            <p className="flex items-center gap-1.5 text-sm text-muted mt-0.5">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" width={11} height={11} fill="currentColor" className="shrink-0">
                <path d="M224 64C206.3 64 192 78.3 192 96L192 128L160 128C124.7 128 96 156.7 96 192L96 240L544 240L544 192C544 156.7 515.3 128 480 128L448 128L448 96C448 78.3 433.7 64 416 64C398.3 64 384 78.3 384 96L384 128L256 128L256 96C256 78.3 241.7 64 224 64zM96 288L96 480C96 515.3 124.7 544 160 544L480 544C515.3 544 544 515.3 544 480L544 288L96 288z"/>
              </svg>
              <span className="xs:hidden">{`${apptDateStrShort} ${apptTimeStr}`}</span>
              <span className="hidden xs:inline">{`${apptDateStr} at ${apptTimeStr}`}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 shrink-0">
          <div className="hidden sm:flex items-center gap-2">
            {booking.status === "pending" && (
              <form action={() => updateStatusAction(booking.id, "confirmed")} onClick={(e) => e.stopPropagation()} className="cursor-pointer">
                <button
                  type="submit"
                  className="text-xs font-medium px-3 py-1.5 rounded-lg bg-brand text-brand-fg hover:bg-brand-hover transition-colors cursor-pointer"
                >
                  Confirm
                </button>
              </form>
            )}
            {booking.status !== "cancelled" && (
              <form action={() => updateStatusAction(booking.id, "cancelled")} onClick={(e) => e.stopPropagation()} className="cursor-pointer">
                <button
                  type="submit"
                  className="text-xs font-medium px-3 py-1.5 rounded-lg border border-border text-muted hover:border-red-300 hover:text-red-600 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </form>
            )}
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); setExpanded((prev) => !prev); }}
            className={`p-1.5 rounded-lg text-muted hover:text-foreground transition-colors cursor-pointer shrink-0 ${expanded ? "text-foreground" : ""}`}
            aria-label={expanded ? "Collapse" : "Expand"}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width={16}
              height={16}
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.75}
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
            >
              <path d="M3 6l5 5 5-5" />
            </svg>
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3 text-sm bg-surface rounded-xl px-5 py-4 border border-border select-text cursor-auto" onClick={(e) => e.stopPropagation()}>
          <div className="min-w-0">
            <div className="flex items-center gap-1 mb-0.5">
              <p className="text-xs text-muted uppercase tracking-wide">Email</p>
              <a href={`mailto:${booking.email}`} className="text-muted hover:text-foreground transition-colors" aria-label="Send email">
                <svg xmlns="http://www.w3.org/2000/svg" width={11} height={11} viewBox="0 0 640 640" fill="currentColor">
                  <path d="M112 128C85.5 128 64 149.5 64 176C64 191.1 71.1 205.3 83.2 214.4L291.2 370.4C308.3 383.2 331.7 383.2 348.8 370.4L556.8 214.4C568.9 205.3 576 191.1 576 176C576 149.5 554.5 128 528 128L112 128zM64 260L64 448C64 483.3 92.7 512 128 512L512 512C547.3 512 576 483.3 576 448L576 260L377.6 408.8C343.5 434.4 296.5 434.4 262.4 408.8L64 260z"/>
                </svg>
              </a>
            </div>
            <p className="text-foreground wrap-break-word">{booking.email}</p>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1 mb-0.5">
              <p className="text-xs text-muted uppercase tracking-wide">Phone</p>
              <a href={`tel:${booking.phone}`} className="text-muted hover:text-foreground transition-colors" aria-label="Call">
                <svg xmlns="http://www.w3.org/2000/svg" width={11} height={11} viewBox="0 0 640 640" fill="currentColor">
                  <path d="M224.2 89C216.3 70.1 195.7 60.1 176.1 65.4L170.6 66.9C106 84.5 50.8 147.1 66.9 223.3C104 398.3 241.7 536 416.7 573.1C493 589.3 555.5 534 573.1 469.4L574.6 463.9C580 444.2 569.9 423.6 551.1 415.8L453.8 375.3C437.3 368.4 418.2 373.2 406.8 387.1L368.2 434.3C297.9 399.4 241.3 341 208.8 269.3L253 233.3C266.9 222 271.6 202.9 264.8 186.3L224.2 89z"/>
                </svg>
              </a>
            </div>
            <p className="text-foreground wrap-break-word">{booking.phone}</p>
          </div>
          <DetailField
            label="Date of birth"
            value={`${booking.dob} (age ${age})`}
          />
          <div className="col-span-2 sm:col-span-3">
            <div className="flex items-center gap-1.5 mb-0.5">
              <p className="text-xs text-muted uppercase tracking-wide">Reason</p>
              <button
                onClick={() => copy(booking.reason, "reason")}
                className="text-muted hover:text-foreground transition-colors cursor-pointer"
                aria-label="Copy reason"
              >
                {copied === "reason" ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width={11} height={11} viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" width={11} height={11} fill="currentColor">
                    <path d="M288 64C252.7 64 224 92.7 224 128L224 384C224 419.3 252.7 448 288 448L480 448C515.3 448 544 419.3 544 384L544 183.4C544 166 536.9 149.3 524.3 137.2L466.6 81.8C454.7 70.4 438.8 64 422.3 64L288 64zM160 192C124.7 192 96 220.7 96 256L96 512C96 547.3 124.7 576 160 576L352 576C387.3 576 416 547.3 416 512L416 496L352 496L352 512L160 512L160 256L176 256L176 192L160 192z"/>
                  </svg>
                )}
              </button>
            </div>
            <p className="text-foreground">{booking.reason}</p>
          </div>
          {booking.notes && (
            <div className="col-span-2 sm:col-span-3">
              <div className="flex items-center gap-1.5 mb-0.5">
                <p className="text-xs text-muted uppercase tracking-wide">Notes</p>
                <button
                  onClick={() => copy(booking.notes!, "notes")}
                  className="text-muted hover:text-foreground transition-colors cursor-pointer"
                  aria-label="Copy notes"
                >
                  {copied === "notes" ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width={11} height={11} viewBox="0 0 12 12" fill="none">
                      <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" width={11} height={11} fill="currentColor">
                      <path d="M288 64C252.7 64 224 92.7 224 128L224 384C224 419.3 252.7 448 288 448L480 448C515.3 448 544 419.3 544 384L544 183.4C544 166 536.9 149.3 524.3 137.2L466.6 81.8C454.7 70.4 438.8 64 422.3 64L288 64zM160 192C124.7 192 96 220.7 96 256L96 512C96 547.3 124.7 576 160 576L352 576C387.3 576 416 547.3 416 512L416 496L352 496L352 512L160 512L160 256L176 256L176 192L160 192z"/>
                    </svg>
                  )}
                </button>
              </div>
              <p className="text-foreground">{booking.notes}</p>
            </div>
          )}
          <DetailField label="Booked at" value={bookedAtStr} />
          <div className="col-span-2 sm:col-span-3 pt-2 border-t border-border mt-1 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
            <select
              value={booking.status}
              disabled={selectPending}
              onChange={(e) => {
                const status = e.target.value as BookingStatus;
                startSelectTransition(() => updateStatusAction(booking.id, status));
              }}
              className={`text-sm px-3 py-2 rounded-lg border border-border bg-white text-foreground hover:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-colors cursor-pointer ${selectPending ? "opacity-50 pointer-events-none" : ""}`}
            >
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <div className="flex sm:hidden items-center gap-2">
              {booking.status === "pending" && (
                <form action={() => updateStatusAction(booking.id, "confirmed")} onClick={(e) => e.stopPropagation()} className="cursor-pointer">
                  <button type="submit" className="text-xs font-medium px-3 py-2 rounded-lg bg-brand text-brand-fg hover:bg-brand-hover transition-colors cursor-pointer">
                    Confirm
                  </button>
                </form>
              )}
              {booking.status !== "cancelled" && (
                <form action={() => updateStatusAction(booking.id, "cancelled")} onClick={(e) => e.stopPropagation()} className="cursor-pointer">
                  <button type="submit" className="text-xs font-medium px-3 py-2 rounded-lg border border-border text-muted hover:border-red-300 hover:text-red-600 transition-colors cursor-pointer">
                    Cancel
                  </button>
                </form>
              )}
            </div>
            </div>
            <span className="font-mono text-xs text-muted">{booking.reference}</span>
          </div>
        </div>
      )}
    </li>
  );
}
