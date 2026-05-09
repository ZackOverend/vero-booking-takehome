import Link from "next/link";
import { getPhysicians } from "@/lib/actions/physicians";
import StepIndicator from "./_components/StepIndicator";

export default async function BookPage() {
  const physicians = await getPhysicians();

  return (
    <main>
      <StepIndicator current={1} />
      <h1 className="text-2xl font-semibold text-foreground mb-1">
        Choose a physician
      </h1>
      <p className="text-muted mb-8">
        Select a specialist to view their available appointment times.
      </p>

      <ul className="grid gap-3">
        {physicians.map((p) => (
          <li key={p.id}>
            <Link
              href={`/book/${p.id}`}
              className="flex items-start justify-between gap-4 rounded-xl border border-border bg-surface px-5 py-4 hover:border-brand hover:bg-white transition-colors group"
            >
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-full bg-brand/10 flex items-center justify-center shrink-0 text-brand font-semibold text-base">
                  {p.name
                    .split(" ")
                    .slice(-1)[0]
                    .charAt(0)}
                </div>
                <div>
                  <p className="font-medium text-foreground">{p.name}</p>
                  <p className="text-sm text-muted">{p.specialty}</p>
                </div>
              </div>
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                className="mt-1 shrink-0 text-muted group-hover:text-brand transition-colors"
                aria-hidden
              >
                <path
                  d="M6 3l5 5-5 5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
