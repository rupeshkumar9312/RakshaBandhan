"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { useSearchParams } from "next/navigation";
import { loginAction, type AdminActionState } from "@/app/actions/admin";
import { cn } from "@/lib/utils";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn btn-primary w-full py-3.5">
      {pending ? "Signing in…" : "Sign in"}
    </button>
  );
}

export function LoginForm() {
  const [state, action] = useActionState<AdminActionState, FormData>(loginAction, null);
  const params = useSearchParams();
  const next = params.get("next") ?? "/admin";

  const errors = state && !state.ok ? state.errors : {};

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next} />

      <div>
        <label htmlFor="email" className="label">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="username"
          placeholder="admin@rakhibazaar.in"
          className={cn("field", errors.email && "field-error")}
        />
        {errors.email && <p className="mt-1 text-xs text-maroon-600">{errors.email}</p>}
      </div>

      <div>
        <label htmlFor="password" className="label">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          placeholder="••••••••"
          className={cn("field", errors.password && "field-error")}
        />
        {errors.password && <p className="mt-1 text-xs text-maroon-600">{errors.password}</p>}
      </div>

      {errors.form && (
        <p className="rounded-lg bg-maroon-50 px-3 py-2.5 text-sm text-maroon-800">{errors.form}</p>
      )}

      <SubmitButton />
    </form>
  );
}
