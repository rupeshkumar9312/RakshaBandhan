import { prisma } from "@/lib/db";
import { CategoryForm } from "@/components/admin/category-form";
import { TagIcon } from "@/components/icons";

export const metadata = { title: "Categories" };

export default async function AdminCategoriesPage() {
  const categories = await prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { products: true } } },
  });

  return (
    <div className="space-y-5">
      <header>
        <h1 className="font-display text-2xl font-bold sm:text-3xl">Categories</h1>
        <p className="mt-1 text-sm text-ink-muted">
          {categories.length} categor{categories.length === 1 ? "y" : "ies"} · products need a
          category before they can be added
        </p>
      </header>

      <div className="card p-5">
        <CategoryForm />
      </div>

      {categories.length === 0 ? (
        <div className="card flex flex-col items-center gap-3 px-6 py-20 text-center">
          <div className="grid size-14 place-items-center rounded-full bg-cream-200">
            <TagIcon className="size-6 text-ink-muted" />
          </div>
          <p className="font-semibold">No categories yet</p>
          <p className="max-w-xs text-sm text-ink-muted">
            Add one above — you&apos;ll need at least one before you can create a product.
          </p>
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[30rem] text-sm">
            <thead className="border-b border-cream-300 bg-cream-50 text-left">
              <tr>
                <th className="px-4 py-3 text-xs font-semibold tracking-wide text-ink-muted uppercase">
                  Name
                </th>
                <th className="px-4 py-3 text-xs font-semibold tracking-wide text-ink-muted uppercase">
                  Description
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold tracking-wide text-ink-muted uppercase">
                  Products
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-300">
              {categories.map((c) => (
                <tr key={c.id}>
                  <td className="px-4 py-3 font-medium">{c.name}</td>
                  <td className="px-4 py-3 text-ink-muted">{c.description ?? "—"}</td>
                  <td className="px-4 py-3 text-right font-semibold tabular-nums">
                    {c._count.products}
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
