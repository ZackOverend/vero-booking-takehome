"use client";

import { useActionState } from "react";
import { login } from "@/lib/actions/auth";

export default function LoginPage() {
  const [state, formAction] = useActionState(login, null);

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-semibold text-foreground mb-1">Admin</h1>
        <p className="text-muted text-sm mb-8">Sign in to manage bookings.</p>

        <form action={formAction} className="flex flex-col gap-4">
          {state?.error && (
            <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              Incorrect password.
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-sm font-medium text-foreground">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              autoFocus
              required
              className="rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-colors"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-lg bg-brand text-brand-fg font-medium py-3 px-4 hover:bg-brand-hover transition-colors"
          >
            Sign in
          </button>
        </form>
      </div>
    </div>
  );
}
