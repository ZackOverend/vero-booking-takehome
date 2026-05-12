@AGENTS.md

# Vero Booking – Project Guide

## Stack (verified from package.json)

| Layer | Package | Version |
|---|---|---|
| Framework | next | 16.2.6 |
| Runtime | react / react-dom | 19.2.4 |
| Styling | tailwindcss | ^4 |
| Compiler | @tailwindcss/postcss | ^4 |
| Language | typescript | ^5 |
| ORM | drizzle-orm | ^0.43 |
| DB | Neon Postgres (serverless) | — |
| Deploy | Vercel | — |

---

## Next.js 16 — Breaking Changes You Must Know

This is **not** Next.js 14. Before writing any route, component, or action, read the relevant file in `node_modules/next/dist/docs/`. The notes below are the most dangerous traps for code trained on older versions.

### `params` and `searchParams` are Promises (since v15, enforced in v16)

```tsx
// Correct — must await
export default async function Page({
  params,
}: {
  params: Promise<{ physicianId: string }>
}) {
  const { physicianId } = await params
}

// Old pattern — will type-error and runtime-error
export default function Page({ params }: { params: { physicianId: string } }) {
  const { physicianId } = params
}
```

Prefer the generated `PageProps` helper from `npx next typegen` — it produces fully type-safe param/searchParams types keyed by route literal:

```tsx
export default async function Page(props: PageProps<'/book/[physicianId]'>) {
  const { physicianId } = await props.params
}
```

Same for `LayoutProps<>` and `RouteContext<>`. Run `npx next typegen` after adding new dynamic routes.

### Turbopack is the default bundler

`next dev` and `next build` now use Turbopack by default. No flag needed. Do **not** add a custom `webpack` config — that will break the build.

### Caching model changed — `use cache` directive

The `fetch()` cache options (`cache: 'no-store'`, `next: { revalidate }`) are the **old model**. Next.js 16 uses a `'use cache'` directive with `cacheLife()`:

```tsx
import { cacheLife } from 'next/cache'

export async function getPhysicians() {
  'use cache'
  cacheLife('hours')
  return db.select().from(physicians)
}
```

**This project enables `cacheComponents: true`** in `next.config.ts`. Implications:

- Cached reads (`getPhysicians`) use `'use cache'` + `cacheLife('hours')`.
- Uncached reads (slot availability, bookings, confirmation lookup) MUST be wrapped in `<Suspense>` boundaries — Cache Components requires every async server work to be either cached or suspended, otherwise the build fails with a "dynamic data without Suspense" error.
- `GET` Route Handlers follow the same prerendering rules as pages.

### `refresh()` from `next/cache`, not `router.refresh()`

```ts
import { refresh } from 'next/cache'
import { revalidatePath } from 'next/cache' // also fine for path-based
```

### `revalidateTag` takes two arguments in v16

```ts
revalidateTag("settings", "max") // tag name + cache profile
```

Omitting the second argument will throw at runtime.

### Server Functions / Server Actions

The term is now **Server Functions**. "Server Action" refers specifically to a Server Function used in an `action` prop context. The `'use server'` directive still works the same way.

```ts
// app/lib/actions/bookings.ts
'use server'

export async function createBooking(formData: FormData) { ... }
export async function updateBookingStatus(id: string, status: string) { ... }
```

### React 19 hooks

- `useActionState` → from `'react'` (not react-dom)
- `useFormStatus` → from `'react-dom'`
- `useOptimistic` → from `'react'`

### Tailwind CSS v4

No `tailwind.config.js`. Configuration lives in CSS via `@theme`:

```css
/* app/globals.css */
@import 'tailwindcss';

@theme inline {
  --color-brand: #0f5c9a;
  /* etc */
}
```

PostCSS plugin is `@tailwindcss/postcss` (already configured in `postcss.config.mjs`).

### ESLint

`next lint` was **removed** in v16. Scripts use `eslint` directly — already reflected in `package.json`. `next build` no longer runs lint as a side effect.

### `middleware` → `proxy`

The `middleware.ts` convention is deprecated in v16 in favor of `proxy.ts`. This project uses `proxy.ts` for admin auth. Use a named `proxy` export with a `matcher` config. Note: `proxy` runs on Node.js only — no edge runtime.

---

## File Structure

The structure is **emergent** — do not create directories speculatively. Add files where they make sense as the project grows. The conventions below are guidelines, not a required skeleton.

```
app/
├── layout.tsx              ← root layout, fonts
├── page.tsx                ← redirect to /book
├── globals.css             ← Tailwind import + @theme tokens
├── _components/
│   └── BackLink.tsx
├── book/
│   ├── layout.tsx          ← StepIndicator wrapper
│   ├── page.tsx            ← Step 1: physician list
│   └── [physicianId]/
│       ├── page.tsx        ← Step 2: date + time slot picker
│       ├── _components/    ← DateNav, SlotGrid
│       └── details/
│           ├── page.tsx    ← Step 3: patient details form
│           └── _components/DetailsForm.tsx
├── confirmation/
│   └── page.tsx            ← booking confirmed (reference #)
└── admin/
    ├── page.tsx            ← booking management dashboard
    ├── login/page.tsx
    └── _components/        ← BookingRow, AiToggle, TriageIcon, PhysicianSelect, RefreshButton
proxy.ts                    ← admin auth gate (/admin/:path* except /admin/login)
```

Non-route code lives alongside routes or in a shared `lib/` at root level (not under `src/`). Do **not** create a `src/` wrapper — the project uses `app/` at the repo root.

Co-locating components with their route is preferred over a global `components/` unless a component is genuinely reused across unrelated routes.

---

## Data Model

### `physicians`
Seeded, read-only. Fields: `id`, `name`, `specialty`, `bio`, `avatar_url`.

### `time_slots`
Generated per physician. Fields: `id`, `physician_id`, `starts_at` (timestamp), `available` (boolean).

Slots are marked unavailable when a booking is confirmed against them. Simple boolean flag — no optimistic locking yet (listed as future work).

### `bookings`
Created by patients. Fields: `id`, `slot_id`, `reference` (nanoid, shown on confirmation), `patient_name`, `dob`, `email`, `phone`, `reason`, `notes`, `status` (`pending` | `confirmed` | `cancelled`), `triage_level` (nullable pgEnum — set async by AI after booking), `created_at`.

### `settings`
Single-row config table. Fields: `id`, `ai_enabled` (boolean, default false). Seeded from `AI_ENABLED` env var on first run. Mutated by the admin AI toggle.

---

## Server Actions — Conventions

All mutations go through Server Functions in `lib/actions/`. No separate API routes for mutations.

```
lib/
├── db/
│   ├── schema.ts           ← Drizzle table definitions
│   ├── index.ts            ← db client (Neon + drizzle)
│   ├── seed.ts             ← physicians + slots seed script
│   └── physician-data.ts   ← seeded physician records
├── actions/
│   ├── bookings.ts         ← createBooking, updateStatus
│   ├── physicians.ts       ← getPhysicians, getAvailableSlots
│   ├── settings.ts         ← getAiEnabled, toggleAi
│   └── auth.ts             ← login, logout (admin cookie)
├── ai/
│   ├── client.ts           ← Ollama Cloud client setup
│   └── triage.ts           ← isSafetyFlag, classifyTriage
├── booking-suggestions.ts  ← specialty → reason chip suggestions (patient form)
└── utils.ts                ← statusStyles, triageStyles, triageLabel, triageBorder, triageColor
```

Data-access functions (reads) live in `lib/actions/` too, exported without `'use server'` unless called from a Client Component.

---

## Patient Booking Flow

1. `/book` — list of physicians (server-rendered, cached with `use cache`)
2. `/book/[physicianId]` — date picker → slot grid (slots fetched fresh, no cache)
3. `/book/[physicianId]/details` — patient details form (Client Component for `useActionState`)
4. `/confirmation` — shows booking reference after successful submission

Step state is passed forward via URL search params or hidden form inputs, not `localStorage` or cookies.

---

## Admin Flow

`/admin` — two-column layout: bookings list (left, `flex-1`) + AI triage sidebar (right, `w-48`, sticky).

- **Fixed header** — title, Refresh button, Sign out. Status filter pills + physician dropdown below in the same fixed bar.
- **Status filter** — `?status=` URL param, pill tabs (All / Pending / Confirmed / Cancelled)
- **Physician filter** — `?physician=<id>` URL param, dropdown select in the header bar
- **AI triage sidebar** — always visible. `AiToggle` (orb indicator) at top toggles AI features. When enabled: triage filter nav (`?triage=<level>`) + disclaimer. When disabled: prompt to enable.
- Triage filter is ignored in DB queries when AI is disabled — prevents stale `?triage=` params filtering results.
- Confirm/cancel inline via Server Functions bound to form `action`
- Click any row (or chevron) to expand full patient detail. `select-none` on row prevents text highlight; expanded panel restores `select-text`.

### Admin auth

Gated by `proxy.ts` (Node.js runtime, not edge). The proxy matcher covers `/admin/:path*` except `/admin/login`. It compares an `admin_session` cookie against `ADMIN_PASSWORD` using a constant-time check; mismatch redirects to `/admin/login`.

`/admin/login` is a server-rendered form posting to a Server Action that sets the cookie and redirects.

This is intentionally a stop-gap. Real auth (magic link for patients, proper sessions for staff) is documented as future work.

---

## UX / Design

Match Vero's clean, clinical aesthetic: lots of whitespace, neutral palette, precise typography.

- **Framer Motion** — page transitions, staggered list entrances, form step transitions
- **Lenis** — smooth scroll (wrap in a Client Component provider in root layout)
- Avoid heavy gradients, shadows, or decoration; clinical = restrained

---

## Environment Variables

```
DATABASE_URL=          # Neon connection string
ADMIN_PASSWORD=        # plaintext password for /admin (stop-gap auth)
AI_ENABLED=false       # seeds the settings table on first run
OLLAMA_API_KEY=        # Bearer token from ollama.com/settings/keys
OLLAMA_MODEL=gemma4:31b
```

Never commit `.env.local`. All vars go in Vercel env vars for production.

---

## Drizzle ORM Notes

Use `drizzle-orm` with `@neondatabase/serverless` HTTP driver:

```ts
// lib/db/index.ts
import 'server-only'
import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'

const sql = neon(process.env.DATABASE_URL!)
export const db = drizzle(sql)
```

`import 'server-only'` at the top so a Client Component import fails loudly at build time.

### Slot conflict handling

The Neon HTTP driver does **not** support transactions or `SELECT FOR UPDATE`. Use a single atomic statement to claim a slot:

```ts
const [claimed] = await db
  .update(timeSlots)
  .set({ available: false })
  .where(and(eq(timeSlots.id, slotId), eq(timeSlots.available, true)))
  .returning({ id: timeSlots.id })

if (!claimed) {
  return { error: 'slot-taken' as const }
}

await db.insert(bookings).values({ slotId, /* ... */ })
```

If you ever need real `SELECT FOR UPDATE` semantics, switch to `@neondatabase/serverless`'s `Pool` (websocket driver) and `drizzle-orm/neon-serverless`. Documented as future work.

### Migrations

`drizzle-kit push` (dev) for fast iteration. Switch to generated migrations (`drizzle-kit generate` + `drizzle-kit migrate`) before production.

---

## Workflow

Build is **phased** — each phase ships its own deps and stands on its own. Do not pre-install or scaffold ahead. Plan reference: `~/.claude/plans/what-would-make-most-floating-toucan.md`.

Phases:
0. Foundation (strip CRA, enable `cacheComponents`)
1. Data layer (drizzle, neon, zod, nanoid, schema, seed)
2. Patient flow read paths
3. Booking action + confirmation
4. Admin (proxy.ts gate, dashboard, inline actions)
4.5. AI features (triage classification)
5. UX polish (framer-motion, lenis)
6. README

Pause for sign-off between phases.

---

## AI Features (Phase 4.5)

### Overview
One AI feature targeting the clinician (the actual buyer): triage classification. Powered by Gemma 4 (`gemma4:31b`) via Ollama Cloud (`https://ollama.com`). Uses the Vercel AI SDK (`ai` + `@ai-sdk/openai`) with Ollama's OpenAI-compatible endpoint (`https://ollama.com/v1`).

### Feature toggle
Stored in a `settings` DB table (`ai_enabled: boolean`), seeded from the `AI_ENABLED` env var on first run. Admin panel has a toggle switch that calls a server action to flip it live — no redeploy needed. All AI code paths check this first and degrade gracefully.

### Triage classification prompts

**Pre-flight safety check (keyword gate — runs BEFORE AI, in code):**
```ts
const EMERGENCY_KEYWORDS = [
  "chest pain", "can't breathe", "cannot breathe", "difficulty breathing",
  "shortness of breath", "stroke", "heart attack", "unconscious", "suicide",
  "suicidal", "want to die", "kill myself", "overdose", "severe bleeding",
  "not breathing", "collapsed", "seizure", "anaphylaxis", "allergic reaction"
];

function isSafetyFlag(text: string): boolean {
  const lower = text.toLowerCase();
  return EMERGENCY_KEYWORDS.some(kw => lower.includes(kw));
}
```
If flagged: set `triageLevel = "safety_flag"`, show emergency redirect UI, do NOT call AI.

**Triage classification system prompt:**
```
You are a medical booking assistant for an outpatient clinic in Toronto, Canada. Classify the urgency of a patient's appointment request based on their stated reason for visit.

Categories:
urgent — Acute, new, or rapidly worsening symptom requiring priority attention. Examples: new chest discomfort without emergency features, sudden vision or hearing change, acute infection with systemic symptoms, significant change in a chronic condition, unexplained weight loss.
soon — Needs attention within days to weeks. Not immediately dangerous but should not wait months. Examples: worsening known condition, new non-acute symptom, time-sensitive follow-up, mental health concern needing prompt attention.
routine — Stable scheduled care. Examples: chronic disease management, annual physical, preventive care, stable mental health follow-up, non-urgent test results review.
administrative — No clinical assessment required. Examples: prescription renewal, sick note, referral letter, insurance form, lab results already reviewed.

Examples:
Reason: "I've had a fever for 3 days and my throat is getting worse" → soon
Reason: "Need my metformin refill" → administrative
Reason: "Annual physical" → routine
Reason: "New lump I noticed last week, growing quickly" → urgent
Reason: "Anxiety has been much worse since last month, hard to function" → soon
Reason: "Blood pressure follow-up" → routine

Rules:
- Reply with ONLY one word: urgent, soon, routine, or administrative
- No explanation, punctuation, or other text
- When uncertain between two adjacent tiers, choose the higher urgency
- Base your decision only on the text provided — do not infer beyond it
```

**Triage user message:**
```
Reason for visit: {reason}
Additional notes: {notes ?? "None"}
```

### Triage classification
- Runs via Next.js `after()` in `createBooking` — fires after the patient's redirect, zero impact on booking UX
- Four-tier system based on Canadian outpatient clinical literature (no single national standard exists — this aligns with published McMaster/Ontario practice):
  - `urgent` — acute or worsening, may need priority/same-day review
  - `soon` — needs attention within days, not immediately dangerous
  - `routine` — chronic care, stable, next available slot
  - `administrative` — renewals, forms, sick notes, no clinical assessment needed
  - `safety_flag` — emergency language detected (chest pain, can't breathe, suicidal ideation) — blocks booking, redirects to 911/ED. This is a hard-coded keyword gate, NOT AI triage.
- Stored as a nullable pgEnum `triageLevel` on `bookings` — null if AI disabled or classification fails
- Shown as a coloured badge on `BookingRow` in the admin dashboard
- Prompt must return exactly one of the four values — validate response, reject anything else
- AI label is a **suggestion only** — must be clearly marked as such, never presented as clinical determination
- Doctor can override via the status dropdown in the details panel

### Liability
- AI triage is decision support, not decision replacement — physician retains full professional responsibility
- Every AI classification must be visible, overridable, and never shown to the patient as a clinical determination
- Required disclaimer on booking confirmation: "If you believe you are experiencing a medical emergency, call 911 or go to your nearest emergency department."
- Required disclaimer on admin dashboard: "Urgency suggestions are generated automatically from patient-reported reason for visit and have not been reviewed by a clinician."
- Safety flag is a hard-coded non-AI keyword screen — not a medical device

### Environment variables
```
AI_ENABLED=false              # seeds the settings table on first run
OLLAMA_API_KEY=               # Bearer token from ollama.com/settings/keys
OLLAMA_MODEL=gemma4:31b       # verify available models via GET https://ollama.com/v1/models
```

### Ollama client setup
```ts
import { createOpenAI } from "@ai-sdk/openai";

const ollama = createOpenAI({
  baseURL: "https://ollama.com/v1",
  apiKey: process.env.OLLAMA_API_KEY!,
});

const model = ollama(process.env.OLLAMA_MODEL ?? "gemma4:31b");
```

### Schema additions
- `triageLevel` nullable pgEnum on `bookings`: `urgent`, `soon`, `routine`, `administrative`, `safety_flag`
- `settings` table: `id`, `aiEnabled` (boolean, default false)

### Key decisions
- **AI features are fully optional** — the entire app works without them. No `OLLAMA_API_KEY` = AI disabled, no errors, no broken UI. Everything degrades gracefully: null triage level shows no badge.
- `after()` over synchronous classification — patient UX must not be affected by AI latency
- Nullable `triageLevel` — schema never breaks when AI is off or fails
- DB-stored toggle over env var — can be flipped live in the admin panel without redeployment
- Gemma 4 (`gemma4:31b`) via Ollama Cloud — no local dependency, demo-day safe
- Vercel AI SDK — handles streaming boilerplate, OpenAI-compatible so works with Ollama unchanged
- 4-tier triage (not full CTAS) — appropriate for scheduled care, documented as such

---

## Future Improvements (for README)

- Real slot conflict locking via `@neondatabase/serverless` Pool + `SELECT FOR UPDATE` (current code uses single-statement atomic UPDATE on the HTTP driver)
- Patient auth: magic link
- Admin auth: replace env-var password with proper sessions
- Email notifications on booking submission and status change
- Calendar export (.ics) from confirmation page
- Rate limiting on `createBooking` action
- Real-time admin updates: polling was removed after it was found to interfere with `useOptimistic` on the AI toggle — `router.refresh()` firing mid-transition caused the optimistic state to snap back to the stale server value. Production path is Postgres `LISTEN/NOTIFY` with the WebSocket Pool driver + SSE, but Vercel serverless function timeouts kill the persistent connection — requires a long-lived Node.js server or managed pub/sub (Ably, Pusher).
- Physician self-service portal (`/physician`): physicians manage their own slot availability — add ad-hoc slots, block time off. Needs its own auth layer (physician ID + PIN or magic link) scoped so a physician can only modify their own slots. Key constraints: cannot remove a slot with a confirmed booking against it; recurring availability templates ("Mon/Wed 9am–1pm") would be more practical than slot-by-slot management. Data layer (`time_slots.physician_id`, `time_slots.available`) already supports this without schema changes.
- Streaming clinical summary in admin booking details: on-demand AI-generated one-sentence summary of the patient's reason for visit, streamed via Vercel AI SDK `streamText` into the expanded row. Descoped — triage badge already surfaces the actionable signal; the summary is redundant for low-volume clinical use.
