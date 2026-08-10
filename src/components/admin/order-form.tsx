"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  createOrder,
  updateOrderItems,
  searchProductsForOrder,
  type AdminActionState,
  type AdminProductSearchResult,
} from "@/app/actions/admin";
import { formatPaise } from "@/lib/money";
import { cn } from "@/lib/utils";
import { SearchIcon, PlusIcon, TrashIcon, MinusIcon, ChevronLeft } from "@/components/icons";

export type OrderFormItem = {
  productId: string;
  name: string;
  price: number;
  inventory: number;
  imageUrl: string | null;
  quantity: number;
  /** Quantity already reserved by this order before editing — the picker's
   * `inventory` is what's left excluding this order, so we show both. */
  reservedByThisOrder?: number;
};

export type OrderFormValues = {
  id?: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  addressLine1: string;
  addressLine2: string;
  tower: string;
  flat: string;
  landmark: string;
  city: string;
  state: string;
  pincode: string;
  customerNote: string;
  adminNote: string;
  items: OrderFormItem[];
};

const BLANK: OrderFormValues = {
  contactName: "",
  contactPhone: "",
  contactEmail: "",
  addressLine1: "",
  addressLine2: "",
  tower: "",
  flat: "",
  landmark: "",
  city: "Noida",
  state: "Uttar Pradesh",
  pincode: "",
  customerNote: "",
  adminNote: "",
  items: [],
};

function SaveButton({ isEdit }: { isEdit: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn btn-primary">
      {pending ? "Saving…" : isEdit ? "Save changes" : "Create order"}
    </button>
  );
}

export function OrderForm({ initial }: { initial?: OrderFormValues }) {
  const router = useRouter();
  const isEdit = Boolean(initial?.id);
  const values0 = initial ?? BLANK;

  const [state, action] = useActionState<AdminActionState, FormData>(
    isEdit ? updateOrderItems : createOrder,
    null,
  );

  const [fields, setFields] = useState(() => {
    const { items: _items, id: _id, ...rest } = values0;
    return rest;
  });
  const [items, setItems] = useState<OrderFormItem[]>(values0.items);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AdminProductSearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  const errors = state && !state.ok ? state.errors : {};

  // On a successful edit, hop back to the order's detail page. Create
  // redirects server-side (createOrder calls redirect() itself).
  useEffect(() => {
    if (isEdit && state?.ok && initial?.id) {
      router.push(`/admin/orders/${initial.id}`);
    }
  }, [state, isEdit, initial?.id, router]);

  // Debounced product search.
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    setSearching(true);
    const t = setTimeout(async () => {
      try {
        const found = await searchProductsForOrder(query);
        setResults(found);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  function set(key: keyof typeof fields) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setFields((f) => ({ ...f, [key]: e.target.value }));
  }

  function addProduct(p: AdminProductSearchResult) {
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === p.id);
      if (existing) {
        return prev.map((i) =>
          i.productId === p.id ? { ...i, quantity: i.quantity + 1 } : i,
        );
      }
      return [
        ...prev,
        {
          productId: p.id,
          name: p.name,
          price: p.price,
          inventory: p.inventory,
          imageUrl: p.imageUrl,
          quantity: 1,
        },
      ];
    });
    setQuery("");
    setResults([]);
  }

  function setQty(productId: string, quantity: number) {
    setItems((prev) =>
      prev.map((i) => (i.productId === productId ? { ...i, quantity: Math.max(1, quantity) } : i)),
    );
  }

  function removeItem(productId: string) {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  }

  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);

  const backHref = isEdit && initial?.id ? `/admin/orders/${initial.id}` : "/admin/orders";

  return (
    <form action={action} className="space-y-5">
      {values0.id && <input type="hidden" name="id" value={values0.id} />}
      <input
        type="hidden"
        name="items"
        value={JSON.stringify(items.map(({ productId, quantity }) => ({ productId, quantity })))}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href={backHref}
          className="inline-flex items-center gap-1 text-sm text-ink-muted hover:text-maroon-700"
        >
          <ChevronLeft className="size-4" /> {isEdit ? "Back to order" : "All orders"}
        </Link>
        <div className="flex gap-2">
          <Link href={backHref} className="btn btn-ghost btn-sm">
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
          {/* Items */}
          <section className="card p-5">
            <h2 className="font-bold">Items</h2>

            <div className="relative mt-3">
              <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-muted" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search products by name or SKU…"
                className="field pl-10"
              />
              {(results.length > 0 || searching) && (
                <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-xl border border-cream-300 bg-white shadow-[var(--shadow-lift)]">
                  {searching ? (
                    <p className="px-4 py-3 text-sm text-ink-muted">Searching…</p>
                  ) : (
                    results.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => addProduct(p)}
                        className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-cream-50"
                      >
                        <div className="relative size-10 shrink-0 overflow-hidden rounded-lg bg-cream-200">
                          {p.imageUrl && (
                            <Image src={p.imageUrl} alt="" fill sizes="40px" className="object-cover" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{p.name}</p>
                          <p className="text-xs text-ink-muted">
                            {formatPaise(p.price)} · {p.inventory} in stock
                            {!p.isActive && (
                              <span className="ml-1.5 chip bg-ink/10 px-1.5 py-0 text-[0.625rem]">
                                Inactive
                              </span>
                            )}
                          </p>
                        </div>
                        <PlusIcon className="size-4 shrink-0 text-maroon-700" />
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {items.length === 0 ? (
              <p className="mt-4 text-sm text-ink-muted">No items added yet.</p>
            ) : (
              <ul className="mt-4 divide-y divide-cream-300">
                {items.map((item) => (
                  <li key={item.productId} className="flex items-center gap-3 py-3">
                    <div className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-cream-200">
                      {item.imageUrl && (
                        <Image src={item.imageUrl} alt="" fill sizes="48px" className="object-cover" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{item.name}</p>
                      <p className="text-xs text-ink-muted">{formatPaise(item.price)} each</p>
                    </div>
                    <div className="flex items-center rounded-full border border-cream-300">
                      <button
                        type="button"
                        onClick={() => setQty(item.productId, item.quantity - 1)}
                        className="grid size-8 place-items-center text-ink-soft hover:bg-cream-100"
                      >
                        <MinusIcon className="size-3.5" />
                      </button>
                      <span className="w-8 text-center text-sm font-semibold tabular-nums">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => setQty(item.productId, item.quantity + 1)}
                        className="grid size-8 place-items-center text-ink-soft hover:bg-cream-100"
                      >
                        <PlusIcon className="size-3.5" />
                      </button>
                    </div>
                    <span className="w-20 shrink-0 text-right text-sm font-semibold tabular-nums">
                      {formatPaise(item.price * item.quantity)}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeItem(item.productId)}
                      aria-label={`Remove ${item.name}`}
                      className="grid size-8 shrink-0 place-items-center rounded-full text-ink-muted hover:bg-maroon-50 hover:text-maroon-700"
                    >
                      <TrashIcon className="size-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {errors.items && <p className="mt-2 text-xs text-maroon-600">{errors.items}</p>}

            {items.length > 0 && (
              <div className="mt-4 flex justify-between border-t border-cream-300 pt-4 text-sm">
                <span className="font-semibold text-ink-muted">Estimated subtotal</span>
                <span className="font-bold tabular-nums text-maroon-800">
                  {formatPaise(subtotal)}
                </span>
              </div>
            )}
            <p className="mt-1 text-xs text-ink-muted">
              Final total (incl. delivery) is calculated when you save.
            </p>
          </section>

          {/* Delivery */}
          <section className="card space-y-4 p-5">
            <h2 className="font-bold">Delivery address</h2>
            <p className="text-xs text-ink-muted">
              Free text — not limited to the societies shown at checkout.
            </p>

            <Field
              label="Address / society"
              name="addressLine1"
              value={fields.addressLine1}
              onChange={set("addressLine1")}
              error={errors.addressLine1}
              placeholder="The Golden Palms"
              required
            />
            <Field
              label="Address line 2"
              optional
              name="addressLine2"
              value={fields.addressLine2}
              onChange={set("addressLine2")}
            />
            <div className="grid grid-cols-2 gap-4">
              <Field
                label="Tower"
                optional
                name="tower"
                value={fields.tower}
                onChange={set("tower")}
              />
              <Field label="Flat no." optional name="flat" value={fields.flat} onChange={set("flat")} />
            </div>
            <Field
              label="Landmark"
              optional
              name="landmark"
              value={fields.landmark}
              onChange={set("landmark")}
            />
            <div className="grid grid-cols-2 gap-4">
              <Field
                label="City"
                name="city"
                value={fields.city}
                onChange={set("city")}
                error={errors.city}
              />
              <Field
                label="PIN code"
                name="pincode"
                value={fields.pincode}
                onChange={set("pincode")}
                error={errors.pincode}
              />
            </div>
            <Field
              label="State"
              name="state"
              value={fields.state}
              onChange={set("state")}
              error={errors.state}
            />

            <div>
              <label htmlFor="customerNote" className="label">
                Delivery instructions <span className="font-normal text-ink-muted">(optional)</span>
              </label>
              <textarea
                id="customerNote"
                name="customerNote"
                rows={2}
                value={fields.customerNote}
                onChange={set("customerNote")}
                className="field resize-y"
              />
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <aside className="space-y-5">
          <section className="card space-y-4 p-5">
            <h2 className="font-bold">Customer</h2>
            <Field
              label="Full name"
              name="contactName"
              value={fields.contactName}
              onChange={set("contactName")}
              error={errors.contactName}
              required
            />
            <Field
              label="Mobile number"
              name="contactPhone"
              value={fields.contactPhone}
              onChange={set("contactPhone")}
              error={errors.contactPhone}
              type="tel"
              inputMode="numeric"
              required
            />
            <Field
              label="Email"
              optional
              name="contactEmail"
              value={fields.contactEmail}
              onChange={set("contactEmail")}
              error={errors.contactEmail}
              type="email"
            />
            {!isEdit && (
              <p className="text-xs text-ink-muted">
                An existing customer with this phone number will be reused automatically.
              </p>
            )}
          </section>

          {!isEdit && (
            <section className="card space-y-4 p-5">
              <h2 className="font-bold">Internal note</h2>
              <p className="text-xs text-ink-muted">Only visible to staff.</p>
              <textarea
                name="adminNote"
                rows={3}
                value={fields.adminNote}
                onChange={set("adminNote")}
                placeholder="Taken over phone, customer requested evening delivery…"
                className="field resize-y text-sm"
              />
            </section>
          )}
          {isEdit && <input type="hidden" name="adminNote" value="" />}
        </aside>
      </div>

      <div className="flex justify-end gap-2 border-t border-cream-300 pt-5">
        <Link href={backHref} className="btn btn-ghost">
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
  optional,
  ...rest
}: {
  label: string;
  name: string;
  error?: string;
  optional?: boolean;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> & {
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  }) {
  const id = `o-${name}`;
  return (
    <div>
      <label htmlFor={id} className="label">
        {label} {optional && <span className="font-normal text-ink-muted">(optional)</span>}
      </label>
      <input id={id} name={name} className={cn("field", error && "field-error")} {...rest} />
      {error && <p className="mt-1 text-xs text-maroon-600">{error}</p>}
    </div>
  );
}
