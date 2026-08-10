import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatPaise } from "@/lib/money";
import {
  formatDate,
  ORDER_STATUSES,
  STATUS_LABELS,
  STATUS_STYLES,
  type OrderStatus,
} from "@/lib/utils";
import { OrderStatusSelect } from "@/components/admin/order-status-select";
import { PackageIcon, ChevronRight } from "@/components/icons";
import type { Prisma } from "@prisma/client";

export const metadata = { title: "Orders" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const PER_PAGE = 20;

export default async function AdminOrdersPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const status = typeof sp.status === "string" ? sp.status : undefined;
  const q = typeof sp.q === "string" ? sp.q.trim() : undefined;
  const page = Math.max(1, Number(sp.page) || 1);

  const where: Prisma.OrderWhereInput = {};
  if (status && ORDER_STATUSES.includes(status as OrderStatus)) where.status = status;
  if (q) {
    where.OR = [
      { orderNumber: { contains: q.toUpperCase() } },
      { contactName: { contains: q } },
      { contactPhone: { contains: q } },
    ];
  }

  const [orders, total, counts] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { placedAt: "desc" },
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
      include: { items: { select: { id: true, quantity: true } } },
    }),
    prisma.order.count({ where }),
    prisma.order.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);

  const countMap = Object.fromEntries(counts.map((c) => [c.status, c._count._all]));
  const allCount = counts.reduce((s, c) => s + c._count._all, 0);
  const pageCount = Math.max(1, Math.ceil(total / PER_PAGE));

  const tabHref = (s?: string) => {
    const p = new URLSearchParams();
    if (s) p.set("status", s);
    if (q) p.set("q", q);
    const qs = p.toString();
    return qs ? `/admin/orders?${qs}` : "/admin/orders";
  };

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold sm:text-3xl">Orders</h1>
          <p className="mt-1 text-sm text-ink-muted">
            {total} order{total === 1 ? "" : "s"}
            {status ? ` · ${STATUS_LABELS[status as OrderStatus]}` : ""}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <form action="/admin/orders" className="flex gap-2">
            {status && <input type="hidden" name="status" value={status} />}
            <input
              name="q"
              defaultValue={q ?? ""}
              placeholder="Order no, name or phone"
              aria-label="Search orders"
              className="field py-2.5 text-sm sm:w-64"
            />
            <button type="submit" className="btn btn-outline btn-sm">
              Search
            </button>
          </form>
          <Link href="/admin/orders/new" className="btn btn-primary btn-sm">
            New order
          </Link>
        </div>
      </header>

      {/* Status tabs */}
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
        <Link
          href={tabHref()}
          className={`chip shrink-0 border transition-colors ${
            !status
              ? "border-maroon-700 bg-maroon-700 text-cream-50"
              : "border-cream-300 bg-white text-ink-soft hover:border-maroon-300"
          }`}
        >
          All <span className="opacity-60">{allCount}</span>
        </Link>
        {ORDER_STATUSES.map((s) => (
          <Link
            key={s}
            href={tabHref(s)}
            className={`chip shrink-0 border transition-colors ${
              status === s
                ? "border-maroon-700 bg-maroon-700 text-cream-50"
                : "border-cream-300 bg-white text-ink-soft hover:border-maroon-300"
            }`}
          >
            {STATUS_LABELS[s]} <span className="opacity-60">{countMap[s] ?? 0}</span>
          </Link>
        ))}
      </div>

      {orders.length === 0 ? (
        <div className="card flex flex-col items-center gap-3 px-6 py-20 text-center">
          <div className="grid size-14 place-items-center rounded-full bg-cream-200">
            <PackageIcon className="size-6 text-ink-muted" />
          </div>
          <p className="font-semibold">No orders here</p>
          <p className="max-w-xs text-sm text-ink-muted">
            {q || status
              ? "Try clearing the filter or search."
              : "Orders will appear as soon as customers start buying."}
          </p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="card hidden overflow-hidden lg:block">
            <table className="w-full text-sm">
              <thead className="border-b border-cream-300 bg-cream-50 text-left">
                <tr>
                  <Th>Order</Th>
                  <Th>Customer</Th>
                  <Th>Placed</Th>
                  <Th className="text-right">Total</Th>
                  <Th>Status</Th>
                  <Th />
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-300">
                {orders.map((o) => (
                  <tr key={o.id} className="transition-colors hover:bg-cream-50">
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/orders/${o.id}`}
                        className="font-mono text-xs font-semibold text-maroon-700 hover:underline"
                      >
                        {o.orderNumber}
                      </Link>
                      <p className="mt-0.5 text-xs text-ink-muted">
                        {o.items.reduce((s, i) => s + i.quantity, 0)} item
                        {o.items.reduce((s, i) => s + i.quantity, 0) === 1 ? "" : "s"}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{o.contactName}</p>
                      <p className="text-xs text-ink-muted">+91 {o.contactPhone}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-ink-muted">
                      {formatDate(o.placedAt, true)}
                    </td>
                    <td className="px-4 py-3 text-right font-bold tabular-nums">
                      {formatPaise(o.total)}
                    </td>
                    <td className="px-4 py-3">
                      <OrderStatusSelect id={o.id} status={o.status as OrderStatus} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/orders/${o.id}`}
                        aria-label={`Open ${o.orderNumber}`}
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

          {/* Mobile cards */}
          <ul className="space-y-3 lg:hidden">
            {orders.map((o) => (
              <li key={o.id} className="card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link
                      href={`/admin/orders/${o.id}`}
                      className="font-mono text-xs font-semibold text-maroon-700"
                    >
                      {o.orderNumber}
                    </Link>
                    <p className="mt-1 truncate font-semibold">{o.contactName}</p>
                    <p className="text-xs text-ink-muted">+91 {o.contactPhone}</p>
                  </div>
                  <span className={`chip shrink-0 ${STATUS_STYLES[o.status as OrderStatus] ?? ""}`}>
                    {STATUS_LABELS[o.status as OrderStatus] ?? o.status}
                  </span>
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-cream-300 pt-3">
                  <span className="text-xs text-ink-muted">{formatDate(o.placedAt)}</span>
                  <span className="font-bold tabular-nums">{formatPaise(o.total)}</span>
                </div>

                <div className="mt-3">
                  <OrderStatusSelect id={o.id} status={o.status as OrderStatus} />
                </div>
              </li>
            ))}
          </ul>

          {pageCount > 1 && (
            <nav className="flex justify-center gap-1.5 pt-2">
              {Array.from({ length: pageCount }, (_, i) => i + 1).map((p) => {
                const params = new URLSearchParams();
                if (status) params.set("status", status);
                if (q) params.set("q", q);
                if (p > 1) params.set("page", String(p));
                const qs = params.toString();
                return (
                  <Link
                    key={p}
                    href={qs ? `/admin/orders?${qs}` : "/admin/orders"}
                    className={
                      p === page
                        ? "grid size-9 place-items-center rounded-full bg-maroon-700 text-sm font-bold text-cream-50"
                        : "grid size-9 place-items-center rounded-full border border-cream-300 bg-white text-sm text-ink-soft hover:border-maroon-300"
                    }
                  >
                    {p}
                  </Link>
                );
              })}
            </nav>
          )}
        </>
      )}
    </div>
  );
}

function Th({ children, className = "" }: { children?: React.ReactNode; className?: string }) {
  return (
    <th className={`px-4 py-3 text-xs font-semibold tracking-wide text-ink-muted uppercase ${className}`}>
      {children}
    </th>
  );
}
