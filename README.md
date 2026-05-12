# Booking Platform
A patient booking flow and admin dashboard with AI-powered triage, built with Next.js 16, Neon Postgres, and Gemma 4.

<table>
<tr>
<td width="70%">
  <a href="https://projects.verobooking.zackoverend.com/admin">
    <img width="2652" height="1266" alt="Admin dashboard with AI triage" src="https://github.com/user-attachments/assets/b0b30880-2c53-40a7-9311-0ea6883abda5" />
  </a>
</td>
<td width="30%">
  <a href="https://projects.verobooking.zackoverend.com">
    <img width="1857" height="3096" alt="Patient booking flow on mobile" src="https://github.com/user-attachments/assets/6ea434f2-2107-4d68-9d6c-8eb5b86254fa" />
  </a>
</td>
</tr>
</table>

**Live:** [Patient booking](https://projects.verobooking.zackoverend.com/book) · [Admin dashboard](https://projects.verobooking.zackoverend.com/admin) · Admin password: `admin`

---

## Setup

```bash
git clone https://github.com/zackaryoverend/vero-booking-takehome
cd vero-booking-takehome
npm install
cp .env.local.example .env.local
# fill in .env.local
npm run db:push && npm run db:seed && npm run dev
```

Requires Node 20+, Neon Postgres, and an Ollama API key (optional, for AI triage).

---

## What I Built

#### Patient Flow
Three steps: choose a physician, pick a time slot, fill in details. Slots are claimed atomically on submit; if a slot is taken mid-flow the patient is redirected back with a clear message.

<img width="2652" height="1750" alt="Image" src="https://github.com/user-attachments/assets/c5433151-0cb3-400b-913d-63f8f9084f71" />

#### Admin Dashboard with Filters
Inline confirm/cancel, expandable rows with full patient detail, filters by status and physician persisted in the URL. On mobile, filters collapse into a floating bottom bar.

<img width="2652" height="1750" alt="Image" src="https://github.com/user-attachments/assets/63a7f850-ff5d-4065-8702-0b26a61c1511" />

#### AI Triage (Optional)
Classifies each booking into urgent/soon/routine/administrative in the background via Gemma 4 after the patient is redirected, so AI latency never affects the booking flow. Off by default; no patient data is sent to the model until a physician explicitly enables it. Emergency language (chest pain, suicidal ideation, etc.) is caught by a deterministic keyword check before any AI is involved, as safety checks should be fast and deterministic, not model-dependent.

<img width="2652" height="1266" alt="Image" src="https://github.com/user-attachments/assets/0b4a7600-3058-47e9-a87e-b5070a68063e" />

---

## Key Decisions

#### Atomic Slot Conflict
Uses a single `UPDATE ... WHERE available = true RETURNING id` since the Neon HTTP driver doesn't support transactions. If nothing comes back, the slot was already taken. One round trip, atomic at the row level.

#### AI Toggle in Admin
Lets a physician flip it live without a redeploy. Also makes the privacy implication explicit: sending patient symptoms to an external model should be a deliberate choice, not a deployment default.

#### Admin Auth via `proxy.ts`
Next.js 16 replaces `middleware.ts` with `proxy.ts` running on Node.js. Used `crypto.timingSafeEqual` for the password check, which prevents timing attacks and requires the Node runtime.

#### No API Routes
All mutations are Server Actions bound to native HTML `action` attributes. Forms work without JavaScript, which matters for reliability in a clinical context.

---

## What I'd Improve

- Proper `SELECT FOR UPDATE` slot locking once the WebSocket driver supports transactions
- Signed session tokens and magic-link auth for patients
- Email notifications on booking and status change
- Rate limiting on `createBooking` to prevent slot exhaustion
- Unit tests for `isSafetyFlag`, the one function where a missed case has a patient safety implication

---

## Stack

| | | |
|---|---|---|
| Framework | Next.js 16.2.6 | Server Actions, streaming, and `after()` for non-blocking AI |
| Database | Neon Postgres | Serverless HTTP driver, zero connection config on Vercel |
| ORM | Drizzle | Lightweight, type-safe, native Neon HTTP support |
| Validation | Zod v4 | Schema doubles as TypeScript type, field errors via `flatten()` |
| AI | Vercel AI SDK + Gemma 4 (Ollama) | OpenAI-compatible endpoint, capable enough for classification |
| Styling | Tailwind CSS v4 | CSS-first `@theme` config |
