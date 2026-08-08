"use client";

import { useRef } from "react";
import { useFormStatus } from "react-dom";
import { createCategory } from "@/app/actions/admin";

function AddButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn btn-primary btn-sm shrink-0">
      {pending ? "Adding…" : "Add category"}
    </button>
  );
}

export function CategoryForm() {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={async (formData: FormData) => {
        await createCategory(formData);
        formRef.current?.reset();
      }}
      className="flex flex-col gap-3 sm:flex-row sm:items-end"
    >
      <div className="flex-1">
        <label htmlFor="name" className="label">
          Name
        </label>
        <input
          id="name"
          name="name"
          required
          minLength={2}
          placeholder="Designer Rakhi"
          className="field"
        />
      </div>
      <div className="flex-1">
        <label htmlFor="description" className="label">
          Description (optional)
        </label>
        <input
          id="description"
          name="description"
          placeholder="Shown on the category banner"
          className="field"
        />
      </div>
      <AddButton />
    </form>
  );
}
