"use client";

import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/components/cart-provider";
import { MinusIcon, PlusIcon, CartIcon, CheckIcon } from "@/components/icons";

export function AddToCart({
  productId,
  slug,
  name,
  price,
  image,
  inventory,
}: {
  productId: string;
  slug: string;
  name: string;
  price: number;
  image: string | null;
  inventory: number;
}) {
  const { add } = useCart();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const soldOut = inventory <= 0;

  function handleAdd() {
    if (soldOut) return;
    add({ productId, slug, name, price, image, maxQty: inventory }, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  if (soldOut) {
    return (
      <div className="space-y-3">
        <button disabled className="btn btn-primary w-full py-4">
          Sold out
        </button>
        <p className="text-center text-sm text-ink-muted">
          Out of stock right now.{" "}
          <Link href="/products" className="font-semibold text-maroon-700 hover:underline">
            See similar rakhis
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-stretch gap-3">
        <div className="flex items-center rounded-full border border-cream-300 bg-white">
          <button
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            disabled={qty <= 1}
            aria-label="Decrease quantity"
            className="grid size-12 place-items-center rounded-l-full text-ink-soft transition-colors hover:bg-cream-200 disabled:opacity-35"
          >
            <MinusIcon className="size-4" />
          </button>
          <span className="w-10 text-center font-semibold tabular-nums">{qty}</span>
          <button
            onClick={() => setQty((q) => Math.min(inventory, q + 1))}
            disabled={qty >= inventory}
            aria-label="Increase quantity"
            className="grid size-12 place-items-center rounded-r-full text-ink-soft transition-colors hover:bg-cream-200 disabled:opacity-35"
          >
            <PlusIcon className="size-4" />
          </button>
        </div>

        <button
          onClick={handleAdd}
          className={`btn flex-1 py-4 ${added ? "bg-emerald-600 text-white" : "btn-primary"}`}
        >
          {added ? (
            <>
              <CheckIcon className="size-5" /> Added to cart
            </>
          ) : (
            <>
              <CartIcon className="size-5" /> Add to cart
            </>
          )}
        </button>
      </div>

      <Link href="/checkout" onClick={handleAdd} className="btn btn-gold w-full py-4">
        Buy now · Cash on Delivery
      </Link>
    </div>
  );
}
