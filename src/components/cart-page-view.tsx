"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/components/cart-provider";
import { formatPaise, FREE_SHIPPING_THRESHOLD } from "@/lib/money";
import { CartIcon, MinusIcon, PlusIcon, TrashIcon, CashIcon, TruckIcon } from "@/components/icons";

export function CartPageView() {
  const { lines, hydrated, setQty, remove, subtotal, shipping, total, count } = useCart();

  if (!hydrated) {
    return (
      <div className="container-x py-16">
        <div className="skeleton h-64 rounded-xl2" />
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="container-x flex flex-col items-center gap-5 py-24 text-center">
        <div className="grid size-24 place-items-center rounded-full bg-cream-200">
          <CartIcon className="size-11 text-ink-muted" />
        </div>
        <div>
          <h1 className="font-display text-3xl font-bold">Your cart is empty</h1>
          <p className="mt-2 max-w-sm text-[0.9375rem] text-ink-muted">
            Nothing here yet. Have a look at this season&apos;s collection — the good ones go first.
          </p>
        </div>
        <Link href="/products" className="btn btn-primary">
          Browse rakhis
        </Link>
      </div>
    );
  }

  const remaining = FREE_SHIPPING_THRESHOLD - subtotal;

  return (
    <div className="container-x py-10 sm:py-14">
      <h1 className="font-display text-3xl font-bold sm:text-4xl">
        Your cart{" "}
        <span className="text-lg font-normal text-ink-muted">
          ({count} item{count === 1 ? "" : "s"})
        </span>
      </h1>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_22rem] lg:gap-12">
        <ul className="space-y-4">
          {lines.map((line) => (
            <li key={line.productId} className="card flex gap-4 p-4">
              <Link
                href={`/products/${line.slug}`}
                className="relative size-24 shrink-0 overflow-hidden rounded-xl bg-cream-200 sm:size-32"
              >
                {line.image && (
                  <Image
                    src={line.image}
                    alt={line.name}
                    fill
                    sizes="128px"
                    className="object-cover"
                  />
                )}
              </Link>

              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex items-start justify-between gap-3">
                  <Link
                    href={`/products/${line.slug}`}
                    className="font-semibold leading-snug hover:text-maroon-700"
                  >
                    {line.name}
                  </Link>
                  <button
                    onClick={() => remove(line.productId)}
                    aria-label={`Remove ${line.name}`}
                    className="grid size-8 shrink-0 place-items-center rounded-full text-ink-muted transition-colors hover:bg-maroon-50 hover:text-maroon-700"
                  >
                    <TrashIcon className="size-4" />
                  </button>
                </div>

                <p className="mt-1 text-sm text-ink-muted">{formatPaise(line.price)} each</p>

                <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-3">
                  <div className="flex items-center rounded-full border border-cream-300 bg-white">
                    <button
                      onClick={() => setQty(line.productId, line.quantity - 1)}
                      aria-label="Decrease quantity"
                      className="grid size-9 place-items-center rounded-l-full text-ink-soft transition-colors hover:bg-cream-200"
                    >
                      <MinusIcon className="size-3.5" />
                    </button>
                    <span className="w-9 text-center text-sm font-semibold tabular-nums">
                      {line.quantity}
                    </span>
                    <button
                      onClick={() => setQty(line.productId, line.quantity + 1)}
                      disabled={line.quantity >= line.maxQty}
                      aria-label="Increase quantity"
                      className="grid size-9 place-items-center rounded-r-full text-ink-soft transition-colors hover:bg-cream-200 disabled:opacity-35"
                    >
                      <PlusIcon className="size-3.5" />
                    </button>
                  </div>

                  <span className="text-lg font-bold text-maroon-800 tabular-nums">
                    {formatPaise(line.price * line.quantity)}
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="card p-6">
            <h2 className="text-lg font-bold">Order summary</h2>

            <dl className="mt-5 space-y-2.5 text-sm">
              <div className="flex justify-between">
                <dt className="text-ink-soft">Subtotal</dt>
                <dd className="font-semibold tabular-nums">{formatPaise(subtotal)}</dd>
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
              <div className="rule-gold my-3" />
              <div className="flex justify-between text-lg">
                <dt className="font-bold">Total</dt>
                <dd className="font-bold tabular-nums text-maroon-800">{formatPaise(total)}</dd>
              </div>
            </dl>

            {remaining > 0 && (
              <p className="mt-4 rounded-lg bg-gold-50 px-3 py-2.5 text-xs text-gold-800">
                Add <strong>{formatPaise(remaining)}</strong> more to get free delivery.
              </p>
            )}

            <Link href="/checkout" className="btn btn-primary mt-6 w-full py-3.5">
              Proceed to checkout
            </Link>
            <Link href="/products" className="btn btn-ghost mt-1 w-full text-sm">
              Continue shopping
            </Link>

            <ul className="mt-6 space-y-2.5 border-t border-cream-300 pt-5 text-xs text-ink-muted">
              <li className="flex gap-2.5">
                <CashIcon className="size-4 shrink-0 text-maroon-700" />
                Cash on Delivery — pay when it arrives
              </li>
              <li className="flex gap-2.5">
                <TruckIcon className="size-4 shrink-0 text-maroon-700" />
                Same-day delivery inside the society
              </li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
