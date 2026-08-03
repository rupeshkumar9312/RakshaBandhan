"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/components/cart-provider";
import { formatPaise, discountPercent } from "@/lib/money";
import { parseTags, cn } from "@/lib/utils";
import { CartIcon, CheckIcon } from "@/components/icons";
import type { ProductCard as ProductCardData } from "@/lib/queries";

export function ProductCard({
  product,
  priority = false,
}: {
  product: ProductCardData;
  priority?: boolean;
}) {
  const { add } = useCart();
  const [justAdded, setJustAdded] = useState(false);

  const image = product.images[0]?.url ?? null;
  const off = discountPercent(product.price, product.compareAtPrice);
  const soldOut = product.inventory <= 0;
  const lowStock = !soldOut && product.inventory <= 5;
  const tags = parseTags(product.tags);
  const isBestseller = tags.includes("bestseller");

  function handleAdd(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (soldOut) return;
    add(
      {
        productId: product.id,
        slug: product.slug,
        name: product.name,
        price: product.price,
        image,
        maxQty: product.inventory,
      },
      1,
    );
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1600);
  }

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group card relative flex flex-col overflow-hidden transition-shadow duration-300 hover:shadow-[var(--shadow-lift)]"
    >
      <div className="relative aspect-4/5 overflow-hidden bg-cream-200">
        {image ? (
          <Image
            src={image}
            alt={product.images[0]?.alt || product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            priority={priority}
            className={cn(
              "object-cover transition-transform duration-700 ease-out group-hover:scale-107",
              soldOut && "opacity-55 saturate-50",
            )}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-ink-muted text-sm">
            No image
          </div>
        )}

        {/* Badges */}
        <div className="pointer-events-none absolute left-2.5 top-2.5 flex flex-col gap-1.5">
          {off != null && (
            <span className="chip bg-maroon-700 text-cream-50 shadow-sm">{off}% off</span>
          )}
          {isBestseller && (
            <span className="chip bg-gold-400 text-maroon-950 shadow-sm">Bestseller</span>
          )}
        </div>

        {soldOut && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="chip bg-ink/85 px-4 py-2 text-cream-50 backdrop-blur-sm">
              Sold out
            </span>
          </div>
        )}

        {/* Desktop quick-add */}
        <button
          type="button"
          onClick={handleAdd}
          disabled={soldOut}
          aria-label={`Add ${product.name} to cart`}
          className={cn(
            "absolute inset-x-2.5 bottom-2.5 hidden items-center justify-center gap-2 rounded-full py-2.5 text-sm font-semibold",
            "translate-y-3 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 sm:flex",
            "focus-visible:translate-y-0 focus-visible:opacity-100",
            justAdded
              ? "bg-emerald-600 text-white"
              : "bg-cream-50/95 text-maroon-800 backdrop-blur hover:bg-white",
            soldOut && "hidden!",
          )}
        >
          {justAdded ? (
            <>
              <CheckIcon className="size-4" /> Added
            </>
          ) : (
            <>
              <CartIcon className="size-4" /> Quick add
            </>
          )}
        </button>
      </div>

      <div className="flex flex-1 flex-col p-3.5 sm:p-4">
        <p className="eyebrow mb-1 text-[0.625rem]">{product.category.name}</p>
        <h3 className="line-clamp-2 text-[0.9375rem] leading-snug font-semibold text-ink sm:text-base">
          {product.name}
        </h3>
        {product.shortDesc && (
          <p className="mt-1 line-clamp-2 hidden text-xs text-ink-muted sm:block">
            {product.shortDesc}
          </p>
        )}

        <div className="mt-auto flex items-end justify-between gap-2 pt-3">
          <div className="flex items-baseline gap-1.5">
            <span className="text-base font-bold text-maroon-800 sm:text-lg">
              {formatPaise(product.price)}
            </span>
            {product.compareAtPrice && (
              <span className="text-xs text-ink-muted line-through">
                {formatPaise(product.compareAtPrice)}
              </span>
            )}
          </div>

          {/* Mobile add button */}
          <button
            type="button"
            onClick={handleAdd}
            disabled={soldOut}
            aria-label={`Add ${product.name} to cart`}
            className={cn(
              "grid size-9 shrink-0 place-items-center rounded-full transition-colors sm:hidden",
              justAdded ? "bg-emerald-600 text-white" : "bg-maroon-700 text-cream-50",
              soldOut && "bg-cream-300 text-ink-muted",
            )}
          >
            {justAdded ? <CheckIcon className="size-4" /> : <CartIcon className="size-4" />}
          </button>
        </div>

        {lowStock && (
          <p className="mt-2 text-[0.6875rem] font-semibold text-maroon-600">
            Only {product.inventory} left
          </p>
        )}
      </div>
    </Link>
  );
}

export function ProductGrid({
  products,
  priorityCount = 4,
}: {
  products: ProductCardData[];
  priorityCount?: number;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((p, i) => (
        <ProductCard key={p.id} product={p} priority={i < priorityCount} />
      ))}
    </div>
  );
}
