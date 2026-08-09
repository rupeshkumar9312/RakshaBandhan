"use client";

import Image from "next/image";
import Link from "next/link";
import { useActionState, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { createCategory, updateCategory, type AdminActionState } from "@/app/actions/admin";
import { cn } from "@/lib/utils";
import { PlusIcon, TrashIcon, ChevronLeft } from "@/components/icons";

export type CategoryFormValues = {
  id?: string;
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  sortOrder: number;
  isActive: boolean;
};

const BLANK: CategoryFormValues = {
  name: "",
  slug: "",
  description: "",
  imageUrl: "",
  sortOrder: 0,
  isActive: true,
};

function SaveButton({ isEdit }: { isEdit: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn btn-primary">
      {pending ? "Saving…" : isEdit ? "Save changes" : "Create category"}
    </button>
  );
}

export function CategoryForm({ initial }: { initial?: CategoryFormValues }) {
  const isEdit = Boolean(initial?.id);
  const values = initial ?? BLANK;

  const [state, action] = useActionState<AdminActionState, FormData>(
    isEdit ? updateCategory : createCategory,
    null,
  );

  const [imageUrl, setImageUrl] = useState(values.imageUrl);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const errors = state && !state.ok ? state.errors : {};

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError(null);

    const body = new FormData();
    body.append("files", file);

    try {
      const res = await fetch("/api/upload", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      setImageUrl(data.urls[0]);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <form action={action} className="max-w-xl space-y-5">
      {values.id && <input type="hidden" name="id" value={values.id} />}
      <input type="hidden" name="imageUrl" value={imageUrl} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/admin/categories"
          className="inline-flex items-center gap-1 text-sm text-ink-muted hover:text-maroon-700"
        >
          <ChevronLeft className="size-4" /> All categories
        </Link>
        <div className="flex gap-2">
          <Link href="/admin/categories" className="btn btn-ghost btn-sm">
            Cancel
          </Link>
          <SaveButton isEdit={isEdit} />
        </div>
      </div>

      {errors.form && (
        <p className="rounded-xl bg-maroon-50 px-4 py-3 text-sm text-maroon-800">{errors.form}</p>
      )}

      {/* Image */}
      <section className="card p-5">
        <h2 className="font-bold">Banner image</h2>
        <p className="mt-1 text-xs text-ink-muted">
          Shown on the &quot;Browse by style&quot; section of the homepage. JPG, PNG, WebP, AVIF
          or SVG, up to 5 MB.
        </p>

        <div className="mt-4 flex items-start gap-4">
          <div className="relative aspect-4/3 w-40 shrink-0 overflow-hidden rounded-xl border border-cream-300 bg-cream-200">
            {imageUrl ? (
              <>
                <Image src={imageUrl} alt="" fill sizes="160px" className="object-cover" />
                <button
                  type="button"
                  onClick={() => setImageUrl("")}
                  aria-label="Remove image"
                  className="absolute right-1.5 top-1.5 grid size-7 place-items-center rounded-full bg-ink/70 text-cream-50 transition-opacity hover:bg-ink/85"
                >
                  <TrashIcon className="size-3.5" />
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="grid h-full w-full place-items-center text-ink-muted transition-colors hover:text-maroon-700 disabled:opacity-50"
              >
                <span className="flex flex-col items-center gap-1">
                  <PlusIcon className="size-5" />
                  <span className="text-[0.625rem] font-semibold">
                    {uploading ? "Uploading…" : "Upload"}
                  </span>
                </span>
              </button>
            )}
          </div>

          <div className="space-y-2">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="btn btn-outline btn-sm"
            >
              {imageUrl ? "Replace image" : "Choose file"}
            </button>
            {uploadError && <p className="text-xs text-maroon-600">{uploadError}</p>}
          </div>
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif,image/svg+xml"
          onChange={handleFile}
          className="hidden"
        />
      </section>

      {/* Details */}
      <section className="card space-y-4 p-5">
        <h2 className="font-bold">Details</h2>

        <Field
          label="Category name"
          name="name"
          defaultValue={values.name}
          error={errors.name}
          placeholder="Designer Rakhi"
          required
        />

        <div>
          <label htmlFor="description" className="label">
            Description <span className="font-normal text-ink-muted">(optional)</span>
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            defaultValue={values.description}
            placeholder="Hand-finished statement rakhis in kundan, meenakari and pearl work."
            className="field resize-y"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="URL slug"
            name="slug"
            defaultValue={values.slug}
            hint="Leave blank to generate from the name"
          />
          <Field
            label="Sort order"
            name="sortOrder"
            type="number"
            min="0"
            defaultValue={String(values.sortOrder)}
            hint="Lower shows first"
          />
        </div>

        <label className="flex cursor-pointer items-center gap-2.5">
          <input
            type="checkbox"
            name="isActive"
            defaultChecked={values.isActive}
            className="size-4 accent-maroon-700"
          />
          <span className="text-sm">
            <span className="font-semibold">Visible in store</span>
            <span className="block text-xs text-ink-muted">Uncheck to hide it</span>
          </span>
        </label>
      </section>

      <div className="flex justify-end gap-2 border-t border-cream-300 pt-5">
        <Link href="/admin/categories" className="btn btn-ghost">
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
  const id = `c-${name}`;
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