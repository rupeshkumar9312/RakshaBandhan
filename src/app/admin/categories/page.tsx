import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { deleteCategory } from "@/app/actions/admin";
import { TagIcon, PlusIcon, TrashIcon } from "@/components/icons";

export const metadata = { title: "Categories" };

export default async function AdminCategoriesPage() {
  const categories = await prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { products: true } } },
  });

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold sm:text-3xl">Categories</h1>
          <p className="mt-1 text-sm text-ink-muted">
            {categories.length} categor{categories.length === 1 ? "y" : "ies"} · banner images
            shown on the homepage
          </p>
        </div>

        <Link href="/admin/categories/new" className="btn btn-primary btn-sm">
          <PlusIcon className="size-4" /> New category
        </Link>
      </header>

      {categories.length === 0 ? (
        <div className="card flex flex-col items-center gap-3 px-6 py-20 text-center">
          <div className="grid size-14 place-items-center rounded-full bg-cream-200">
            <TagIcon className="size-6 text-ink-muted" />
          </div>
          <p className="font-semibold">No categories yet</p>
          <Link href="/admin/categories/new" className="btn btn-primary btn-sm mt-2">
            Create your first category
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((c) => (
            <div key={c.id} className="card group overflow-hidden">
              <Link
                href={`/admin/categories/${c.id}`}
                className="relative block aspect-3/2 overflow-hidden bg-cream-200"
              >
                {c.imageUrl && (
                  <Image
                    src={c.imageUrl}
                    alt={c.name}
                    fill
                    sizes="(max-width: 640px) 100vw, 33vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                )}
                {!c.isActive && (
                  <span className="absolute left-2.5 top-2.5 chip bg-ink/80 text-cream-50">
                    Hidden
                  </span>
                )}
              </Link>

              <div className="flex items-start justify-between gap-2 p-4">
                <div className="min-w-0">
                  <Link
                    href={`/admin/categories/${c.id}`}
                    className="block truncate font-semibold hover:text-maroon-700"
                  >
                    {c.name}
                  </Link>
                  <p className="mt-0.5 text-xs text-ink-muted">
                    {c._count.products} product{c._count.products === 1 ? "" : "s"} · sort{" "}
                    {c.sortOrder}
                  </p>
                </div>

                <form action={deleteCategory}>
                  <input type="hidden" name="id" value={c.id} />
                  <button
                    type="submit"
                    aria-label={`Delete ${c.name}`}
                    title={
                      c._count.products > 0
                        ? "Has products — will be hidden instead of deleted"
                        : "Delete"
                    }
                    className="grid size-8 shrink-0 place-items-center rounded-full text-ink-muted transition-colors hover:bg-maroon-50 hover:text-maroon-700"
                  >
                    <TrashIcon className="size-4" />
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}