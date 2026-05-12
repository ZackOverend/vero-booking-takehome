"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import TriageIcon from "./TriageIcon";
import {
  triageLabel,
  triageColor,
  triageStyles,
  TRIAGE_LEVELS_ORDERED,
} from "@/lib/utils";

type Physician = { id: string; name: string };

type Props = {
  physicians: Physician[];
  aiEnabled: boolean;
  toggleAction: () => Promise<void>;
};

const STATUSES = ["pending", "confirmed", "cancelled"] as const;
const STATUS_LABELS: Record<string, string> = {
  pending: "Pend",
  confirmed: "Conf",
  cancelled: "Canc",
};

export default function MobileFilterBar({
  physicians,
  aiEnabled,
  toggleAction,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [triageOpen, setTriageOpen] = useState(false);
  const [optimisticEnabled, setOptimisticEnabled] = useState(aiEnabled);
  const [pending, startTransition] = useTransition();

  const activeStatuses = (searchParams.get("status") ?? "").split(",").filter(Boolean);
  const currentPhysician = searchParams.get("physician") ?? "";
  const currentTriage = searchParams.get("triage") ?? "";

  function update(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    const qs = params.toString();
    router.push(qs ? `/admin?${qs}` : "/admin");
    setTriageOpen(false);
  }

  function toggleStatus(status: string) {
    const params = new URLSearchParams(searchParams.toString());
    const idx = activeStatuses.indexOf(status);
    const next = [...activeStatuses];
    if (idx === -1) {
      next.push(status);
    } else {
      next.splice(idx, 1);
    }
    if (next.length === 0 || next.length === STATUSES.length) {
      params.delete("status");
    } else {
      params.set("status", next.join(","));
    }
    const qs = params.toString();
    router.push(qs ? `/admin?${qs}` : "/admin");
  }

  const activeTriageLevel =
    TRIAGE_LEVELS_ORDERED.find((t) => t === currentTriage) ?? null;

  return (
    <>
      {triageOpen && (
        <div
          className="lg:hidden fixed inset-0 z-10"
          onClick={() => setTriageOpen(false)}
        />
      )}

      <div className="lg:hidden fixed bottom-4 left-2 right-2 z-20 bg-background border border-border rounded-2xl shadow-lg">
        {/* Triage popover */}
        {optimisticEnabled && triageOpen && (
          <div className="absolute bottom-full right-4 mb-2 z-20 bg-background border border-border rounded-xl shadow-lg p-2 w-44">
            <button
              onClick={() => update("triage", "")}
              className={`flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm transition-colors ${
                currentTriage === ""
                  ? "bg-brand/10 text-brand font-medium"
                  : "text-muted hover:text-foreground hover:bg-surface"
              }`}
            >
              All triage
            </button>
            {TRIAGE_LEVELS_ORDERED.map((t) => {
              const active = currentTriage === t;
              return (
                <button
                  key={t}
                  onClick={() => update("triage", t)}
                  className={`flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm transition-colors ${
                    active
                      ? `${triageStyles(t)} font-medium`
                      : "text-muted hover:text-foreground hover:bg-surface"
                  }`}
                >
                  <span className={active ? "" : triageColor(t)}>
                    <TriageIcon level={t} size={12} />
                  </span>
                  {triageLabel(t)}
                </button>
              );
            })}
            <div className="border-t border-border mt-1 pt-1">
              <button
                onClick={() => {
                  setOptimisticEnabled(false);
                  setTriageOpen(false);
                  startTransition(async () => {
                    await toggleAction();
                  });
                }}
                className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-muted hover:text-foreground hover:bg-surface transition-colors"
              >
                Disable AI triage
              </button>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 px-3 py-3">
          {/* Status segmented tabs */}
          <div className="flex flex-1 items-center gap-1.5">
            {STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => toggleStatus(s)}
                className={`flex-1 text-center text-xs font-medium py-1.5 rounded-lg border transition-colors ${
                  activeStatuses.includes(s) ? "bg-brand text-brand-fg border-transparent" : "bg-surface border-border text-muted"
                }`}
              >
                <span className="xs:hidden">{STATUS_LABELS[s]}</span>
                <span className="hidden xs:inline">
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </span>
              </button>
            ))}
          </div>

          {/* Physician dropdown */}
          <select
            value={currentPhysician}
            onChange={(e) => update("physician", e.target.value)}
            className="w-32 text-xs font-medium px-2 py-1.5 rounded-lg border border-border bg-surface text-muted focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-colors"
          >
            <option value="">All doctors</option>
            {physicians.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          {/* AI triage bubble */}
          <button
            onClick={() => {
              if (!optimisticEnabled) {
                setOptimisticEnabled(true);
                startTransition(async () => {
                  await toggleAction();
                });
              } else {
                setTriageOpen((o) => !o);
              }
            }}
            disabled={pending}
            className={`relative w-8 h-8 rounded-full shrink-0 flex items-center justify-center transition-opacity ${pending ? "opacity-50" : ""}`}
            aria-label={
              optimisticEnabled ? "AI triage filter" : "Enable AI triage"
            }
          >
            {optimisticEnabled ? (
              <>
                <div className="absolute inset-0 rounded-full bg-linear-to-br from-pink-400 via-purple-400 to-blue-400 blur-[2px] animate-orb-pulse" />
                <div className="absolute inset-0.5 rounded-full bg-linear-to-br from-pink-400 via-purple-400 to-blue-500" />
                {activeTriageLevel && (
                  <span className="relative z-10 text-white">
                    <TriageIcon level={activeTriageLevel} size={12} />
                  </span>
                )}
              </>
            ) : (
              <div className="absolute inset-0 rounded-full bg-border" />
            )}
          </button>
        </div>
      </div>
    </>
  );
}
