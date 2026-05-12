import { Suspense } from "react";
import { db } from "@/lib/db";
import { bookings, timeSlots, physicians } from "@/lib/db/schema";
import { eq, desc, and } from "drizzle-orm";
import type { BookingStatus, TriageLevel } from "@/lib/db/schema";
import { triageLevelEnum } from "@/lib/db/schema";
import { updateBookingStatus } from "@/lib/actions/bookings";
import { logout } from "@/lib/actions/auth";
import { getAiEnabled, toggleAi } from "@/lib/actions/settings";
import { triageLabel, triageColor, triageStyles } from "@/lib/utils";
import BookingRow from "./_components/BookingRow";
import AiToggle from "./_components/AiToggle";
import PhysicianSelect from "./_components/PhysicianSelect";
import TriageIcon from "./_components/TriageIcon";
import RefreshButton from "./_components/RefreshButton";

const STATUSES: BookingStatus[] = ["pending", "confirmed", "cancelled"];
const TRIAGE_LEVELS = triageLevelEnum.enumValues;
const TRIAGE_LEVELS_ORDERED: TriageLevel[] = ["safety_flag", "urgent", "soon", "routine", "administrative"];

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
  const triageFilter = aiEnabled && TRIAGE_LEVELS.includes(sp.triage as TriageLevel)
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
  return (
    <div className="flex items-center justify-between pt-5 pb-3">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Bookings</h1>
        <p className="text-muted text-sm mt-0.5">Manage patient appointments</p>
      </div>
      <div className="flex items-center gap-4">
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

async function TriageSidebar({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const [sp, aiEnabled] = await Promise.all([searchParams, getAiEnabled()]);
  const currentTriage = sp.triage ?? "";

  return (
    <aside className="w-48 shrink-0">
      <div className="sticky top-40 bg-surface rounded-xl border border-border p-4">
        <div className="mb-3">
          <AiToggle enabled={aiEnabled} toggleAction={toggleAi} />
        </div>

        {aiEnabled ? (
          <nav className="flex flex-col gap-0.5">
            <a
              href={filterHref(sp, "triage", "")}
              className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm transition-colors ${
                currentTriage === ""
                  ? "bg-brand/10 text-brand font-medium"
                  : "text-muted hover:text-foreground hover:bg-border/40"
              }`}
            >
              All
            </a>
            {TRIAGE_LEVELS_ORDERED.map((t) => {
              const active = currentTriage === t;
              return (
                <a
                  key={t}
                  href={filterHref(sp, "triage", t)}
                  className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm transition-colors ${
                    active
                      ? `${triageStyles(t)} font-medium`
                      : "text-muted hover:text-foreground hover:bg-border/40"
                  }`}
                >
                  <span className={active ? "" : triageColor(t)}>
                    <TriageIcon level={t} size={13} />
                  </span>
                  {triageLabel(t)}
                </a>
              );
            })}
          </nav>
        ) : (
          <p className="text-xs text-muted/50 leading-relaxed">
            Enable AI triage to filter bookings by urgency level.
          </p>
        )}

        {aiEnabled && (
          <p className="text-xs text-muted/50 mt-4 leading-relaxed">
            AI-generated from patient-reported symptoms. Not reviewed by a clinician.
          </p>
        )}
      </div>
    </aside>
  );
}

export default function AdminPage(props: PageProps<"/admin">) {
  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-10 bg-background border-b border-border">
        <div className="max-w-5xl mx-auto w-full px-4">
          <Suspense
            fallback={
              <div className="py-4">
                <h1 className="text-2xl font-semibold text-foreground">Bookings</h1>
                <p className="text-muted text-sm mt-0.5">Manage patient appointments</p>
              </div>
            }
          >
            <AdminHeader />
          </Suspense>

          <Suspense
            fallback={
              <div className="flex gap-2 pb-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-8 w-24 rounded-lg bg-surface animate-pulse" />
                ))}
              </div>
            }
          >
            <Filters
              searchParams={props.searchParams as Promise<Record<string, string>>}
            />
          </Suspense>
        </div>
      </div>

      <div className="max-w-5xl mx-auto w-full px-4 pt-40 pb-12 flex gap-6">
        <div className="flex-1 min-w-0">
          <Suspense
            fallback={
              <div className="flex flex-col gap-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-16 rounded-xl bg-surface animate-pulse" />
                ))}
              </div>
            }
          >
            <BookingsTable
              searchParams={props.searchParams as Promise<Record<string, string>>}
            />
          </Suspense>
        </div>

        <Suspense fallback={null}>
          <TriageSidebar
            searchParams={props.searchParams as Promise<Record<string, string>>}
          />
        </Suspense>
      </div>
    </>
  );
}

async function Filters({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const [sp, physicianRows] = await Promise.all([
    searchParams,
    db.select({ id: physicians.id, name: physicians.name }).from(physicians).orderBy(physicians.name),
  ]);

  const currentStatus = sp.status ?? "";
  const currentPhysician = sp.physician ?? "";

  return (
    <div className="pb-4">
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
    </div>
  );
}
