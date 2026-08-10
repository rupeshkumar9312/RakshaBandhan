"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { createSociety, updateSociety, type AdminActionState } from "@/app/actions/admin";
import { cn } from "@/lib/utils";
import { ChevronLeft } from "@/components/icons";

export type SocietyFormValues = {
  id?: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
};

const BLANK: SocietyFormValues = {
  name: "",
  sortOrder: 0,
  isActive: true,
};

function SaveButton({ isEdit }: { isEdit: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn btn-primary">
      {pending ? "Saving…" : isEdit ? "Save changes" : "Create society"}
    </button>
  );
}

export function SocietyForm({ initial }: { initial?: SocietyFormValues }) {
  const isEdit = Boolean(initial?.id);
  const values = initial ?? BLANK;

  const [state, action] = useActionState<AdminActionState, FormData>(
    isEdit ? updateSociety : createSociety,
    null,
  );

  const errors = state && !state.ok ? state.errors : {};

  return (
    <form action={action} className="max-w-xl space-y-5">
      {values.id && <input type="hidden" name="id" value={values.id} />}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/admin/societies"
          className="inline-flex items-center gap-1 text-sm text-ink-muted hover:text-maroon-700"
        >
          <ChevronLeft className="size-4" /> All societies
        </Link>
        <div className="flex gap-2">
          <Link href="/admin/societies" className="btn btn-ghost btn-sm">
            Cancel
          </Link>
          <SaveButton isEdit={isEdit} />
        </div>
      </div>

      {errors.form && (
        <p className="rounded-xl bg-maroon-50 px-4 py-3 text-sm text-maroon-800">{errors.form}</p>
      )}

      <section className="card space-y-4 p-5">
        <h2 className="font-bold">Details</h2>

        <Field
          label="Society name"
          name="name"
          defaultValue={values.name}
          error={errors.name}
          placeholder="The Golden Palms"
          required
        />

        <Field
          label="Sort order"
          name="sortOrder"
          type="number"
          min="0"
          defaultValue={String(values.sortOrder)}
          hint="Lower shows first in the checkout dropdown"
        />

        <label className="flex cursor-pointer items-center gap-2.5">
          <input
            type="checkbox"
            name="isActive"
            defaultChecked={values.isActive}
            className="size-4 accent-maroon-700"
          />
          <span className="text-sm">
            <span className="font-semibold">Available at checkout</span>
            <span className="block text-xs text-ink-muted">
              Uncheck to hide it from the delivery dropdown
            </span>
          </span>
        </label>
      </section>

      <div className="flex justify-end gap-2 border-t border-cream-300 pt-5">
        <Link href="/admin/societies" className="btn btn-ghost">
          Cancel
        </Link>
        <SaveButton isEdit={isEdit} />
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  error,
  hint,
  ...rest
}: {
  label: string;
  name: string;
  error?: string;
  hint?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  const id = `s-${name}`;
  return (
    <div>
      <label htmlFor={id} className="label">
        {label}
      </label>
      <input id={id} name={name} className={cn("field", error && "field-error")} {...rest} />
      {hint && !error && <p className="mt-1 text-xs text-ink-muted">{hint}</p>}
      {error && <p className="mt-1 text-xs text-maroon-600">{error}</p>}
    </div>
  );
}
