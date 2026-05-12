import { Suspense } from "react";
import { db } from "@/lib/db";
import { bookings, timeSlots, physicians } from "@/lib/db/schema";
import { eq, desc, and } from "drizzle-orm";
import type { BookingStatus, TriageLevel } from "@/lib/db/schema";
import { triageLevelEnum } from "@/lib/db/schema";
import { updateBookingStatus } from "@/lib/actions/bookings";
import { logout } from "@/lib/actions/auth";
import { getAiEnabled, toggleAi } from "@/lib/actions/settings";
import { triageLabel, triageStyles } from "@/lib/utils";
import BookingRow from "./_components/BookingRow";
import AiToggle from "./_components/AiToggle";
import PhysicianSelect from "./_components/PhysicianSelect";
import TriageIcon from "./_components/TriageIcon";
import RefreshButton from "./_components/RefreshButton";

const STATUSES: BookingStatus[] = ["pending", "confirmed", "cancelled"];
const TRIAGE_LEVELS = triageLevelEnum.enumValues;

function filterHref(sp: Record<string, string>, key: string, value: string) {
  const params = new URLSearchParams(sp);
  if (value) {
    params.set(key, value);
  } else {
    params.delete(key);
  }
  const qs = params.toString();
  return qs ? `/admin?${qs}` : "/admin";
}

async function BookingsTable({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const [sp, aiEnabled] = await Promise.all([
    searchParams,
    getAiEnabled(),
  ]);

  const statusFilter = STATUSES.includes(sp.status as BookingStatus)
    ? (sp.status as BookingStatus)
    : null;
  const triageFilter = TRIAGE_LEVELS.includes(sp.triage as TriageLevel)
    ? (sp.triage as TriageLevel)
    : null;
  const physicianFilter = sp.physician ?? null;

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
      triageLevel: bookings.triageLevel,
      createdAt: bookings.createdAt,
      startsAt: timeSlots.startsAt,
      physicianName: physicians.name,
      specialty: physicians.specialty,
    })
    .from(bookings)
    .innerJoin(timeSlots, eq(bookings.slotId, timeSlots.id))
    .innerJoin(physicians, eq(timeSlots.physicianId, physicians.id))
    .where(and(
      statusFilter ? eq(bookings.status, statusFilter) : undefined,
      triageFilter ? eq(bookings.triageLevel, triageFilter) : undefined,
      physicianFilter ? eq(physicians.id, physicianFilter) : undefined,
    ))
    .orderBy(desc(bookings.createdAt));

  const hasFilters = !!(statusFilter || triageFilter || physicianFilter);

  return (
    <div className="w-full rounded-xl border border-border">
      {rows.length === 0 ? (
        <p className="text-muted text-sm py-12 text-center">
          No bookings{hasFilters ? " matching the selected filters" : ""}.
        </p>
      ) : (
        <ul className="flex flex-col divide-y divide-border">
          {rows.map((row) => (
            <BookingRow
              key={row.id}
              booking={row}
              updateStatusAction={updateBookingStatus}
              aiEnabled={aiEnabled}
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
        <RefreshButton />
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
          <div className="flex flex-col gap-3 mb-6">
            <div className="flex gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-8 w-24 rounded-lg bg-surface animate-pulse" />
              ))}
            </div>
          </div>
        }
      >
        <Filters
          searchParams={props.searchParams as Promise<Record<string, string>>}
        />
      </Suspense>

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

async function Filters({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const [sp, aiEnabled, physicianRows] = await Promise.all([
    searchParams,
    getAiEnabled(),
    db.select({ id: physicians.id, name: physicians.name }).from(physicians).orderBy(physicians.name),
  ]);

  const currentStatus = sp.status ?? "";
  const currentTriage = sp.triage ?? "";
  const currentPhysician = sp.physician ?? "";

  return (
    <div className="flex flex-col gap-3 mb-6">
      {/* Status + Physician + Refresh */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex gap-2 flex-wrap">
          {(["", ...STATUSES] as const).map((s) => (
            <a
              key={s}
              href={filterHref(sp, "status", s)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors text-center min-w-24 ${
                currentStatus === s
                  ? "bg-brand text-brand-fg border border-transparent"
                  : "bg-surface border border-border text-muted hover:text-foreground hover:border-brand"
              }`}
            >
              {s === "" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
            </a>
          ))}
        </div>
        <PhysicianSelect physicians={physicianRows} current={currentPhysician} />
      </div>

      {aiEnabled && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-medium text-muted uppercase tracking-wide">AI triage</span>
          <a
            href={filterHref(sp, "triage", "")}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
              currentTriage === ""
                ? "bg-brand text-brand-fg border-transparent"
                : "bg-surface border-border text-muted hover:text-foreground hover:border-brand"
            }`}
          >
            All
          </a>
          {TRIAGE_LEVELS.map((t) => {
            const active = currentTriage === t;
            return (
              <a
                key={t}
                href={filterHref(sp, "triage", t)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
                  active
                    ? triageStyles(t as TriageLevel)
                    : "bg-surface border-border text-muted hover:text-foreground hover:border-brand"
                }`}
              >
                {active && <TriageIcon level={t as TriageLevel} size={11} />}
                {triageLabel(t as TriageLevel)}
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
