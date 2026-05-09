const STEPS = ["Choose physician", "Select time", "Your details"];

export default function StepIndicator({ current }: { current: 1 | 2 | 3 }) {
  return (
    <div className="flex items-center gap-0 mb-10">
      {STEPS.map((label, i) => {
        const step = i + 1;
        const done = step < current;
        const active = step === current;

        return (
          <div key={step} className="flex items-center">
            <div className="flex items-center gap-2">
              <span
                className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  done || active ? "bg-brand text-brand-fg" : "bg-border text-muted"
                }`}
              >
                {done ? (
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    fill="none"
                    aria-hidden
                  >
                    <path
                      d="M2 6l3 3 5-5"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  step
                )}
              </span>
              <span
                className={`text-sm ${active ? "text-foreground font-medium" : "text-muted"}`}
              >
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className="w-8 h-px bg-border mx-3" />
            )}
          </div>
        );
      })}
    </div>
  );
}
