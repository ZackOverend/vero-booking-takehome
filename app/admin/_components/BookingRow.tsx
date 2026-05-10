"use client";

import { useState } from "react";
import type { BookingStatus } from "@/lib/db/schema";

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

const statusStyles: Record<BookingStatus, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  confirmed: "bg-green-50 text-green-700 border-green-200",
  cancelled: "bg-red-50 text-red-700 border-red-200",
};

export default function BookingRow({
  booking,
  updateStatus,
}: {
  booking: Booking;
  updateStatus: (id: string, status: BookingStatus) => Promise<void>;
}) {
  const [expanded, setExpanded] = useState(false);

  const apptDate = new Date(booking.startsAt);

  return (
    <li className="py-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-medium text-foreground">{booking.patientName}</span>
            <span
              className={`text-xs font-medium px-2 py-0.5 rounded-full border ${statusStyles[booking.status]}`}
            >
              {booking.status}
            </span>
            <span className="font-mono text-xs text-muted">{booking.reference}</span>
          </div>
          <p className="text-sm text-muted mt-0.5">
            {booking.physicianName} · {booking.specialty} ·{" "}
            {apptDate.toLocaleDateString("en-CA", {
              weekday: "short",
              month: "short",
              day: "numeric",
              year: "numeric",
            })}{" "}
            at{" "}
            {apptDate.toLocaleTimeString("en-CA", {
              hour: "numeric",
              minute: "2-digit",
              hour12: true,
            })}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {booking.status === "pending" && (
            <>
              <form action={() => updateStatus(booking.id, "confirmed")}>
                <button
                  type="submit"
                  className="text-xs font-medium px-3 py-1.5 rounded-lg bg-brand text-brand-fg hover:bg-brand-hover transition-colors"
                >
                  Confirm
                </button>
              </form>
              <form action={() => updateStatus(booking.id, "cancelled")}>
                <button
                  type="submit"
                  className="text-xs font-medium px-3 py-1.5 rounded-lg border border-border text-muted hover:border-red-300 hover:text-red-600 transition-colors"
                >
                  Cancel
                </button>
              </form>
            </>
          )}
          {booking.status === "confirmed" && (
            <form action={() => updateStatus(booking.id, "cancelled")}>
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
          <div>
            <p className="text-xs text-muted uppercase tracking-wide mb-0.5">Email</p>
            <p className="text-foreground">{booking.email}</p>
          </div>
          <div>
            <p className="text-xs text-muted uppercase tracking-wide mb-0.5">Phone</p>
            <p className="text-foreground">{booking.phone}</p>
          </div>
          <div>
            <p className="text-xs text-muted uppercase tracking-wide mb-0.5">Date of birth</p>
            <p className="text-foreground">{booking.dob}</p>
          </div>
          <div className="col-span-2 sm:col-span-3">
            <p className="text-xs text-muted uppercase tracking-wide mb-0.5">Reason</p>
            <p className="text-foreground">{booking.reason}</p>
          </div>
          {booking.notes && (
            <div className="col-span-2 sm:col-span-3">
              <p className="text-xs text-muted uppercase tracking-wide mb-0.5">Notes</p>
              <p className="text-foreground">{booking.notes}</p>
            </div>
          )}
          <div>
            <p className="text-xs text-muted uppercase tracking-wide mb-0.5">Booked at</p>
            <p className="text-foreground">
              {new Date(booking.createdAt).toLocaleDateString("en-CA", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </div>
        </div>
      )}
    </li>
  );
}
