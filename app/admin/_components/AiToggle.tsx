"use client";

import { useOptimistic, useTransition } from "react";

export default function AiToggle({
  enabled,
  toggleAction,
}: {
  enabled: boolean;
  toggleAction: () => Promise<void>;
}) {
  const [pending, startTransition] = useTransition();
  const [optimisticEnabled, setOptimisticEnabled] = useOptimistic(enabled);

  function handleToggle() {
    startTransition(async () => {
      setOptimisticEnabled(!optimisticEnabled);
      await toggleAction();
    });
  }

  return (
    <button
      onClick={handleToggle}
      disabled={pending}
      className={`flex items-center gap-2 w-full group transition-opacity ${pending ? "opacity-50" : ""}`}
      aria-label={optimisticEnabled ? "Disable AI triage" : "Enable AI triage"}
    >
      <div className="relative w-2.5 h-2.5 shrink-0">
        {optimisticEnabled ? (
          <div className="w-2.5 h-2.5 rounded-full bg-linear-t-to-br from-pink-400 via-purple-400 to-blue-400 blur-[2px] animate-orb-pulse" />
        ) : (
          <div className="w-2.5 h-2.5 rounded-full bg-border" />
        )}
      </div>
      <span className="text-xs text-muted uppercase tracking-wide group-hover:text-foreground transition-colors">
        AI Triage
      </span>
    </button>
  );
}
