import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatPaise } from "@/lib/money";
import {
  formatDate,
  relativeDays,
  STATUS_LABELS,
  STATUS_STYLES,
  type OrderStatus,
} from "@/lib/utils";
import { RupeeIcon, PackageIcon, UsersIcon, GridIcon, ChevronRight } from "@/components/icons";

export const metadata = { title: "Dashboard" };

/** Revenue counts everything except cancelled orders — COD is collected on delivery. */
const REVENUE_FILTER = { status: { not: "CANCELLED" } } as const;

export default async function AdminDashboard() {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const sevenDaysAgo = new Date(startOfToday);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

  const [
    revenueAgg,
    todayAgg,
    orderCount,
    pendingCount,
    customerCount,
    productCount,
    lowStock,
    recentOrders,
    statusCounts,
    weekOrders,
    topProducts,
  ] = await Promise.all([
    prisma.order.aggregate({ where: REVENUE_FILTER, _sum: { total: true } }),
    prisma.order.aggregate({
      where: { ...REVENUE_FILTER, placedAt: { gte: startOfToday } },
      _sum: { total: true },
      _count: true,
    }),
    prisma.order.count(),
    prisma.order.count({ where: { status: "PENDING" } }),
    prisma.customer.count(),
    prisma.product.count({ where: { isActive: true } }),
    prisma.product.findMany({
      where: { isActive: true, inventory: { lte: 5 } },
      orderBy: { inventory: "asc" },
      take: 6,
      select: { id: true, name: true, inventory: true, slug: true },
    }),
    prisma.order.findMany({
      orderBy: { placedAt: "desc" },
      take: 6,
      include: { items: { select: { id: true } } },
    }),
    prisma.order.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.order.findMany({
      where: { ...REVENUE_FILTER, placedAt: { gte: sevenDaysAgo } },
      select: { placedAt: true, total: true },
    }),
    prisma.orderItem.groupBy({
      by: ["productId", "nameSnapshot"],
      _sum: { quantity: true, lineTotal: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 5,
    }),
  ]);

  const totalRevenue = revenueAgg._sum.total ?? 0;
  const avgOrder = orderCount > 0 ? Math.round(totalRevenue / orderCount) : 0;

  // Bucket the last 7 days for the sparkline.
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(sevenDaysAgo);
    d.setDate(d.getDate() + i);
    return { date: d, total: 0 };
  });
  for (const o of weekOrders) {
    const idx = Math.floor((o.placedAt.getTime() - sevenDaysAgo.getTime()) / 86_400_000);
    if (idx >= 0 && idx < 7) days[idx].total += o.total;
  }
  const peak = Math.max(1, ...days.map((d) => d.total));

  const statusMap = Object.fromEntries(statusCounts.map((s) => [s.status, s._count._all]));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl font-bold sm:text-3xl">Dashboard</h1>
        <p className="mt-1 text-sm text-ink-muted">
          {formatDate(now)} · {pendingCount} order{pendingCount === 1 ? "" : "s"} waiting to be
          packed
        </p>
      </header>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          label="Total revenue"
          value={formatPaise(totalRevenue)}
          hint={`${formatPaise(avgOrder)} average order`}
          Icon={RupeeIcon}
        />
        <Kpi
          label="Today"
          value={formatPaise(todayAgg._sum.total ?? 0)}
          hint={`${todayAgg._count} order${todayAgg._count === 1 ? "" : "s"} today`}
          Icon={PackageIcon}
        />
        <Kpi
          label="Orders"
          value={String(orderCount)}
          hint={`${pendingCount} pending`}
          Icon={PackageIcon}
        />
        <Kpi
          label="Customers"
          value={String(customerCount)}
          hint={`${productCount} live products`}
          Icon={UsersIcon}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        {/* Revenue chart */}
        <section className="card p-5 xl:col-span-2">
          <div className="flex items-baseline justify-between">
            <h2 className="font-bold">Last 7 days</h2>
            <span className="text-xs text-ink-muted">
              {formatPaise(days.reduce((s, d) => s + d.total, 0))} total
            </span>
          </div>

          <div className="mt-6 flex h-44 items-end gap-2">
            {days.map((d) => (
              <div key={d.date.toISOString()} className="group flex flex-1 flex-col items-center gap-2">
                <span className="text-[0.625rem] font-semibold text-ink-muted opacity-0 transition-opacity group-hover:opacity-100">
                  {d.total > 0 ? formatPaise(d.total) : "—"}
                </span>
                <div
                  className="w-full rounded-t-lg bg-gradient-to-t from-maroon-700 to-maroon-500 transition-all"
                  style={{ height: `${Math.max(3, (d.total / peak) * 100)}%` }}
                />
                <span className="text-[0.625rem] text-ink-muted">
                  {d.date.toLocaleDateString("en-IN", { weekday: "short" })}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Status breakdown */}
        <section className="card p-5">
          <h2 className="font-bold">Order pipeline</h2>
          <ul className="mt-4 space-y-2.5">
            {(["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"] as OrderStatus[]).map(
              (s) => {
                const n = statusMap[s] ?? 0;
                const pct = orderCount > 0 ? (n / orderCount) * 100 : 0;
                return (
                  <li key={s}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-ink-soft">{STATUS_LABELS[s]}</span>
                      <span className="font-semibold tabular-nums">{n}</span>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-cream-200">
                      <div
                        className="h-full rounded-full bg-maroon-600 transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </li>
                );
              },
            )}
          </ul>
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        {/* Recent orders */}
        <section className="card overflow-hidden xl:col-span-2">
          <div className="flex items-center justify-between border-b border-cream-300 px-5 py-4">
            <h2 className="font-bold">Recent orders</h2>
            <Link
              href="/admin/orders"
              className="flex items-center gap-1 text-xs font-semibold text-maroon-700 hover:text-maroon-900"
            >
              View all <ChevronRight className="size-3.5" />
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <p className="px-5 py-12 text-center text-sm text-ink-muted">No orders yet.</p>
          ) : (
            <ul className="divide-y divide-cream-300">
              {recentOrders.map((o) => (
                <li key={o.id}>
                  <Link
                    href={`/admin/orders/${o.id}`}
                    className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-cream-50"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{o.contactName}</p>
                      <p className="mt-0.5 text-xs text-ink-muted">
                        {o.orderNumber} · {o.items.length} item{o.items.length === 1 ? "" : "s"} ·{" "}
                        {relativeDays(o.placedAt)}
                      </p>
                    </div>
                    <span
                      className={`chip shrink-0 ${STATUS_STYLES[o.status as OrderStatus] ?? ""}`}
                    >
                      {STATUS_LABELS[o.status as OrderStatus] ?? o.status}
                    </span>
                    <span className="w-20 shrink-0 text-right text-sm font-bold tabular-nums">
                      {formatPaise(o.total)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="space-y-6">
          {/* Low stock */}
          <section className="card p-5">
            <h2 className="font-bold">Running low</h2>
            {lowStock.length === 0 ? (
              <p className="mt-4 text-sm text-ink-muted">
                Everything is well stocked. Nice.
              </p>
            ) : (
              <ul className="mt-4 space-y-2.5">
                {lowStock.map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-3 text-sm">
                    <Link
                      href={`/admin/products/${p.id}`}
                      className="min-w-0 flex-1 truncate hover:text-maroon-700"
                    >
                      {p.name}
                    </Link>
                    <span
                      className={`chip shrink-0 ${
                        p.inventory === 0
                          ? "bg-maroon-100 text-maroon-800"
                          : "bg-gold-100 text-gold-800"
                      }`}
                    >
                      {p.inventory === 0 ? "Out" : `${p.inventory} left`}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Best sellers */}
          <section className="card p-5">
            <h2 className="font-bold">Best sellers</h2>
            {topProducts.length === 0 ? (
              <p className="mt-4 text-sm text-ink-muted">No sales data yet.</p>
            ) : (
              <ol className="mt-4 space-y-3">
                {topProducts.map((p, i) => (
                  <li key={p.productId} className="flex items-center gap-3">
                    <span className="grid size-6 shrink-0 place-items-center rounded-full bg-cream-200 text-xs font-bold text-ink-soft">
                      {i + 1}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm">{p.nameSnapshot}</span>
                    <span className="shrink-0 text-xs font-semibold text-ink-muted tabular-nums">
                      {p._sum.quantity} sold
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function Kpi({
  label,
  value,
  hint,
  Icon,
}: {
  label: string;
  value: string;
  hint: string;
  Icon: (p: React.SVGProps<SVGSVGElement>) => React.ReactElement;
}) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <p className="text-xs font-semibold tracking-wide text-ink-muted uppercase">{label}</p>
        <span className="grid size-8 place-items-center rounded-full bg-maroon-50 text-maroon-700">
          <Icon className="size-4" />
        </span>
      </div>
      <p className="mt-3 font-display text-2xl font-bold text-ink">{value}</p>
      <p className="mt-1 text-xs text-ink-muted">{hint}</p>
    </div>
  );
}
