import { Suspense } from "react";
import { db } from "@/lib/db";
import { bookings, timeSlots, physicians } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import type { BookingStatus } from "@/lib/db/schema";
import { updateBookingStatus } from "@/lib/actions/bookings";
import { logout } from "@/lib/actions/auth";
import { getAiEnabled, toggleAi } from "@/lib/actions/settings";
import BookingRow from "./_components/BookingRow";
import LiveRefresh from "./_components/LiveRefresh";
import AiToggle from "./_components/AiToggle";

const STATUSES: BookingStatus[] = ["pending", "confirmed", "cancelled"];

async function BookingsTable({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const sp = await searchParams;
  const filter = STATUSES.includes(sp.status as BookingStatus)
    ? (sp.status as BookingStatus)
    : null;

  const rows = await db
    .select({
      id: bookings.id,
      reference: bookings.reference,
      patientName: bookings.patientName,
      dob: bookings.dob,
      email: bookings.email,
      phone: bookings.phone,
      reason: bookings.reason,
      notes: bookings.notes,
      status: bookings.status,
      createdAt: bookings.createdAt,
      startsAt: timeSlots.startsAt,
      physicianName: physicians.name,
      specialty: physicians.specialty,
    })
    .from(bookings)
    .innerJoin(timeSlots, eq(bookings.slotId, timeSlots.id))
    .innerJoin(physicians, eq(timeSlots.physicianId, physicians.id))
    .where(filter ? eq(bookings.status, filter) : undefined)
    .orderBy(desc(bookings.createdAt));

  return (
    <div className="w-full rounded-xl border border-border">
      {rows.length === 0 ? (
        <p className="text-muted text-sm py-12 text-center">
          No bookings{filter ? ` with status "${filter}"` : ""}.
        </p>
      ) : (
        <ul className="flex flex-col divide-y divide-border">
          {rows.map((row) => (
            <BookingRow
              key={row.id}
              booking={row}
              updateStatusAction={updateBookingStatus}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

async function AdminHeader() {
  const aiEnabled = await getAiEnabled();
  return (
    <div className="flex items-center justify-between mb-8">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Bookings</h1>
        <p className="text-muted text-sm mt-1">Manage patient appointments</p>
      </div>
      <div className="flex items-center gap-4">
        <AiToggle enabled={aiEnabled} toggleAction={toggleAi} />
        <form action={logout}>
          <button
            type="submit"
            className="text-sm text-muted hover:text-foreground transition-colors"
          >
            Sign out
          </button>
        </form>
      </div>
    </div>
  );
}

export default function AdminPage(props: PageProps<"/admin">) {
  return (
    <div className="max-w-4xl mx-auto w-full px-4 py-12">
      <Suspense
        fallback={
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Bookings</h1>
              <p className="text-muted text-sm mt-1">Manage patient appointments</p>
            </div>
          </div>
        }
      >
        <AdminHeader />
      </Suspense>

      <Suspense
        fallback={
          <div className="flex gap-2 mb-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-8 w-24 rounded-lg bg-surface animate-pulse" />
            ))}
          </div>
        }
      >
        <StatusFilter
          searchParams={props.searchParams as Promise<Record<string, string>>}
        />
      </Suspense>

      <LiveRefresh />
      <Suspense
        fallback={
          <div className="flex flex-col gap-3 mt-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-16 rounded-xl bg-surface animate-pulse"
              />
            ))}
          </div>
        }
      >
        <BookingsTable
          searchParams={props.searchParams as Promise<Record<string, string>>}
        />
      </Suspense>
    </div>
  );
}

async function StatusFilter({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const sp = await searchParams;
  const current = sp.status ?? "";

  return (
    <div className="flex gap-2 mb-6">
      {(["", ...STATUSES] as const).map((s) => (
        <a
          key={s}
          href={s ? `/admin?status=${s}` : "/admin"}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors text-center min-w-24 ${
            current === s
              ? "bg-brand text-brand-fg border border-transparent"
              : "bg-surface border border-border text-muted hover:text-foreground hover:border-brand"
          }`}
        >
          {s === "" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
        </a>
      ))}
    </div>
  );
}
