"use client";

import { useState } from "react";
import type { BookingStatus } from "@/lib/db/schema";
import { statusStyles } from "@/lib/utils";

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
  createdAt: Date;
  startsAt: Date;
  physicianName: string;
  specialty: string;
};

type Props = {
  booking: Booking;
  updateStatusAction: (id: string, status: BookingStatus) => Promise<void>;
};

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted uppercase tracking-wide mb-0.5">{label}</p>
      <p className="text-foreground">{value}</p>
    </div>
  );
}

export default function BookingRow({ booking, updateStatusAction }: Props) {
  const [expanded, setExpanded] = useState(false);

  const apptDate = new Date(booking.startsAt);
  const apptDateStr = apptDate.toLocaleDateString("en-CA", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const apptTimeStr = apptDate.toLocaleTimeString("en-CA", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  const bookedAtStr = new Date(booking.createdAt).toLocaleDateString("en-CA", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <li className="px-5 py-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-medium text-foreground">{booking.patientName}</span>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${statusStyles(booking.status)}`}>
              {booking.status}
            </span>
            <span className="font-mono text-xs text-muted">{booking.reference}</span>
          </div>
          <p className="text-sm text-muted mt-0.5">
            {`${booking.physicianName} · ${booking.specialty} · ${apptDateStr} at ${apptTimeStr}`}
          </p>
        </div>

        <div className="flex items-center justify-end gap-2 shrink-0 w-52">
          {booking.status === "pending" && (
            <form action={() => updateStatusAction(booking.id, "confirmed")}>
              <button
                type="submit"
                className="text-xs font-medium px-3 py-1.5 rounded-lg bg-brand text-brand-fg hover:bg-brand-hover transition-colors"
              >
                Confirm
              </button>
            </form>
          )}
          {booking.status !== "cancelled" && (
            <form action={() => updateStatusAction(booking.id, "cancelled")}>
              <button
                type="submit"
                className="text-xs font-medium px-3 py-1.5 rounded-lg border border-border text-muted hover:border-red-300 hover:text-red-600 transition-colors"
              >
                Cancel
              </button>
            </form>
          )}
          <button
            onClick={() => setExpanded((e) => !e)}
            className="text-xs font-medium px-3 py-1.5 rounded-lg border border-border text-muted hover:text-foreground hover:border-brand transition-colors"
          >
            {expanded ? "Hide" : "Details"}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3 text-sm bg-surface rounded-xl px-4 py-4 border border-border">
          <DetailField label="Email" value={booking.email} />
          <DetailField label="Phone" value={booking.phone} />
          <DetailField label="Date of birth" value={booking.dob} />
          <div className="col-span-2 sm:col-span-3">
            <DetailField label="Reason" value={booking.reason} />
          </div>
          {booking.notes && (
            <div className="col-span-2 sm:col-span-3">
              <DetailField label="Notes" value={booking.notes} />
            </div>
          )}
          <DetailField label="Booked at" value={bookedAtStr} />
          <div className="col-span-2 sm:col-span-3 pt-2 border-t border-border mt-1">
            <p className="text-xs text-muted uppercase tracking-wide mb-1.5">Override status</p>
            <select
              value={booking.status}
              onChange={(e) => updateStatusAction(booking.id, e.target.value as BookingStatus)}
              className="text-xs font-medium px-2 py-1.5 rounded-lg border border-border bg-white text-foreground focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-colors"
            >
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      )}
    </li>
  );
}
