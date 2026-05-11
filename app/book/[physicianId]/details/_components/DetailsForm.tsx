"use client";

import { useActionState, useId, useState } from "react";
import { useFormStatus } from "react-dom";
import type { BookingActionState } from "@/lib/actions/bookings";
import { getSuggestions } from "@/lib/booking-suggestions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-lg bg-brand text-brand-fg font-medium py-3 px-4 hover:bg-brand-hover disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
    >
      {pending ? "Confirming…" : "Confirm booking"}
    </button>
  );
}

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
      </label>
      {children}
      {error && (
        <p role="alert" className="text-sm text-red-500">
          {error}
        </p>
      )}
    </div>
  );
}

const input =
  "rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-colors";

type Props = {
  slotId: string;
  slotLabel: string;
  physicianName: string;
  specialty: string;
  action: (
    prev: BookingActionState,
    data: FormData,
  ) => Promise<BookingActionState>;
};

type Fields = {
  patientName: string;
  dob: string;
  email: string;
  phone: string;
  reason: string;
  notes: string;
};

export default function DetailsForm({
  slotId,
  slotLabel,
  physicianName,
  specialty,
  action,
}: Props) {
  const suggestions = getSuggestions(specialty);
  const [state, formAction] = useActionState<BookingActionState, FormData>(
    action,
    null,
  );
  const fe = state?.error === "validation" ? state.fieldErrors : undefined;
  const uid = useId();
  const id = (name: string) => `${uid}-${name}`;

  const [fields, setFields] = useState<Fields>({
    patientName: "",
    dob: "",
    email: "",
    phone: "",
    reason: "",
    notes: "",
  });

  const set = (name: keyof Fields) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setFields((f) => ({ ...f, [name]: e.target.value }));

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-xl border border-border bg-surface px-4 py-3 text-sm">
        <p className="text-muted">Appointment</p>
        <p className="font-medium text-foreground mt-0.5">
          {physicianName} · {slotLabel}
        </p>
      </div>

      <form action={formAction} className="flex flex-col gap-5" noValidate>
        <input type="hidden" name="slotId" value={slotId} />

        {state?.error === "slot-taken" && (
          <div
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            That slot was just taken. Please go back and choose another time.
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Field id={id("name")} label="Full name" error={fe?.patientName?.[0]}>
            <input
              id={id("name")}
              name="patientName"
              type="text"
              placeholder="Jane Smith"
              autoComplete="name"
              value={fields.patientName}
              onChange={set("patientName")}
              className={input}
            />
          </Field>

          <Field id={id("dob")} label="Date of birth" error={fe?.dob?.[0]}>
            <input
              id={id("dob")}
              name="dob"
              type="date"
              value={fields.dob}
              onChange={set("dob")}
              className={input}
            />
          </Field>

          <Field id={id("email")} label="Email" error={fe?.email?.[0]}>
            <input
              id={id("email")}
              name="email"
              type="email"
              placeholder="jane@example.com"
              autoComplete="email"
              value={fields.email}
              onChange={set("email")}
              className={input}
            />
          </Field>

          <Field id={id("phone")} label="Phone" error={fe?.phone?.[0]}>
            <input
              id={id("phone")}
              name="phone"
              type="tel"
              placeholder="+1 (416) 555-0100"
              autoComplete="tel"
              value={fields.phone}
              onChange={set("phone")}
              className={input}
            />
          </Field>
        </div>

        <Field
          id={id("reason")}
          label="Reason for visit"
          error={fe?.reason?.[0]}
        >
          {suggestions.length > 0 && fields.reason === "" && (
            <div className="flex flex-wrap gap-1.5">
              {suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setFields((f) => ({ ...f, reason: s }))}
                  className="text-xs px-2.5 py-1 rounded-full border border-border bg-surface text-muted hover:border-brand hover:text-foreground transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
          <input
            id={id("reason")}
            name="reason"
            type="text"
            placeholder="Brief description of your concern"
            value={fields.reason}
            onChange={set("reason")}
            className={input}
          />
        </Field>

        <Field id={id("notes")} label="Additional notes (optional)">
          <textarea
            id={id("notes")}
            name="notes"
            rows={3}
            placeholder="Any relevant medical history or context for your physician"
            value={fields.notes}
            onChange={set("notes")}
            className={`${input} resize-none`}
          />
        </Field>

        <SubmitButton />
      </form>
    </div>
  );
}
