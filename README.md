# Vero Booking

A patient booking flow and admin dashboard built for the Vero take-home exercise.

Live: [projects.verobooking.zackoverend.com](https://projects.verobooking.zackoverend.com)  
Admin password for the hosted instance is `admin`. Can be changed via `ADMIN_PASSWORD` in `.env.local`.

---

## Setup

**Requirements:** Node 20+, Neon Postgres, Ollama API key (optional).

```bash
git clone https://github.com/zackaryoverend/vero-booking-takehome
cd vero-booking-takehome
npm install
cp .env.local.example .env.local
```

Fill in `.env.local`, then:

```bash
npm run db:push   # dev only, pushes schema directly with no migration files
npm run db:seed
npm run dev
```

`db:push` is fine for local iteration but leaves no audit trail. Production would use `db:migrate` to apply committed SQL migration files in order.

Open [http://localhost:3000](http://localhost:3000).

---

## What I Built

#### Patient Portal
Three steps: Choose a physician -> Pick a time slot -> Fill in your details.
<img width="980" height="114" alt="Image" src="https://github.com/user-attachments/assets/ef7e7ffc-22b7-4cc3-a37b-928c1989c29b" />

Slots are claimed atomically on submit. If a slot is taken between selecting it and submitting, the patient gets a clear message and is sent back to pick another time.

<img width="1772" height="764" alt="Image" src="https://github.com/user-attachments/assets/18c91fff-a4a4-4598-9702-a2a7a9ad8463" />

#### Admin Dashboard
The dashboard shows all bookings with inline confirm and cancel buttons. Rows can be clicked to expand to show full patient detail. Filters by status and physician are in the URL so views are shareable.

On mobile browsers, filters collapse into a floating bar at the bottom of the screen.

#### Lightweight DB Integration
Database is built around four tables.

`physicians` is seeded and read-only.

`time_slots` holds one row per 30-minute window per physician, with a boolean that flips to false when a booking is made against it.

`bookings` joins to a slot and stores the patient details, status, and triage level.

`settings` is a single-row table that holds the AI toggle so it persists across deploys. Physicians and slots are read with a cache, bookings and settings are always fresh.

### AI Triage

This optional feature classifies the patient's reason for visit in the background after a booking is submitted. It assigns one of four urgency levels: urgent, soon, routine, or administrative.

The clinician sees a colour-coded icon indicator on each row and can filter by triage level from the sidebar. The feature is off by default and can be toggled live from the admin panel. While the triage feature is off, no patient details whatsoever are sent to the Gemma 4 model to ensure full privacy of patient information.

Emergency language (chest pain, suicidal ideation, overdose, etc.) is caught by a hard-coded keyword check before any AI is involved. This is intentional, as safety checks should be fast and deterministic, not model-dependent.

The four-tier scale was designed against Canadian clinical literature. I couldn't find a national standard for outpatient triage. Different Ontario sources like McMaster, CPSO, and Ontario Health each use different terminology. I settled on a mixed 4-tier system that is relatively separated from the system and can be modified by editing the system prompt and is completely independent of the booking flow.

<details>
<summary>System Prompt Used</summary>

<img width="2048" height="1594" alt="Image" src="https://github.com/user-attachments/assets/94709623-ca24-4bbd-b8c7-829e472fe81f" />

</details>

All AI classifications are decision support only, not clinical determinations. The physician retains full professional accountability and can override the triage level at any time from the booking detail panel.

---

## Challenges

##### `cacheComponents: true` and Suspense Boundaries
This one caused some headaches. Introduced just last year, Next.js 16's [new caching model](https://nextjs.org/docs/app/getting-started/caching) sends the page shell to the browser immediately and fills in the dynamic content as it loads. This caused unexpected errors until I restructured every dynamic page to separate the static wrapper from the data-fetching content with [Suspense](https://nextjs.org/docs/app/api-reference/file-conventions/loading). The upside is every page got a loading skeleton for free.

##### AI Toggle Snap-Back
The AI triage toggle uses `useOptimistic` so it responds instantly without waiting for the server. The tricky part is that `useOptimistic` always reverts to the server-provided value when a transition ends. If you call `router.refresh()` to sync the rest of the page, the refresh completes after the transition, briefly showing the old state before snapping to the new one. The fix was to use `revalidatePath` inside the server action instead, which triggers a server re-render with the updated value and closes the loop cleanly.

##### Admin Auth via `proxy.ts`
Next.js 16 introduces [`proxy.ts`](https://nextjs.org/docs/app/getting-started/proxy) as a replacement for `middleware.ts`. It works the same way, intercepting requests before they reach a page, but runs on Node.js instead of the edge runtime. For the admin gate this matters because the password check uses `crypto.timingSafeEqual`, a constant-time string comparison that prevents timing attacks where an attacker infers the correct password by measuring how long the comparison takes. That API is Node.js only, so the switch from middleware to proxy was necessary to use it safely.

---

## Key Architectural Decisions

##### Slot Conflict Handling
Uses a single `UPDATE ... WHERE available = true RETURNING id` since the Neon HTTP driver doesn't support transactions. If nothing comes back, the slot was already taken. One round trip, atomic at the row level.

##### AI Runs **After** the Response
Via Next.js `after()`, which fires after the patient has already been redirected to the confirmation page. AI latency has zero impact on the booking flow.

##### DB Toggle Over Env Var
Keeps the AI toggle in the database so it can be flipped live without a redeploy. The local env var only seeds the initial value. The toggle also serves a privacy function: enabling it means patient-reported symptoms are sent to an external model, and that should be a deliberate choice the physician makes, not something that happens by default. Disabling it keeps all patient data local.

##### Zod for Validation
All form data is validated server-side with Zod before anything touches the database. The schema is defined once and doubles as the TypeScript type, so there's no risk of the validation logic and the type drifting out of sync. Field errors are returned directly from the schema's `flatten()` output and surfaced inline in the form without any manual error mapping.

##### No API Routes
All mutations go through `'use server'` functions. Server Functions hook into the native HTML `action` attribute, so forms POST directly to the server without JavaScript. For a clinical tool where a failed booking could mean a patient doesn't get seen, this ensures reliability.

---

## What I'd Improve

##### Slot Locking
The current approach uses a single atomic `UPDATE` which works correctly in practice, but doesn't give you the ability to read the slot and lock it in the same operation. Proper `SELECT FOR UPDATE` inside a real transaction would require switching to the Neon WebSocket driver, which seemed outside the scope of a weekend project.

##### Auth
The admin gate stores the plaintext password in a cookie, which is intentionally minimal to avoid spending time on authentication features. Production would replace this with signed session tokens and proper role-based access. Patients would get magic-link auth so they can view and manage their own bookings after submission.

##### Email Notifications
The confirmation page shows a reference number but nothing is sent to the patient. Sending a confirmation email on booking and a status-change email when the admin confirms or cancels would be the natural next step.

##### Real-Time Admin Updates
The dashboard requires a manual refresh to see new bookings. The production path is Postgres `LISTEN/NOTIFY` with the WebSocket driver and SSE, but Vercel serverless function timeouts kill persistent connections. This would need a long-lived Node.js server or something similar.

##### Rate Limiting
Nothing currently stops someone from exhausting all available slots by submitting bookings in bulk. Adding rate limiting on the `createBooking` action would likely be a straightforward fix on Vercel.

##### Unit Tests
`isSafetyFlag` in particular should have deterministic test coverage across every keyword and edge case. It is the one function in this codebase where a missed case has a direct patient safety implication.

---

## Stack

| | | |
|---|---|---|
| Framework | Next.js 16.2.6 | Server Functions, streaming, and the new caching model are a natural fit for a data-heavy booking flow |
| Runtime | React 19 | `useOptimistic` and `useActionState` remove the need for external state management |
| Database | Neon Postgres | Serverless HTTP driver pairs well with Vercel, no connection pooling config needed |
| ORM | Drizzle | Lightweight, type-safe, and works directly with Neon's HTTP driver without a connection proxy |
| Validation | Zod v4 | Schema defined once, used for both server-side validation and TypeScript type inference |
| AI | Vercel AI SDK + Gemma 4 via Ollama Cloud | OpenAI-compatible endpoint means no custom client, Gemma 4 is capable enough for classification without being overkill |
| Styling | Tailwind CSS v4 | CSS-first config with `@theme` fits the design token approach, no separate config file |
| Deploy | Vercel | Zero-config for Next.js, `after()` and server functions work out of the box |
