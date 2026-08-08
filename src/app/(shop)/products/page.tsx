import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ProductGrid } from "@/components/product-card";
import { CatalogFilters, ActiveFilterPills } from "@/components/catalog-filters";
import { getCatalog, getCategories } from "@/lib/queries";
import { ChevronLeft, ChevronRight, SearchIcon } from "@/components/icons";

export const metadata: Metadata = {
  title: "Shop all rakhis",
  description:
    "Browse designer, silver, kids and bhaiya-bhabhi rakhis plus gift hampers. Cash on Delivery, free delivery.",
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function one(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

function num(v: string | string[] | undefined): number | undefined {
  const s = one(v);
  if (!s) return undefined;
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
}

export default async function ProductsPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;

  const category = one(sp.category);
  const q = one(sp.q);
  const sort = one(sp.sort);
  const min = num(sp.min);
  const max = num(sp.max);
  const page = num(sp.page) ?? 1;

  const [categories, result] = await Promise.all([
    getCategories(),
    getCatalog({ category, q, sort, min, max, page }),
  ]);

  const activeCategory = categories.find((c) => c.slug === category);

  return (
    <>
      {/* Page header */}
      <section className="border-b border-cream-300 bg-gradient-to-b from-cream-50 to-cream-100">
        <div className="container-x py-10 sm:py-14">
          <nav aria-label="Breadcrumb" className="mb-3 text-xs text-ink-muted">
            <Link href="/" className="hover:text-maroon-700">
              Home
            </Link>
            <span className="mx-1.5">/</span>
            <span className="text-ink-soft">{activeCategory?.name ?? "All rakhis"}</span>
          </nav>

          <h1 className="font-display text-3xl font-bold sm:text-5xl">
            {activeCategory?.name ?? (q ? `Results for “${q}”` : "Every rakhi we have")}
          </h1>
          <p className="mt-3 max-w-2xl text-[0.9375rem] leading-relaxed text-ink-muted">
            {activeCategory?.description ??
              "Twenty-odd designs across five collections — from ₹149 kids rakhis to hallmarked sterling silver. Everything ships same-day inside the society."}
          </p>
        </div>
      </section>

      <div className="container-x py-8 sm:py-12">
        <div className="grid gap-8 lg:grid-cols-[15rem_1fr] lg:gap-12">
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <Suspense fallback={<div className="skeleton h-96 rounded-xl2" />}>
              <CatalogFilters categories={categories} total={result.total} />
            </Suspense>
          </aside>

          <div>
            <div className="mb-5 hidden items-baseline justify-between lg:flex">
              <p className="text-sm text-ink-muted">
                Showing{" "}
                <strong className="text-ink">
                  {(result.page - 1) * result.perPage + 1}–
                  {Math.min(result.page * result.perPage, result.total)}
                </strong>{" "}
                of {result.total}
              </p>
            </div>

            <Suspense fallback={null}>
              <ActiveFilterPills
                categoryName={activeCategory?.name}
                query={q}
                min={min}
                max={max}
              />
            </Suspense>

            {result.items.length === 0 ? (
              <div className="card flex flex-col items-center gap-4 px-6 py-20 text-center">
                <div className="grid size-16 place-items-center rounded-full bg-cream-200">
                  <SearchIcon className="size-7 text-ink-muted" />
                </div>
                <div>
                  <p className="text-lg font-semibold">Nothing matched that</p>
                  <p className="mt-1.5 max-w-sm text-sm text-ink-muted">
                    Try a broader price range, or clear the filters to see the full collection.
                  </p>
                </div>
                <Link href="/products" className="btn btn-primary btn-sm">
                  Show everything
                </Link>
              </div>
            ) : (
              <ProductGrid products={result.items} />
            )}

            {result.pageCount > 1 && (
              <Pagination
                page={result.page}
                pageCount={result.pageCount}
                searchParams={sp}
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function Pagination({
  page,
  pageCount,
  searchParams,
}: {
  page: number;
  pageCount: number;
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const href = (p: number) => {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(searchParams)) {
      if (k === "page" || v == null) continue;
      params.set(k, Array.isArray(v) ? v[0] : v);
    }
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return qs ? `/products?${qs}` : "/products";
  };

  return (
    <nav aria-label="Pagination" className="mt-12 flex items-center justify-center gap-1.5">
      {page > 1 && (
        <Link
          href={href(page - 1)}
          aria-label="Previous page"
          className="grid size-10 place-items-center rounded-full border border-cream-300 bg-white text-ink-soft transition-colors hover:border-maroon-300 hover:text-maroon-700"
        >
          <ChevronLeft className="size-4" />
        </Link>
      )}

      {Array.from({ length: pageCount }, (_, i) => i + 1).map((p) => (
        <Link
          key={p}
          href={href(p)}
          aria-current={p === page ? "page" : undefined}
          className={
            p === page
              ? "grid size-10 place-items-center rounded-full bg-maroon-700 text-sm font-bold text-cream-50"
              : "grid size-10 place-items-center rounded-full border border-cream-300 bg-white text-sm text-ink-soft transition-colors hover:border-maroon-300 hover:text-maroon-700"
          }
        >
          {p}
        </Link>
      ))}

      {page < pageCount && (
        <Link
          href={href(page + 1)}
          aria-label="Next page"
          className="grid size-10 place-items-center rounded-full border border-cream-300 bg-white text-ink-soft transition-colors hover:border-maroon-300 hover:text-maroon-700"
        >
          <ChevronRight className="size-4" />
        </Link>
      )}
    </nav>
  );
}
