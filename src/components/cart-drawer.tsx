"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/components/cart-provider";
import { formatPaise, FREE_SHIPPING_THRESHOLD } from "@/lib/money";
import { CloseIcon, MinusIcon, PlusIcon, TrashIcon, CartIcon } from "@/components/icons";

export function CartDrawer() {
  const { isOpen, closeCart, lines, setQty, remove, subtotal, shipping, total, count } = useCart();

  const remaining = FREE_SHIPPING_THRESHOLD - subtotal;
  const progress = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100);

  return (
    <>
      <div
        onClick={closeCart}
        aria-hidden
        className={`fixed inset-0 z-50 bg-ink/45 backdrop-blur-[2px] transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
        className={`fixed right-0 top-0 z-51 flex h-[100dvh] w-full max-w-md flex-col bg-cream-100 shadow-2xl transition-transform duration-350 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <header className="flex items-center justify-between border-b border-cream-300 bg-white px-5 py-4">
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <CartIcon className="size-5 text-maroon-700" />
            Your cart
            {count > 0 && <span className="text-sm font-medium text-ink-muted">({count})</span>}
          </h2>
          <button
            onClick={closeCart}
            aria-label="Close cart"
            className="grid size-9 place-items-center rounded-full text-ink-soft transition-colors hover:bg-cream-200"
          >
            <CloseIcon className="size-5" />
          </button>
        </header>

        {lines.length > 0 && (
          <div className="border-b border-cream-300 bg-white px-5 pb-3.5">
            {remaining > 0 ? (
              <p className="text-xs text-ink-soft">
                Add <strong className="text-maroon-700">{formatPaise(remaining)}</strong> more for
                free delivery
              </p>
            ) : (
              <p className="text-xs font-semibold text-emerald-700">
                🎉 You&apos;ve unlocked free delivery
              </p>
            )}
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-cream-200">
              <div
                className="h-full rounded-full bg-gradient-to-r from-gold-400 to-maroon-600 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-4">
          {lines.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
              <div className="grid size-20 place-items-center rounded-full bg-cream-200">
                <CartIcon className="size-9 text-ink-muted" />
              </div>
              <div>
                <p className="font-semibold">Your cart is empty</p>
                <p className="mt-1 text-sm text-ink-muted">
                  Pick a rakhi and it&apos;ll show up here.
                </p>
              </div>
              <Link href="/products" onClick={closeCart} className="btn btn-primary btn-sm">
                Browse rakhis
              </Link>
            </div>
          ) : (
            <ul className="space-y-3">
              {lines.map((line) => (
                <li key={line.productId} className="card flex gap-3 p-3">
                  <Link
                    href={`/products/${line.slug}`}
                    onClick={closeCart}
                    className="relative size-20 shrink-0 overflow-hidden rounded-lg bg-cream-200"
                  >
                    {line.image && (
                      <Image
                        src={line.image}
                        alt={line.name}
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                    )}
                  </Link>

                  <div className="flex min-w-0 flex-1 flex-col">
                    <Link
                      href={`/products/${line.slug}`}
                      onClick={closeCart}
                      className="line-clamp-2 text-sm font-semibold hover:text-maroon-700"
                    >
                      {line.name}
                    </Link>
                    <p className="mt-0.5 text-sm font-bold text-maroon-800">
                      {formatPaise(line.price)}
                    </p>

                    <div className="mt-auto flex items-center justify-between pt-2">
                      <div className="flex items-center rounded-full border border-cream-300 bg-white">
                        <button
                          onClick={() => setQty(line.productId, line.quantity - 1)}
                          aria-label="Decrease quantity"
                          className="grid size-8 place-items-center rounded-l-full text-ink-soft transition-colors hover:bg-cream-200"
                        >
                          <MinusIcon className="size-3.5" />
                        </button>
                        <span className="w-8 text-center text-sm font-semibold tabular-nums">
                          {line.quantity}
                        </span>
                        <button
                          onClick={() => setQty(line.productId, line.quantity + 1)}
                          disabled={line.quantity >= line.maxQty}
                          aria-label="Increase quantity"
                          className="grid size-8 place-items-center rounded-r-full text-ink-soft transition-colors hover:bg-cream-200 disabled:opacity-35"
                        >
                          <PlusIcon className="size-3.5" />
                        </button>
                      </div>

                      <button
                        onClick={() => remove(line.productId)}
                        aria-label={`Remove ${line.name}`}
                        className="grid size-8 place-items-center rounded-full text-ink-muted transition-colors hover:bg-maroon-50 hover:text-maroon-700"
                      >
                        <TrashIcon className="size-4" />
                      </button>
                    </div>
                    {line.quantity >= line.maxQty && (
                      <p className="mt-1 text-[0.6875rem] text-maroon-600">
                        Max available: {line.maxQty}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {lines.length > 0 && (
          <footer className="border-t border-cream-300 bg-white px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <dl className="space-y-1.5 text-sm">
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
              <div className="rule-gold my-2" />
              <div className="flex justify-between text-base">
                <dt className="font-bold">Total</dt>
                <dd className="font-bold tabular-nums text-maroon-800">{formatPaise(total)}</dd>
              </div>
            </dl>

            <Link
              href="/checkout"
              onClick={closeCart}
              className="btn btn-primary mt-4 w-full py-3.5"
            >
              Checkout · Cash on Delivery
            </Link>
            <button
              onClick={closeCart}
              className="btn btn-ghost mt-1 w-full text-sm"
            >
              Continue shopping
            </button>
          </footer>
        )}
      </aside>
    </>
  );
}
