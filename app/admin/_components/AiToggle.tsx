"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export default function AiToggle({
  enabled,
  toggleAction,
}: {
  enabled: boolean;
  toggleAction: () => Promise<void>;
}) {
  const router = useRouter();
  const [localEnabled, setLocalEnabled] = useState(enabled);
  const [, startTransition] = useTransition();

  function handleToggle() {
    const next = !localEnabled;
    setLocalEnabled(next);
    startTransition(async () => {
      await toggleAction();
      router.refresh();
    });
  }

  return (
    <button
      onClick={handleToggle}
      aria-label={localEnabled ? "Disable AI features" : "Enable AI features"}
      className="flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors"
    >
      <span
        className={`relative inline-flex w-9 h-5 rounded-full transition-colors ${
          localEnabled ? "bg-brand" : "bg-border"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
            localEnabled ? "translate-x-4" : "translate-x-0"
          }`}
        />
      </span>
      AI triage
    </button>
  );
}
