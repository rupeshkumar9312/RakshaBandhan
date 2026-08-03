import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatPaise } from "@/lib/money";
import { formatDate } from "@/lib/utils";
import { UsersIcon, PhoneIcon, ChevronRight } from "@/components/icons";
import type { Prisma } from "@prisma/client";

export const metadata = { title: "Customers" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function AdminCustomersPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim() : undefined;

  const where: Prisma.CustomerWhereInput = q
    ? { OR: [{ name: { contains: q } }, { phone: { contains: q } }, { email: { contains: q } }] }
    : {};

  const customers = await prisma.customer.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      orders: { select: { total: true, status: true, placedAt: true } },
    },
  });

  // Lifetime value excludes cancelled orders.
  const rows = customers
    .map((c) => {
      const live = c.orders.filter((o) => o.status !== "CANCELLED");
      return {
        ...c,
        orderCount: live.length,
        lifetimeValue: live.reduce((s, o) => s + o.total, 0),
        lastOrder: c.orders.reduce<Date | null>(
          (latest, o) => (!latest || o.placedAt > latest ? o.placedAt : latest),
          null,
        ),
      };
    })
    .sort((a, b) => b.lifetimeValue - a.lifetimeValue);

  const totalLtv = rows.reduce((s, r) => s + r.lifetimeValue, 0);
  const repeat = rows.filter((r) => r.orderCount > 1).length;

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold sm:text-3xl">Customers</h1>
          <p className="mt-1 text-sm text-ink-muted">
            {rows.length} customer{rows.length === 1 ? "" : "s"} · {repeat} repeat ·{" "}
            {formatPaise(totalLtv)} lifetime value
          </p>
        </div>

        <form action="/admin/customers" className="flex gap-2">
          <input
            name="q"
            defaultValue={q ?? ""}
            placeholder="Name, phone or email"
            aria-label="Search customers"
            className="field py-2.5 text-sm sm:w-64"
          />
          <button type="submit" className="btn btn-primary btn-sm">
            Search
          </button>
        </form>
      </header>

      {rows.length === 0 ? (
        <div className="card flex flex-col items-center gap-3 px-6 py-20 text-center">
          <div className="grid size-14 place-items-center rounded-full bg-cream-200">
            <UsersIcon className="size-6 text-ink-muted" />
          </div>
          <p className="font-semibold">No customers yet</p>
          <p className="max-w-xs text-sm text-ink-muted">
            Customer records are created automatically when someone places an order.
          </p>
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[40rem] text-sm">
            <thead className="border-b border-cream-300 bg-cream-50 text-left">
              <tr>
                <th className="px-4 py-3 text-xs font-semibold tracking-wide text-ink-muted uppercase">
                  Customer
                </th>
                <th className="px-4 py-3 text-xs font-semibold tracking-wide text-ink-muted uppercase">
                  Contact
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold tracking-wide text-ink-muted uppercase">
                  Orders
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold tracking-wide text-ink-muted uppercase">
                  Lifetime value
                </th>
                <th className="px-4 py-3 text-xs font-semibold tracking-wide text-ink-muted uppercase">
                  Last order
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-300">
              {rows.map((c) => (
                <tr key={c.id} className="transition-colors hover:bg-cream-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-maroon-100 text-sm font-bold text-maroon-800">
                        {c.name.charAt(0).toUpperCase()}
                      </span>
                      <div className="min-w-0">
                        <Link
                          href={`/admin/customers/${c.id}`}
                          className="block truncate font-medium hover:text-maroon-700"
                        >
                          {c.name}
                        </Link>
                        {c.orderCount > 1 && (
                          <span className="chip mt-0.5 bg-gold-100 px-2 py-0 text-[0.625rem] text-gold-800">
                            Repeat
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-3">
                    <a
                      href={`tel:+91${c.phone}`}
                      className="flex items-center gap-1.5 text-ink-soft hover:text-maroon-700"
                    >
                      <PhoneIcon className="size-3.5" /> +91 {c.phone}
                    </a>
                    {c.email && (
                      <p className="mt-0.5 truncate text-xs text-ink-muted">{c.email}</p>
                    )}
                  </td>

                  <td className="px-4 py-3 text-right font-semibold tabular-nums">
                    {c.orderCount}
                  </td>

                  <td className="px-4 py-3 text-right font-bold tabular-nums text-maroon-800">
                    {formatPaise(c.lifetimeValue)}
                  </td>

                  <td className="px-4 py-3 text-xs text-ink-muted">
                    {c.lastOrder ? formatDate(c.lastOrder) : "—"}
                  </td>

                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/customers/${c.id}`}
                      aria-label={`Open ${c.name}`}
                      className="inline-grid size-8 place-items-center rounded-full text-ink-muted hover:bg-cream-200 hover:text-maroon-700"
                    >
                      <ChevronRight className="size-4" />
                    </Link>
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
