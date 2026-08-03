import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatPaise } from "@/lib/money";
import { deleteProduct, toggleProductFlag } from "@/app/actions/admin";
import { GridIcon, PlusIcon, TrashIcon, StarIcon, CheckIcon } from "@/components/icons";
import type { Prisma } from "@prisma/client";

export const metadata = { title: "Products" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function AdminProductsPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim() : undefined;
  const category = typeof sp.category === "string" ? sp.category : undefined;

  const where: Prisma.ProductWhereInput = {};
  if (q) where.OR = [{ name: { contains: q } }, { sku: { contains: q } }, { tags: { contains: q } }];
  if (category) where.categoryId = category;

  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
      include: {
        category: { select: { name: true } },
        images: { orderBy: { sortOrder: "asc" }, take: 1 },
        _count: { select: { orderItems: true } },
      },
    }),
    prisma.category.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold sm:text-3xl">Products</h1>
          <p className="mt-1 text-sm text-ink-muted">
            {products.length} product{products.length === 1 ? "" : "s"}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <form action="/admin/products" className="flex gap-2">
            <input
              name="q"
              defaultValue={q ?? ""}
              placeholder="Search name, SKU, tag"
              aria-label="Search products"
              className="field py-2.5 text-sm sm:w-56"
            />
            <button type="submit" className="btn btn-outline btn-sm">
              Search
            </button>
          </form>
          <Link href="/admin/products/new" className="btn btn-primary btn-sm">
            <PlusIcon className="size-4" /> New product
          </Link>
        </div>
      </header>

      {/* Category filter */}
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
        <Link
          href="/admin/products"
          className={`chip shrink-0 border transition-colors ${
            !category
              ? "border-maroon-700 bg-maroon-700 text-cream-50"
              : "border-cream-300 bg-white text-ink-soft hover:border-maroon-300"
          }`}
        >
          All
        </Link>
        {categories.map((c) => (
          <Link
            key={c.id}
            href={`/admin/products?category=${c.id}`}
            className={`chip shrink-0 border transition-colors ${
              category === c.id
                ? "border-maroon-700 bg-maroon-700 text-cream-50"
                : "border-cream-300 bg-white text-ink-soft hover:border-maroon-300"
            }`}
          >
            {c.name}
          </Link>
        ))}
      </div>

      {products.length === 0 ? (
        <div className="card flex flex-col items-center gap-3 px-6 py-20 text-center">
          <div className="grid size-14 place-items-center rounded-full bg-cream-200">
            <GridIcon className="size-6 text-ink-muted" />
          </div>
          <p className="font-semibold">No products found</p>
          <Link href="/admin/products/new" className="btn btn-primary btn-sm mt-1">
            Add your first product
          </Link>
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[46rem] text-sm">
            <thead className="border-b border-cream-300 bg-cream-50 text-left">
              <tr>
                <th className="px-4 py-3 text-xs font-semibold tracking-wide text-ink-muted uppercase">
                  Product
                </th>
                <th className="px-4 py-3 text-xs font-semibold tracking-wide text-ink-muted uppercase">
                  Category
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold tracking-wide text-ink-muted uppercase">
                  Price
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold tracking-wide text-ink-muted uppercase">
                  Stock
                </th>
                <th className="px-4 py-3 text-xs font-semibold tracking-wide text-ink-muted uppercase">
                  Status
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-300">
              {products.map((p) => (
                <tr key={p.id} className="transition-colors hover:bg-cream-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="relative size-11 shrink-0 overflow-hidden rounded-lg bg-cream-200">
                        {p.images[0] && (
                          <Image
                            src={p.images[0].url}
                            alt=""
                            fill
                            sizes="44px"
                            className="object-cover"
                          />
                        )}
                      </div>
                      <div className="min-w-0">
                        <Link
                          href={`/admin/products/${p.id}`}
                          className="block truncate font-medium hover:text-maroon-700"
                        >
                          {p.name}
                        </Link>
                        {p.sku && (
                          <p className="truncate font-mono text-xs text-ink-muted">{p.sku}</p>
                        )}
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-3 text-ink-muted">{p.category.name}</td>

                  <td className="px-4 py-3 text-right font-semibold tabular-nums">
                    {formatPaise(p.price)}
                  </td>

                  <td className="px-4 py-3 text-right">
                    <span
                      className={`font-semibold tabular-nums ${
                        p.inventory === 0
                          ? "text-maroon-600"
                          : p.inventory <= 5
                            ? "text-gold-700"
                            : "text-ink"
                      }`}
                    >
                      {p.inventory}
                    </span>
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <form action={toggleProductFlag}>
                        <input type="hidden" name="id" value={p.id} />
                        <input type="hidden" name="field" value="isActive" />
                        <button
                          type="submit"
                          title={p.isActive ? "Visible — click to hide" : "Hidden — click to show"}
                          className={`chip transition-colors ${
                            p.isActive
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-cream-200 text-ink-muted"
                          }`}
                        >
                          {p.isActive && <CheckIcon className="size-3" />}
                          {p.isActive ? "Live" : "Hidden"}
                        </button>
                      </form>

                      <form action={toggleProductFlag}>
                        <input type="hidden" name="id" value={p.id} />
                        <input type="hidden" name="field" value="isFeatured" />
                        <button
                          type="submit"
                          title={p.isFeatured ? "Featured — click to unfeature" : "Click to feature"}
                          aria-label="Toggle featured"
                          className={`grid size-7 place-items-center rounded-full transition-colors ${
                            p.isFeatured
                              ? "text-gold-500 hover:bg-gold-50"
                              : "text-cream-300 hover:bg-cream-200 hover:text-gold-400"
                          }`}
                        >
                          <StarIcon filled={p.isFeatured} className="size-4" />
                        </button>
                      </form>
                    </div>
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={`/admin/products/${p.id}`}
                        className="btn btn-ghost btn-sm px-3"
                      >
                        Edit
                      </Link>
                      <form action={deleteProduct}>
                        <input type="hidden" name="id" value={p.id} />
                        <button
                          type="submit"
                          title={
                            p._count.orderItems > 0
                              ? "Has orders — will be hidden instead of deleted"
                              : "Delete product"
                          }
                          aria-label={`Delete ${p.name}`}
                          className="grid size-8 place-items-center rounded-full text-ink-muted transition-colors hover:bg-maroon-50 hover:text-maroon-700"
                        >
                          <TrashIcon className="size-4" />
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
