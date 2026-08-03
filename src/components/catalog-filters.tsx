"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useState } from "react";
import { cn } from "@/lib/utils";
import { formatPaise } from "@/lib/money";
import { ChevronDown, CloseIcon, SearchIcon } from "@/components/icons";

type Category = { id: string; name: string; slug: string; _count: { products: number } };

const SORTS = [
  { value: "featured", label: "Featured" },
  { value: "newest", label: "Newest first" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
];

const PRICE_BANDS = [
  { label: "Under ₹250", min: undefined, max: 24999 },
  { label: "₹250 – ₹500", min: 25000, max: 50000 },
  { label: "₹500 – ₹1000", min: 50000, max: 100000 },
  { label: "Above ₹1000", min: 100000, max: undefined },
];

export function CatalogFilters({
  categories,
  total,
}: {
  categories: Category[];
  total: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [search, setSearch] = useState(params.get("q") ?? "");

  const activeCategory = params.get("category");
  const activeSort = params.get("sort") ?? "featured";
  const activeMin = params.get("min");
  const activeMax = params.get("max");

  const push = useCallback(
    (mutate: (p: URLSearchParams) => void) => {
      const next = new URLSearchParams(params.toString());
      mutate(next);
      next.delete("page"); // any filter change resets pagination
      const qs = next.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [params, pathname, router],
  );

  const setParam = (key: string, value?: string | null) =>
    push((p) => (value ? p.set(key, value) : p.delete(key)));

  const activeBand = PRICE_BANDS.find(
    (b) => String(b.min ?? "") === (activeMin ?? "") && String(b.max ?? "") === (activeMax ?? ""),
  );

  const hasFilters = Boolean(activeCategory || activeMin || activeMax || params.get("q"));

  const panel = (
    <div className="space-y-7">
      <div>
        <h3 className="mb-3 text-sm font-bold">Category</h3>
        <ul className="space-y-1">
          <li>
            <button
              onClick={() => setParam("category", null)}
              className={cn(
                "flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors",
                !activeCategory
                  ? "bg-maroon-700 font-semibold text-cream-50"
                  : "text-ink-soft hover:bg-cream-200",
              )}
            >
              All rakhis
            </button>
          </li>
          {categories.map((c) => (
            <li key={c.id}>
              <button
                onClick={() => setParam("category", c.slug)}
                className={cn(
                  "flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors",
                  activeCategory === c.slug
                    ? "bg-maroon-700 font-semibold text-cream-50"
                    : "text-ink-soft hover:bg-cream-200",
                )}
              >
                <span>{c.name}</span>
                <span
                  className={cn(
                    "text-xs tabular-nums",
                    activeCategory === c.slug ? "text-cream-200/70" : "text-ink-muted",
                  )}
                >
                  {c._count.products}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-bold">Price</h3>
        <ul className="space-y-1">
          {PRICE_BANDS.map((b) => {
            const isActive = activeBand === b;
            return (
              <li key={b.label}>
                <button
                  onClick={() =>
                    push((p) => {
                      if (isActive) {
                        p.delete("min");
                        p.delete("max");
                        return;
                      }
                      b.min != null ? p.set("min", String(b.min)) : p.delete("min");
                      b.max != null ? p.set("max", String(b.max)) : p.delete("max");
                    })
                  }
                  className={cn(
                    "w-full rounded-lg px-3 py-2 text-left text-sm transition-colors",
                    isActive
                      ? "bg-maroon-700 font-semibold text-cream-50"
                      : "text-ink-soft hover:bg-cream-200",
                  )}
                >
                  {b.label}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {hasFilters && (
        <button
          onClick={() => router.push(pathname, { scroll: false })}
          className="btn btn-outline btn-sm w-full"
        >
          Clear all filters
        </button>
      )}
    </div>
  );

  return (
    <>
      {/* Toolbar */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setParam("q", search.trim() || null);
          }}
          className="relative flex-1 sm:max-w-xs"
        >
          <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search rakhis…"
            aria-label="Search rakhis"
            className="field py-2.5 pl-10 text-sm"
          />
          {search && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setParam("q", null);
              }}
              aria-label="Clear search"
              className="absolute right-2.5 top-1/2 grid size-6 -translate-y-1/2 place-items-center rounded-full text-ink-muted hover:bg-cream-200"
            >
              <CloseIcon className="size-3.5" />
            </button>
          )}
        </form>

        <button
          onClick={() => setMobileOpen(true)}
          className="btn btn-outline btn-sm lg:hidden"
        >
          Filters
          {hasFilters && <span className="size-1.5 rounded-full bg-maroon-600" />}
        </button>

        <div className="relative ml-auto">
          <select
            value={activeSort}
            onChange={(e) => setParam("sort", e.target.value === "featured" ? null : e.target.value)}
            aria-label="Sort products"
            className="field appearance-none py-2.5 pr-9 text-sm"
          >
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-ink-muted" />
        </div>
      </div>

      <p className="mb-5 text-sm text-ink-muted lg:hidden">
        {total} {total === 1 ? "product" : "products"}
      </p>

      {/* Desktop sidebar */}
      <div className="hidden lg:block">{panel}</div>

      {/* Mobile sheet */}
      <div
        onClick={() => setMobileOpen(false)}
        aria-hidden
        className={cn(
          "fixed inset-0 z-50 bg-ink/45 transition-opacity lg:hidden",
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />
      <div
        className={cn(
          "fixed inset-x-0 bottom-0 z-51 max-h-[80dvh] overflow-y-auto rounded-t-3xl bg-cream-100 p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] lg:hidden",
          mobileOpen ? "translate-y-0" : "translate-y-full",
        )}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-bold">Filters</h2>
          <button
            onClick={() => setMobileOpen(false)}
            aria-label="Close filters"
            className="grid size-9 place-items-center rounded-full hover:bg-cream-200"
          >
            <CloseIcon className="size-5" />
          </button>
        </div>
        {panel}
        <button onClick={() => setMobileOpen(false)} className="btn btn-primary mt-6 w-full">
          Show {total} {total === 1 ? "result" : "results"}
        </button>
      </div>
    </>
  );
}

export function ActiveFilterPills({
  categoryName,
  query,
  min,
  max,
}: {
  categoryName?: string;
  query?: string;
  min?: number;
  max?: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const drop = (keys: string[]) => {
    const next = new URLSearchParams(params.toString());
    keys.forEach((k) => next.delete(k));
    next.delete("page");
    const qs = next.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const pills: { label: string; keys: string[] }[] = [];
  if (categoryName) pills.push({ label: categoryName, keys: ["category"] });
  if (query) pills.push({ label: `“${query}”`, keys: ["q"] });
  if (min != null || max != null) {
    pills.push({
      label:
        min != null && max != null
          ? `${formatPaise(min)} – ${formatPaise(max)}`
          : min != null
            ? `Above ${formatPaise(min)}`
            : `Under ${formatPaise(max!)}`,
      keys: ["min", "max"],
    });
  }

  if (pills.length === 0) return null;

  return (
    <div className="mb-5 flex flex-wrap items-center gap-2">
      {pills.map((p) => (
        <button
          key={p.label}
          onClick={() => drop(p.keys)}
          className="chip border border-cream-300 bg-white text-ink-soft transition-colors hover:border-maroon-300 hover:text-maroon-700"
        >
          {p.label}
          <CloseIcon className="size-3" />
        </button>
      ))}
    </div>
  );
}
