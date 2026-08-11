"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { useCart } from "@/components/cart-provider";
import { placeOrder, type ActionState } from "@/app/actions/shop";
import { formatPaise } from "@/lib/money";
import { estimatedDelivery, cn } from "@/lib/utils";
import {
  CashIcon,
  CheckIcon,
  ChevronLeft,
  ChevronDown,
  CartIcon,
  CloseIcon,
} from "@/components/icons";

const STEPS = ["Contact", "Delivery", "Review"] as const;

/** Which step owns each field, so a server error can be shown where it's fixable. */
const FIELD_STEP: Record<string, number> = {
  contactName: 0,
  contactPhone: 0,
  contactEmail: 0,
  addressLine1: 1,
  addressLine2: 1,
  flat: 1,
  landmark: 1,
  city: 1,
  state: 1,
  pincode: 1,
  customerNote: 1,
};

type Values = {
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  addressLine1: string;
  flat: string;
  addressLine2: string;
  landmark: string;
  city: string;
  state: string;
  pincode: string;
  customerNote: string;
};

const EMPTY: Values = {
  contactName: "",
  contactPhone: "",
  contactEmail: "",
  addressLine1: "",
  flat: "",
  addressLine2: "",
  landmark: "",
  city: "Noida",
  state: "Uttar Pradesh",
  pincode: "201301",
  customerNote: "",
};

const DRAFT_KEY = "rb_checkout_draft";

function PlaceOrderButton({ total }: { total: number }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="btn btn-primary w-full py-4 text-base"
    >
      {pending ? "Placing your order…" : `Place order · ${formatPaise(total)}`}
    </button>
  );
}

export function CheckoutForm({ societies }: { societies: { id: string; name: string }[] }) {
  const router = useRouter();
  const { lines, hydrated, subtotal, shipping, total, clear } = useCart();
  const [state, action] = useActionState<ActionState, FormData>(
    placeOrder,
    null,
  );
  const [step, setStep] = useState(0);
  const [values, setValues] = useState<Values>(EMPTY);
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});
  const [showUnserviceable, setShowUnserviceable] = useState(false);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const addressWrapRef = useRef<HTMLDivElement>(null);

  // Restore a half-finished address so a refresh doesn't cost the sale.
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(DRAFT_KEY);
      if (raw) setValues((v) => ({ ...v, ...JSON.parse(raw) }));
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    try {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(values));
    } catch {
      /* ignore */
    }
  }, [values]);

  // On success: empty the cart and move to the confirmation page. The ref makes
  // this strictly one-shot — redirecting twice would re-enter the loop.
  const redirected = useRef(false);
  useEffect(() => {
    if (state?.ok && state.publicToken && !redirected.current) {
      redirected.current = true;
      clear();
      try {
        sessionStorage.removeItem(DRAFT_KEY);
      } catch {
        /* ignore */
      }
      router.push(`/order/${state.publicToken}`);
    }
  }, [state, clear, router]);

  // Address didn't match a serviceable society — the cart stays intact so the
  // customer can pick a real one instead of losing their selection.
  useEffect(() => {
    if (state?.ok && state.unserviceable) setShowUnserviceable(true);
  }, [state]);

  const serverErrors = state && !state.ok ? state.errors : {};
  const errors = { ...serverErrors, ...localErrors };

  // A rejected submit can name a field from an earlier step. Without this the
  // message renders on a step the user can't see and the order silently stalls.
  useEffect(() => {
    if (!state || state.ok) return;
    const steps = Object.keys(state.errors)
      .map((key) => FIELD_STEP[key])
      .filter((s): s is number => s != null);
    if (steps.length > 0) setStep(Math.min(...steps));
  }, [state]);

  const set =
    (key: keyof Values) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      setValues((v) => ({ ...v, [key]: e.target.value }));
      setLocalErrors((p) => {
        if (!p[key]) return p;
        const next = { ...p };
        delete next[key];
        return next;
      });
    };

  // Custom society combobox — a native <datalist> popup can't be restyled,
  // so suggestions are rendered as our own dropdown to match the theme.
  useEffect(() => {
    function onDocMouseDown(e: MouseEvent) {
      if (addressWrapRef.current && !addressWrapRef.current.contains(e.target as Node)) {
        setSuggestOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, []);

  const filteredSocieties = societies
    .filter((s) => s.name.toLowerCase().includes(values.addressLine1.trim().toLowerCase()))
    .slice(0, 8);

  function selectSociety(name: string) {
    setValues((v) => ({ ...v, addressLine1: name }));
    setLocalErrors((p) => {
      if (!p.addressLine1) return p;
      const next = { ...p };
      delete next.addressLine1;
      return next;
    });
    setSuggestOpen(false);
  }

  function onAddressKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!suggestOpen) {
      if (e.key === "ArrowDown") setSuggestOpen(true);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, filteredSocieties.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      if (filteredSocieties[highlight]) {
        e.preventDefault();
        selectSociety(filteredSocieties[highlight].name);
      }
    } else if (e.key === "Escape") {
      setSuggestOpen(false);
    }
  }

  function validateStep(index: number): boolean {
    const next: Record<string, string> = {};

    if (index === 0) {
      if (values.contactName.trim().length < 2)
        next.contactName = "Please enter your name";
      const phone = values.contactPhone.replace(/\D/g, "").slice(-10);
      if (!/^[6-9]\d{9}$/.test(phone))
        next.contactPhone = "Enter a valid 10-digit mobile number";
      if (values.contactEmail && !/^\S+@\S+\.\S+$/.test(values.contactEmail))
        next.contactEmail = "Enter a valid email";
    }

    if (index === 1) {
      if (values.addressLine1.trim().length < 2)
        next.addressLine1 = "Please select your society";
      if (!/^[1-9]\d{5}$/.test(values.pincode.trim()))
        next.pincode = "Enter a valid 6-digit PIN";
      if (values.city.trim().length < 2) next.city = "Enter your city";
    }

    setLocalErrors(next);
    return Object.keys(next).length === 0;
  }

  if (!hydrated) {
    return <div className="skeleton h-96 rounded-xl2" />;
  }

  if (lines.length === 0 && !state?.ok) {
    return (
      <div className="flex flex-col items-center gap-5 py-20 text-center">
        <div className="grid size-20 place-items-center rounded-full bg-cream-200">
          <CartIcon className="size-9 text-ink-muted" />
        </div>
        <div>
          <h2 className="font-display text-2xl font-bold">
            Nothing to check out
          </h2>
          <p className="mt-2 text-sm text-ink-muted">
            Add a rakhi to your cart first.
          </p>
        </div>
        <Link href="/products" className="btn btn-primary">
          Browse rakhis
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_21rem] lg:gap-12">
      <div>
        {/* Progress */}
        <ol className="mb-8 flex items-center gap-1.5">
          {STEPS.map((label, i) => (
            <li key={label} className="flex flex-1 items-center gap-1.5">
              <button
                type="button"
                onClick={() => i < step && setStep(i)}
                disabled={i > step}
                className={cn(
                  "flex items-center gap-2 text-left",
                  i < step && "cursor-pointer",
                  i > step && "cursor-default",
                )}
              >
                <span
                  className={cn(
                    "grid size-8 shrink-0 place-items-center rounded-full text-xs font-bold transition-colors",
                    i < step
                      ? "bg-emerald-600 text-white"
                      : i === step
                        ? "bg-maroon-700 text-cream-50"
                        : "bg-cream-200 text-ink-muted",
                  )}
                >
                  {i < step ? <CheckIcon className="size-4" /> : i + 1}
                </span>
                <span
                  className={cn(
                    "hidden text-sm font-semibold sm:block",
                    i === step ? "text-ink" : "text-ink-muted",
                  )}
                >
                  {label}
                </span>
              </button>
              {i < STEPS.length - 1 && (
                <span
                  className={cn(
                    "h-0.5 flex-1 rounded-full transition-colors",
                    i < step ? "bg-emerald-600" : "bg-cream-300",
                  )}
                />
              )}
            </li>
          ))}
        </ol>

        <form action={action}>
          {/* Everything is submitted at the end, so keep hidden inputs mounted. */}
          <input
            type="hidden"
            name="items"
            value={JSON.stringify(
              lines.map((l) => ({
                productId: l.productId,
                quantity: l.quantity,
              })),
            )}
          />
          {(Object.keys(values) as (keyof Values)[]).map((k) => (
            <input key={k} type="hidden" name={k} value={values[k]} />
          ))}

          {/* ── Step 1: contact ── */}
          {step === 0 && (
            <section className="card p-6">
              <h2 className="text-lg font-bold">Who is this for?</h2>
              <p className="mt-1 text-sm text-ink-muted">
                We&apos;ll call this number when the delivery reaches your
                tower.
              </p>

              <div className="mt-6 space-y-4">
                <Field
                  label="Full name"
                  name="contactName"
                  value={values.contactName}
                  onChange={set("contactName")}
                  error={errors.contactName}
                  placeholder="Priya Sharma"
                  autoComplete="name"
                />
                <Field
                  label="Mobile number"
                  name="contactPhone"
                  value={values.contactPhone}
                  onChange={set("contactPhone")}
                  error={errors.contactPhone}
                  placeholder="75990 31402"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel"
                  prefix="+91"
                />
                <Field
                  label="Email"
                  optional
                  name="contactEmail"
                  value={values.contactEmail}
                  onChange={set("contactEmail")}
                  error={errors.contactEmail}
                  placeholder="priya@example.com"
                  type="email"
                  autoComplete="email"
                />
              </div>

              <button
                type="button"
                onClick={() => validateStep(0) && setStep(1)}
                className="btn btn-primary mt-6 w-full py-3.5"
              >
                Continue to delivery
              </button>
            </section>
          )}

          {/* ── Step 2: address ── */}
          {step === 1 && (
            <section className="card p-6">
              <h2 className="text-lg font-bold">Where should we deliver?</h2>
              <p className="mt-1 text-sm text-ink-muted">
                House/flat number and a complete address help us hand it over directly.
              </p>

              <div className="mt-6 space-y-4">
                <div ref={addressWrapRef}>
                  <label htmlFor="f-addressLine1" className="label">
                    Society / Area / Street
                  </label>
                  <div className="relative">
                    <input
                      id="f-addressLine1"
                      name="addressLine1"
                      autoComplete="off"
                      value={values.addressLine1}
                      onChange={(e) => {
                        set("addressLine1")(e);
                        setSuggestOpen(true);
                        setHighlight(0);
                      }}
                      onFocus={() => {
                        setSuggestOpen(true);
                        setHighlight(0);
                      }}
                      onKeyDown={onAddressKeyDown}
                      placeholder="Start typing your society or building name"
                      role="combobox"
                      aria-expanded={suggestOpen}
                      aria-controls="society-listbox"
                      aria-autocomplete="list"
                      aria-invalid={Boolean(errors.addressLine1)}
                      aria-describedby={
                        errors.addressLine1 ? "f-addressLine1-err" : undefined
                      }
                      className={cn("field pr-10", errors.addressLine1 && "field-error")}
                    />
                    <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-muted" />

                    {suggestOpen && filteredSocieties.length > 0 && (
                      <ul
                        id="society-listbox"
                        role="listbox"
                        className="absolute inset-x-0 top-full z-20 mt-1.5 max-h-60 overflow-y-auto rounded-xl border border-cream-300 bg-white py-1.5 shadow-(--shadow-lift)"
                      >
                        {filteredSocieties.map((s, i) => (
                          <li key={s.id} role="presentation">
                            <button
                              type="button"
                              role="option"
                              aria-selected={values.addressLine1 === s.name}
                              onMouseDown={(e) => e.preventDefault()}
                              onMouseEnter={() => setHighlight(i)}
                              onClick={() => selectSociety(s.name)}
                              className={cn(
                                "flex w-full items-center justify-between gap-2 px-4 py-2.5 text-left text-sm transition-colors",
                                i === highlight
                                  ? "bg-maroon-50 text-maroon-800"
                                  : "text-ink-soft hover:bg-cream-100",
                              )}
                            >
                              {s.name}
                              {values.addressLine1 === s.name && (
                                <CheckIcon className="size-4 shrink-0 text-maroon-700" />
                              )}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-ink-muted">
                    Don&apos;t see your society? Type it anyway — we&apos;ll let
                    you know if we can deliver there.
                  </p>
                  {errors.addressLine1 && (
                    <p id="f-addressLine1-err" className="mt-1 text-xs text-maroon-600">
                      {errors.addressLine1}
                    </p>
                  )}
                </div>

                <Field
                  label="House No. / Flat No."
                  optional
                  name="flat"
                  value={values.flat}
                  onChange={set("flat")}
                  placeholder="B-1204"
                />

                <Field
                  label="Complete Address"
                  optional
                  name="addressLine2"
                  value={values.addressLine2}
                  onChange={set("addressLine2")}
                  placeholder="Block, wing, floor — anything the society name doesn't cover"
                />

                <div className="grid grid-cols-2 gap-3">
                  <Field
                    label="City"
                    name="city"
                    value={values.city}
                    onChange={set("city")}
                    error={errors.city}
                    autoComplete="address-level2"
                  />
                  <Field
                    label="Pincode"
                    name="pincode"
                    value={values.pincode}
                    onChange={set("pincode")}
                    error={errors.pincode}
                    inputMode="numeric"
                    autoComplete="postal-code"
                  />
                </div>

                <Field
                  label="Landmark"
                  optional
                  name="landmark"
                  value={values.landmark}
                  onChange={set("landmark")}
                  placeholder=""
                />

                <div>
                  <label htmlFor="customerNote" className="label">
                    Delivery instructions{" "}
                    <span className="font-normal text-ink-muted">
                      (optional)
                    </span>
                  </label>
                  <textarea
                    id="customerNote"
                    rows={3}
                    value={values.customerNote}
                    onChange={set("customerNote")}
                    placeholder="Leave with the guard if I'm not home"
                    className="field resize-y"
                  />
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(0)}
                  className="btn btn-outline shrink-0"
                >
                  <ChevronLeft className="size-4" /> Back
                </button>
                <button
                  type="button"
                  onClick={() => validateStep(1) && setStep(2)}
                  className="btn btn-primary flex-1 py-3.5"
                >
                  Review order
                </button>
              </div>
            </section>
          )}

          {/* ── Step 3: review ── */}
          {step === 2 && (
            <section className="space-y-4">
              <div className="card p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-bold">Delivering to</h2>
                    <address className="mt-3 text-sm not-italic leading-relaxed text-ink-soft">
                      <strong className="text-ink">{values.contactName}</strong>
                      <br />
                      +91 {values.contactPhone}
                      {values.contactEmail && (
                        <>
                          <br />
                          {values.contactEmail}
                        </>
                      )}
                      <br />
                      {values.flat && (
                        <>
                          {values.flat}
                          <br />
                        </>
                      )}
                      {values.addressLine1}
                      <br />
                      {values.addressLine2 && (
                        <>
                          {values.addressLine2}
                          <br />
                        </>
                      )}
                      {values.landmark && (
                        <>
                          {values.landmark}
                          <br />
                        </>
                      )}
                      {values.city}, {values.state} — {values.pincode}
                    </address>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="btn btn-ghost btn-sm shrink-0"
                  >
                    Edit
                  </button>
                </div>

                {values.customerNote && (
                  <p className="mt-4 rounded-lg bg-cream-100 px-3 py-2.5 text-xs text-ink-soft">
                    <strong>Note:</strong> {values.customerNote}
                  </p>
                )}
              </div>

              <div className="card p-6">
                <h2 className="text-lg font-bold">Payment</h2>
                <div className="mt-4 flex items-center gap-3 rounded-xl border-2 border-maroon-700 bg-maroon-50 p-4">
                  <CashIcon className="size-6 shrink-0 text-maroon-700" />
                  <div>
                    <p className="text-sm font-bold text-maroon-900">
                      Cash on Delivery
                    </p>
                    <p className="mt-0.5 text-xs text-maroon-800/75">
                      Pay {formatPaise(total)} to the delivery partner at your
                      door.
                    </p>
                  </div>
                  <CheckIcon className="ml-auto size-5 shrink-0 text-maroon-700" />
                </div>
              </div>

              <div className="card p-6">
                <h2 className="text-lg font-bold">
                  Your items ({lines.reduce((s, l) => s + l.quantity, 0)})
                </h2>
                <ul className="mt-4 divide-y divide-cream-300">
                  {lines.map((l) => (
                    <li key={l.productId} className="flex gap-3 py-3">
                      <div className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-cream-200">
                        {l.image && (
                          <Image
                            src={l.image}
                            alt=""
                            fill
                            sizes="56px"
                            className="object-cover"
                          />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-1 text-sm font-medium">
                          {l.name}
                        </p>
                        <p className="text-xs text-ink-muted">
                          {l.quantity} × {formatPaise(l.price)}
                        </p>
                      </div>
                      <span className="text-sm font-semibold tabular-nums">
                        {formatPaise(l.price * l.quantity)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* errors.form plus anything that has no visible field of its own,
                  so a rejected order never fails silently. */}
              {(() => {
                const orphans = Object.entries(errors)
                  .filter(([k]) => k !== "form" && FIELD_STEP[k] == null)
                  .map(([, v]) => v);
                const messages = [errors.form, ...orphans].filter(
                  Boolean,
                ) as string[];
                if (messages.length === 0) return null;
                return (
                  <div className="rounded-xl bg-maroon-50 px-4 py-3 text-sm font-medium text-maroon-800">
                    {messages.map((m) => (
                      <p key={m}>{m}</p>
                    ))}
                  </div>
                );
              })()}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="btn btn-outline shrink-0"
                >
                  <ChevronLeft className="size-4" /> Back
                </button>
                <div className="flex-1">
                  <PlaceOrderButton total={total} />
                </div>
              </div>

              <p className="text-center text-xs text-ink-muted">
                By placing this order you agree to our{" "}
                <Link href="/terms" className="underline hover:text-maroon-700">
                  terms
                </Link>
                .
              </p>
            </section>
          )}
        </form>
      </div>

      {/* Summary rail */}
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="card p-6">
          <h2 className="text-base font-bold">Order summary</h2>

          <ul className="mt-4 max-h-64 space-y-3 overflow-y-auto">
            {lines.map((l) => (
              <li key={l.productId} className="flex gap-3">
                <div className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-cream-200">
                  {l.image && (
                    <Image
                      src={l.image}
                      alt=""
                      fill
                      sizes="48px"
                      className="object-cover"
                    />
                  )}
                  <span className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-maroon-700 text-[0.625rem] font-bold text-cream-50">
                    {l.quantity}
                  </span>
                </div>
                <p className="line-clamp-2 flex-1 text-xs leading-snug text-ink-soft">
                  {l.name}
                </p>
                <span className="text-xs font-semibold tabular-nums">
                  {formatPaise(l.price * l.quantity)}
                </span>
              </li>
            ))}
          </ul>

          <dl className="mt-5 space-y-2 border-t border-cream-300 pt-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-ink-soft">Subtotal</dt>
              <dd className="font-semibold tabular-nums">
                {formatPaise(subtotal)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-soft">Delivery</dt>
              <dd className="font-semibold tabular-nums">
                {shipping === 0 ? (
                  <span className="text-emerald-700">Free</span>
                ) : (
                  formatPaise(shipping)
                )}
              </dd>
            </div>
            <div className="rule-gold my-2" />
            <div className="flex justify-between text-base">
              <dt className="font-bold">Total</dt>
              <dd className="font-bold tabular-nums text-maroon-800">
                {formatPaise(total)}
              </dd>
            </div>
          </dl>

          <p className="mt-4 rounded-lg bg-cream-100 px-3 py-2.5 text-xs text-ink-soft">
            Expected delivery by <strong>{estimatedDelivery()}</strong>
          </p>
        </div>
      </aside>

      {/* Unserviceable-address dialog */}
      <div
        onClick={() => setShowUnserviceable(false)}
        aria-hidden
        className={cn(
          "fixed inset-0 z-50 bg-ink/45 backdrop-blur-[2px] transition-opacity duration-300",
          showUnserviceable ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="We don't deliver there yet"
        className={cn(
          "fixed left-1/2 top-1/2 z-51 w-[90%] max-w-sm -translate-x-1/2 rounded-xl2 bg-white p-6 text-center shadow-2xl transition-all duration-300",
          showUnserviceable
            ? "-translate-y-1/2 opacity-100"
            : "pointer-events-none translate-y-[-45%] opacity-0",
        )}
      >
        <button
          type="button"
          onClick={() => setShowUnserviceable(false)}
          aria-label="Close"
          className="absolute right-3 top-3 grid size-8 place-items-center rounded-full text-ink-muted hover:bg-cream-200"
        >
          <CloseIcon className="size-4" />
        </button>
        <h2 className="font-display text-lg font-bold">Coming soon to your area</h2>
        <p className="mt-2 text-sm text-ink-soft">
          We don&apos;t deliver to <strong>{values.addressLine1}</strong> yet —
          but we&apos;ve noted your interest and will reach out as soon as we
          expand there.
        </p>
        <div className="mt-5 flex flex-col gap-2">
          <button
            type="button"
            onClick={() => setShowUnserviceable(false)}
            className="btn btn-primary w-full"
          >
            Try a different society
          </button>
          <button
            type="button"
            onClick={() => router.push("/products")}
            className="btn btn-ghost w-full"
          >
            Back to shopping
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  name,
  value,
  onChange,
  error,
  optional,
  prefix,
  ...rest
}: {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  optional?: boolean;
  prefix?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  const id = `f-${name}`;
  return (
    <div>
      <label htmlFor={id} className="label">
        {label}{" "}
        {optional && (
          <span className="font-normal text-ink-muted">(optional)</span>
        )}
      </label>
      <div className="relative">
        {prefix && (
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-ink-muted">
            {prefix}
          </span>
        )}
        <input
          id={id}
          value={value}
          onChange={onChange}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-err` : undefined}
          className={cn("field", prefix && "pl-12", error && "field-error")}
          {...rest}
        />
      </div>
      {error && (
        <p id={`${id}-err`} className="mt-1 text-xs text-maroon-600">
          {error}
        </p>
      )}
    </div>
  );
}
