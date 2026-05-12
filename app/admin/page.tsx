import { Suspense } from "react";
import Link from "next/link";
import { db } from "@/lib/db";
import { bookings, timeSlots, physicians } from "@/lib/db/schema";
import { eq, desc, and, inArray } from "drizzle-orm";
import type { BookingStatus, TriageLevel } from "@/lib/db/schema";
import { triageLevelEnum } from "@/lib/db/schema";
import { updateBookingStatus } from "@/lib/actions/bookings";
import { logout } from "@/lib/actions/auth";
import { getAiEnabled, toggleAi } from "@/lib/actions/settings";
import { getPhysicians } from "@/lib/actions/physicians";
import {
  triageLabel,
  triageColor,
  triageStyles,
  TRIAGE_LEVELS_ORDERED,
} from "@/lib/utils";
import BookingRow from "./_components/BookingRow";
import AiToggle from "./_components/AiToggle";
import PhysicianSelect from "./_components/PhysicianSelect";
import TriageIcon from "./_components/TriageIcon";
import RefreshButton from "./_components/RefreshButton";
import MobileFilterBar from "./_components/MobileFilterBar";

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

function toggleStatusHref(sp: Record<string, string>, status: BookingStatus): string {
  const params = new URLSearchParams(sp);
  const current = sp.status ? sp.status.split(",").filter(Boolean) : [];
  const idx = current.indexOf(status);
  if (idx === -1) {
    current.push(status);
  } else {
    current.splice(idx, 1);
  }
  if (current.length === 0 || current.length === STATUSES.length) {
    params.delete("status");
  } else {
    params.set("status", current.join(","));
  }
  const qs = params.toString();
  return qs ? `/admin?${qs}` : "/admin";
}

async function BookingsTable({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const [sp, aiEnabled] = await Promise.all([searchParams, getAiEnabled()]);

  const statusFilter = sp.status
    ? sp.status.split(",").filter((s): s is BookingStatus => STATUSES.includes(s as BookingStatus))
    : [];
  const triageFilter =
    aiEnabled && TRIAGE_LEVELS.includes(sp.triage as TriageLevel)
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
    .where(
      and(
        statusFilter.length > 0 ? inArray(bookings.status, statusFilter) : undefined,
        triageFilter ? eq(bookings.triageLevel, triageFilter) : undefined,
        physicianFilter ? eq(physicians.id, physicianFilter) : undefined,
      ),
    )
    .orderBy(desc(bookings.createdAt));

  const hasFilters = !!(statusFilter.length > 0 || triageFilter || physicianFilter);

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

function AdminHeader() {
  return (
    <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-2 pt-3 pb-2">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold text-foreground">Bookings</h1>
          <RefreshButton />
        </div>
        <p className="text-muted text-sm mt-0.5">Manage patient appointments</p>
      </div>
      <div className="flex items-center gap-4">
        <Link href="/book" className="text-sm text-muted hover:text-foreground transition-colors">
          Patient View
        </Link>
        <form action={logout}>
          <button
            type="submit"
            className="text-sm text-muted hover:text-foreground transition-colors cursor-pointer"
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
    <aside className="hidden lg:block lg:w-48 shrink-0">
      <div className="lg:sticky lg:top-40 bg-surface rounded-xl border border-border p-4">
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
            AI-generated from patient-reported symptoms. Not reviewed by a
            clinician.
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
                <h1 className="text-2xl font-semibold text-foreground">
                  Bookings
                </h1>
                <p className="text-muted text-sm mt-0.5">
                  Manage patient appointments
                </p>
              </div>
            }
          >
            <AdminHeader />
          </Suspense>

          <div className="hidden lg:block">
            <Suspense
              fallback={
                <div className="flex gap-2 pb-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-8 w-24 rounded-lg bg-surface animate-pulse"
                    />
                  ))}
                </div>
              }
            >
              <Filters
                searchParams={
                  props.searchParams as Promise<Record<string, string>>
                }
              />
            </Suspense>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto w-full px-4 pt-28 xs:pt-20 lg:pt-40 pb-28 lg:pb-12 flex flex-col lg:flex-row gap-6">
        <div className="flex-1 min-w-0">
          <Suspense
            fallback={
              <div className="flex flex-col gap-3">
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
              searchParams={
                props.searchParams as Promise<Record<string, string>>
              }
            />
          </Suspense>
        </div>

        <Suspense
          fallback={
            <aside className="hidden lg:block lg:w-48 shrink-0">
              <div className="lg:sticky lg:top-40 bg-surface rounded-xl border border-border p-4 h-48 animate-pulse" />
            </aside>
          }
        >
          <TriageSidebar
            searchParams={props.searchParams as Promise<Record<string, string>>}
          />
        </Suspense>
      </div>

      <div className="lg:hidden fixed bottom-0 left-0 right-0 h-32 bg-linear-to-t from-background to-transparent pointer-events-none z-10" />

      <Suspense
        fallback={
          <div className="lg:hidden fixed bottom-4 left-2 right-2 z-20 bg-background border border-border rounded-2xl shadow-lg">
            <div className="flex items-center gap-2 px-3 py-3">
              <div className="flex-1 h-8 rounded-lg bg-surface animate-pulse" />
              <div className="w-32 h-8 rounded-lg bg-surface animate-pulse" />
              <div className="w-8 h-8 rounded-full bg-surface animate-pulse shrink-0" />
            </div>
          </div>
        }
      >
        <MobileFiltersWrapper />
      </Suspense>
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
    getPhysicians(),
  ]);

  const activeStatuses = sp.status ? sp.status.split(",").filter(Boolean) : [];
  const currentPhysician = sp.physician ?? "";

  return (
    <div className="pb-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-2 flex-wrap">
          {STATUSES.map((s) => (
            <a
              key={s}
              href={toggleStatusHref(sp, s)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors text-center min-w-24 ${
                activeStatuses.includes(s)
                  ? "bg-brand text-brand-fg border border-transparent"
                  : "bg-surface border border-border text-muted hover:text-foreground hover:border-brand"
              }`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </a>
          ))}
          {(activeStatuses.length > 0 || currentPhysician) && (
            <a
              href="/admin"
              className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors text-center text-muted hover:text-foreground"
            >
              Clear
            </a>
          )}
        </div>
        <PhysicianSelect
          physicians={physicianRows}
          current={currentPhysician}
        />
      </div>
    </div>
  );
}

async function MobileFiltersWrapper() {
  const [aiEnabled, physicianRows] = await Promise.all([
    getAiEnabled(),
    getPhysicians(),
  ]);

  return (
    <MobileFilterBar
      key={String(aiEnabled)}
      physicians={physicianRows}
      aiEnabled={aiEnabled}
      toggleAction={toggleAi}
    />
  );
}
