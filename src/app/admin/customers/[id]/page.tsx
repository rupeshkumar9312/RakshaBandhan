import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { formatPaise } from "@/lib/money";
import { formatDate, STATUS_LABELS, STATUS_STYLES, type OrderStatus } from "@/lib/utils";
import { ChevronLeft, PhoneIcon, MailIcon, WhatsAppIcon } from "@/components/icons";

type Params = Promise<{ id: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  const { id } = await params;
  const customer = await prisma.customer.findUnique({ where: { id }, select: { name: true } });
  return { title: customer ? customer.name : "Customer" };
}

export default async function AdminCustomerDetail({ params }: { params: Params }) {
  const { id } = await params;

  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      orders: {
        orderBy: { placedAt: "desc" },
        include: { items: { select: { id: true, quantity: true, nameSnapshot: true } } },
      },
    },
  });

  if (!customer) notFound();

  const live = customer.orders.filter((o) => o.status !== "CANCELLED");
  const ltv = live.reduce((s, o) => s + o.total, 0);
  const avg = live.length > 0 ? Math.round(ltv / live.length) : 0;

  // What they buy most, across all their orders.
  const productTally = new Map<string, number>();
  for (const order of customer.orders) {
    for (const item of order.items) {
      productTally.set(item.nameSnapshot, (productTally.get(item.nameSnapshot) ?? 0) + item.quantity);
    }
  }
  const favourites = [...productTally.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);

  return (
    <div className="space-y-5">
      <Link
        href="/admin/customers"
        className="inline-flex items-center gap-1 text-sm text-ink-muted hover:text-maroon-700"
      >
        <ChevronLeft className="size-4" /> All customers
      </Link>

      <header className="flex flex-wrap items-center gap-4">
        <span className="grid size-14 place-items-center rounded-full bg-maroon-100 text-xl font-bold text-maroon-800">
          {customer.name.charAt(0).toUpperCase()}
        </span>
        <div>
          <h1 className="font-display text-2xl font-bold sm:text-3xl">{customer.name}</h1>
          <p className="mt-0.5 text-sm text-ink-muted">
            Customer since {formatDate(customer.createdAt)}
          </p>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Lifetime value", value: formatPaise(ltv) },
          { label: "Orders placed", value: String(live.length) },
          { label: "Average order", value: formatPaise(avg) },
        ].map((s) => (
          <div key={s.label} className="card p-5">
            <p className="text-xs font-semibold tracking-wide text-ink-muted uppercase">
              {s.label}
            </p>
            <p className="mt-2 font-display text-2xl font-bold">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_18rem]">
        <section className="card overflow-hidden">
          <h2 className="border-b border-cream-300 px-5 py-4 font-bold">Order history</h2>

          {customer.orders.length === 0 ? (
            <p className="px-5 py-12 text-center text-sm text-ink-muted">No orders yet.</p>
          ) : (
            <ul className="divide-y divide-cream-300">
              {customer.orders.map((o) => (
                <li key={o.id}>
                  <Link
                    href={`/admin/orders/${o.id}`}
                    className="flex items-center gap-3 px-5 py-4 transition-colors hover:bg-cream-50"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-xs font-semibold text-maroon-700">
                        {o.orderNumber}
                      </p>
                      <p className="mt-1 truncate text-sm text-ink-soft">
                        {o.items.map((i) => i.nameSnapshot).join(", ")}
                      </p>
                      <p className="mt-0.5 text-xs text-ink-muted">
                        {formatDate(o.placedAt, true)}
                      </p>
                    </div>
                    <span className={`chip shrink-0 ${STATUS_STYLES[o.status as OrderStatus] ?? ""}`}>
                      {STATUS_LABELS[o.status as OrderStatus] ?? o.status}
                    </span>
                    <span className="w-20 shrink-0 text-right font-bold tabular-nums">
                      {formatPaise(o.total)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <aside className="space-y-5">
          <section className="card p-5">
            <h2 className="font-bold">Contact</h2>
            <div className="mt-4 space-y-2">
              <a href={`tel:+91${customer.phone}`} className="btn btn-outline btn-sm w-full">
                <PhoneIcon className="size-4" /> +91 {customer.phone}
              </a>
              <a
                href={`https://wa.me/91${customer.phone}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline btn-sm w-full"
              >
                <WhatsAppIcon className="size-4" /> WhatsApp
              </a>
              {customer.email && (
                <a href={`mailto:${customer.email}`} className="btn btn-ghost btn-sm w-full">
                  <MailIcon className="size-4" />
                  <span className="truncate">{customer.email}</span>
                </a>
              )}
            </div>
          </section>

          {favourites.length > 0 && (
            <section className="card p-5">
              <h2 className="font-bold">Buys most</h2>
              <ol className="mt-4 space-y-2.5">
                {favourites.map(([name, qty]) => (
                  <li key={name} className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="min-w-0 flex-1 truncate text-ink-soft">{name}</span>
                    <span className="shrink-0 text-xs font-semibold text-ink-muted tabular-nums">
                      ×{qty}
                    </span>
                  </li>
                ))}
              </ol>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}
