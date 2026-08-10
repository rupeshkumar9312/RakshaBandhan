import Link from "next/link";
import { prisma } from "@/lib/db";
import { deleteSociety } from "@/app/actions/admin";
import { BuildingIcon, PlusIcon, TrashIcon } from "@/components/icons";

export const metadata = { title: "Societies" };

export default async function AdminSocietiesPage() {
  const societies = await prisma.society.findMany({ orderBy: { sortOrder: "asc" } });

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold sm:text-3xl">Societies</h1>
          <p className="mt-1 text-sm text-ink-muted">
            {societies.length} societ{societies.length === 1 ? "y" : "ies"} · shown as the
            delivery dropdown at checkout
          </p>
        </div>

        <Link href="/admin/societies/new" className="btn btn-primary btn-sm">
          <PlusIcon className="size-4" /> New society
        </Link>
      </header>

      {societies.length === 0 ? (
        <div className="card flex flex-col items-center gap-3 px-6 py-20 text-center">
          <div className="grid size-14 place-items-center rounded-full bg-cream-200">
            <BuildingIcon className="size-6 text-ink-muted" />
          </div>
          <p className="font-semibold">No societies yet</p>
          <p className="max-w-xs text-sm text-ink-muted">
            Checkout will show a "contact support" message until at least one is added.
          </p>
          <Link href="/admin/societies/new" className="btn btn-primary btn-sm mt-2">
            Create your first society
          </Link>
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
                  Sort order
                </th>
                <th className="px-4 py-3 text-xs font-semibold tracking-wide text-ink-muted uppercase">
                  Status
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-300">
              {societies.map((s) => (
                <tr key={s.id} className="transition-colors hover:bg-cream-50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/societies/${s.id}`}
                      className="font-medium hover:text-maroon-700"
                    >
                      {s.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 tabular-nums text-ink-muted">{s.sortOrder}</td>
                  <td className="px-4 py-3">
                    {s.isActive ? (
                      <span className="chip bg-emerald-100 text-emerald-800">Active</span>
                    ) : (
                      <span className="chip bg-ink/80 text-cream-50">Hidden</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <form action={deleteSociety} className="inline">
                      <input type="hidden" name="id" value={s.id} />
                      <button
                        type="submit"
                        aria-label={`Delete ${s.name}`}
                        className="grid size-8 place-items-center rounded-full text-ink-muted transition-colors hover:bg-maroon-50 hover:text-maroon-700"
                      >
                        <TrashIcon className="size-4" />
                      </button>
                    </form>
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
