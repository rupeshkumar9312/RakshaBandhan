"use client";

import Image from "next/image";
import Link from "next/link";
import { useActionState, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { createProduct, updateProduct, type AdminActionState } from "@/app/actions/admin";
import { paiseToRupees } from "@/lib/money";
import { cn } from "@/lib/utils";
import { PlusIcon, TrashIcon, ChevronLeft } from "@/components/icons";

type Category = { id: string; name: string };

export type ProductFormValues = {
  id?: string;
  name: string;
  slug: string;
  description: string;
  shortDesc: string;
  price: number;
  compareAtPrice: number | null;
  sku: string;
  inventory: number;
  categoryId: string;
  tags: string;
  material: string;
  isActive: boolean;
  isFeatured: boolean;
  images: string[];
};

const BLANK: ProductFormValues = {
  name: "",
  slug: "",
  description: "",
  shortDesc: "",
  price: 0,
  compareAtPrice: null,
  sku: "",
  inventory: 0,
  categoryId: "",
  tags: "",
  material: "",
  isActive: true,
  isFeatured: false,
  images: [],
};

function SaveButton({ isEdit }: { isEdit: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn btn-primary">
      {pending ? "Saving…" : isEdit ? "Save changes" : "Create product"}
    </button>
  );
}

export function ProductForm({
  categories,
  initial,
}: {
  categories: Category[];
  initial?: ProductFormValues;
}) {
  const isEdit = Boolean(initial?.id);
  const values = initial ?? { ...BLANK, categoryId: categories[0]?.id ?? "" };

  const [state, action] = useActionState<AdminActionState, FormData>(
    isEdit ? updateProduct : createProduct,
    null,
  );

  const [images, setImages] = useState<string[]>(values.images);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const errors = state && !state.ok ? state.errors : {};

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setUploadError(null);

    const body = new FormData();
    Array.from(files).forEach((f) => body.append("files", f));

    try {
      const res = await fetch("/api/upload", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      setImages((prev) => [...prev, ...data.urls]);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function addByUrl() {
    const url = window.prompt("Image URL (e.g. /placeholders/rakhi-01.svg)");
    if (url?.trim()) setImages((prev) => [...prev, url.trim()]);
  }

  return (
    <form action={action} className="space-y-5">
      {values.id && <input type="hidden" name="id" value={values.id} />}
      {images.map((url) => (
        <input key={url} type="hidden" name="images" value={url} />
      ))}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/admin/products"
          className="inline-flex items-center gap-1 text-sm text-ink-muted hover:text-maroon-700"
        >
          <ChevronLeft className="size-4" /> All products
        </Link>
        <div className="flex gap-2">
          <Link href="/admin/products" className="btn btn-ghost btn-sm">
            Cancel
          </Link>
          <SaveButton isEdit={isEdit} />
        </div>
      </div>

      {errors.form && (
        <p className="rounded-xl bg-maroon-50 px-4 py-3 text-sm text-maroon-800">{errors.form}</p>
      )}

      <div className="grid gap-5 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-5">
          <section className="card space-y-4 p-5">
            <h2 className="font-bold">Basics</h2>

            <Field
              label="Product name"
              name="name"
              defaultValue={values.name}
              error={errors.name}
              placeholder="Kundan Royale Rakhi"
              required
            />

            <div>
              <label htmlFor="shortDesc" className="label">
                Short description{" "}
                <span className="font-normal text-ink-muted">(shown on cards)</span>
              </label>
              <input
                id="shortDesc"
                name="shortDesc"
                defaultValue={values.shortDesc}
                placeholder="Uncut kundan stones set in a gold-plated brass frame."
                className="field"
              />
            </div>

            <div>
              <label htmlFor="description" className="label">
                Full description
              </label>
              <textarea
                id="description"
                name="description"
                rows={6}
                defaultValue={values.description}
                required
                placeholder="Describe the materials, the craft, what makes it worth buying…"
                className={cn("field resize-y", errors.description && "field-error")}
              />
              {errors.description && (
                <p className="mt-1 text-xs text-maroon-600">{errors.description}</p>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Material"
                name="material"
                defaultValue={values.material}
                placeholder="Gold-plated brass, kundan, silk"
              />
              <Field
                label="Tags"
                name="tags"
                defaultValue={values.tags}
                placeholder="kundan, premium, bestseller"
                hint="Comma separated"
              />
            </div>
          </section>

          {/* Images */}
          <section className="card p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-bold">Images</h2>
              <span className="text-xs text-ink-muted">{images.length} added</span>
            </div>
            <p className="mt-1 text-xs text-ink-muted">
              First image is the one shown on cards. JPG, PNG, WebP, AVIF or SVG, up to 5 MB each.
            </p>

            <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4">
              {images.map((url, i) => (
                <div
                  key={`${url}-${i}`}
                  className="group relative aspect-square overflow-hidden rounded-xl border border-cream-300 bg-cream-200"
                >
                  <Image src={url} alt="" fill sizes="120px" className="object-cover" />
                  {i === 0 && (
                    <span className="absolute left-1.5 top-1.5 chip bg-maroon-700 px-2 py-0.5 text-[0.625rem] text-cream-50">
                      Main
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => setImages((prev) => prev.filter((_, n) => n !== i))}
                    aria-label="Remove image"
                    className="absolute right-1.5 top-1.5 grid size-7 place-items-center rounded-full bg-ink/70 text-cream-50 opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    <TrashIcon className="size-3.5" />
                  </button>
                </div>
              ))}

              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="grid aspect-square place-items-center rounded-xl border-2 border-dashed border-cream-300 text-ink-muted transition-colors hover:border-maroon-300 hover:text-maroon-700 disabled:opacity-50"
              >
                <span className="flex flex-col items-center gap-1">
                  <PlusIcon className="size-5" />
                  <span className="text-[0.625rem] font-semibold">
                    {uploading ? "Uploading…" : "Upload"}
                  </span>
                </span>
              </button>
            </div>

            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif,image/svg+xml"
              multiple
              onChange={handleFiles}
              className="hidden"
            />

            <button
              type="button"
              onClick={addByUrl}
              className="mt-3 text-xs font-semibold text-maroon-700 hover:underline"
            >
              or add by URL
            </button>

            {uploadError && <p className="mt-2 text-xs text-maroon-600">{uploadError}</p>}
          </section>
        </div>

        {/* Sidebar */}
        <aside className="space-y-5">
          <section className="card space-y-4 p-5">
            <h2 className="font-bold">Pricing</h2>

            <Field
              label="Price (₹)"
              name="price"
              type="number"
              step="0.01"
              min="1"
              defaultValue={values.price ? String(paiseToRupees(values.price)) : ""}
              error={errors.price}
              required
            />
            <Field
              label="Compare-at price (₹)"
              name="compareAtPrice"
              type="number"
              step="0.01"
              min="0"
              defaultValue={
                values.compareAtPrice ? String(paiseToRupees(values.compareAtPrice)) : ""
              }
              hint="Shown struck through. Leave blank for no discount."
            />
          </section>

          <section className="card space-y-4 p-5">
            <h2 className="font-bold">Inventory</h2>

            <Field
              label="Stock quantity"
              name="inventory"
              type="number"
              min="0"
              defaultValue={String(values.inventory)}
              error={errors.inventory}
              required
            />
            <Field label="SKU" name="sku" defaultValue={values.sku} placeholder="RB-DES-001" />
          </section>

          <section className="card space-y-4 p-5">
            <h2 className="font-bold">Organisation</h2>

            <div>
              <label htmlFor="categoryId" className="label">
                Category
              </label>
              <select
                id="categoryId"
                name="categoryId"
                defaultValue={values.categoryId}
                required
                className={cn("field", errors.categoryId && "field-error")}
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {errors.categoryId && (
                <p className="mt-1 text-xs text-maroon-600">{errors.categoryId}</p>
              )}
            </div>

            <Field
              label="URL slug"
              name="slug"
              defaultValue={values.slug}
              hint="Leave blank to generate from the name"
            />

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

            <label className="flex cursor-pointer items-center gap-2.5">
              <input
                type="checkbox"
                name="isFeatured"
                defaultChecked={values.isFeatured}
                className="size-4 accent-maroon-700"
              />
              <span className="text-sm">
                <span className="font-semibold">Featured</span>
                <span className="block text-xs text-ink-muted">Shows on the homepage</span>
              </span>
            </label>
          </section>
        </aside>
      </div>

      <div className="flex justify-end gap-2 border-t border-cream-300 pt-5">
        <Link href="/admin/products" className="btn btn-ghost">
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
  const id = `p-${name}`;
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
