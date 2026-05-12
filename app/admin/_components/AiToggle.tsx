"use client";

import { useOptimistic, useTransition } from "react";
import { useRouter } from "next/navigation";

export default function AiToggle({
  enabled,
  toggleAction,
}: {
  enabled: boolean;
  toggleAction: () => Promise<void>;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [optimisticEnabled, setOptimisticEnabled] = useOptimistic(enabled);

  function handleToggle() {
    startTransition(async () => {
      setOptimisticEnabled(!optimisticEnabled);
      await toggleAction();
      router.refresh();
    });
  }

  return (
    <button
      onClick={handleToggle}
      disabled={pending}
      aria-label={optimisticEnabled ? "Disable AI features" : "Enable AI features"}
      className="flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors disabled:opacity-50"
    >
      <span
        className={`relative inline-flex w-9 h-5 rounded-full transition-colors ${
          optimisticEnabled ? "bg-brand" : "bg-border"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
            optimisticEnabled ? "translate-x-4" : "translate-x-0"
          }`}
        />
      </span>
      AI triage
    </button>
  );
}
