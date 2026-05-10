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
| ORM | drizzle-orm (to be added) | — |
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

The `middleware.ts` convention is deprecated in v16 in favor of `proxy.ts`. We're not using either in this app, but if auth or rate-limiting is added later, use `proxy.ts` with a named `proxy` export. Note: `proxy` runs on Node.js only — no edge runtime.

---

## File Structure

The structure is **emergent** — do not create directories speculatively. Add files where they make sense as the project grows. The conventions below are guidelines, not a required skeleton.

```
app/
├── layout.tsx              ← root layout, fonts, global nav
├── page.tsx                ← redirect to /book
├── globals.css             ← Tailwind import + @theme tokens
├── book/
│   ├── page.tsx            ← Step 1: physician list
│   └── [physicianId]/
│       ├── page.tsx        ← Step 2: date + time slot picker
│       └── details/
│           └── page.tsx    ← Step 3: patient details form
├── confirmation/
│   └── page.tsx            ← booking confirmed (reference #)
└── admin/
    └── page.tsx            ← booking management dashboard
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
Created by patients. Fields: `id`, `slot_id`, `reference` (nanoid, shown on confirmation), `patient_name`, `dob`, `email`, `phone`, `reason`, `notes`, `status` (`pending` | `confirmed` | `cancelled`), `created_at`.

---

## Server Actions — Conventions

All mutations go through Server Functions in `lib/actions/`. No separate API routes for mutations.

```
lib/
├── db/
│   ├── schema.ts           ← Drizzle table definitions
│   └── index.ts            ← db client (Neon + drizzle)
├── actions/
│   ├── bookings.ts         ← createBooking, updateStatus
│   └── physicians.ts       ← getPhysicians, getAvailableSlots
└── utils.ts                ← date helpers, reference generation
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

`/admin` — single page, server-rendered table of all bookings.

- Filter by status (`pending` / `confirmed` / `cancelled`) via URL search param
- Confirm/cancel inline via Server Actions bound to `<button formAction={...}>`
- Expand row to see full patient detail (Client Component toggle)

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
```

Never commit `.env.local`. Both vars go in Vercel env vars for production.

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
5. UX polish (framer-motion, lenis)
6. README

Pause for sign-off between phases.

---

## Future Improvements (for README)

- Real slot conflict locking via `@neondatabase/serverless` Pool + `SELECT FOR UPDATE` (current code uses single-statement atomic UPDATE on the HTTP driver)
- Patient auth: magic link
- Admin auth: replace env-var password with proper sessions
- Email notifications on booking submission and status change
- Calendar export (.ics) from confirmation page
- Rate limiting on `createBooking` action
- Real-time admin updates: current polling (`router.refresh()` every 10s) is acceptable for low-traffic clinics. Production path is Postgres `LISTEN/NOTIFY` with the WebSocket Pool driver + SSE, but Vercel serverless function timeouts kill the persistent connection — requires a long-lived Node.js server or managed pub/sub (Ably, Pusher)
