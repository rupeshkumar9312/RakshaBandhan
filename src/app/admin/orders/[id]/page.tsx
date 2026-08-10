import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { formatPaise } from "@/lib/money";
import {
  formatDate,
  STATUS_LABELS,
  STATUS_STYLES,
  type OrderStatus,
} from "@/lib/utils";
import { OrderStatusSelect } from "@/components/admin/order-status-select";
import { OrderNoteForm } from "@/components/admin/order-note-form";
import { PrintButton } from "@/components/admin/print-button";
import { SITE } from "@/lib/site";
import { ChevronLeft, PhoneIcon, WhatsAppIcon, MailIcon } from "@/components/icons";

type Params = Promise<{ id: string }>;

/** What we WhatsApp the customer for each status — kept in sync with OrderStatus. */
function buildStatusMessage(
  order: { contactName: string; orderNumber: string; total: number; status: string },
  trackingUrl: string,
): string {
  const hello = `Hello ${order.contactName}, this is ${SITE.name}.`;
  const amount = formatPaise(order.total);

  switch (order.status as OrderStatus) {
    case "PENDING":
      return `${hello} We've received your order ${order.orderNumber} (${amount}, Cash on Delivery) and it's being prepared. Track it here: ${trackingUrl}`;
    case "PROCESSING":
      return `${hello} Your order ${order.orderNumber} is being packed and will be shipped soon. Track it here: ${trackingUrl}`;
    case "SHIPPED":
      return `${hello} Your order ${order.orderNumber} (${amount}, Cash on Delivery) is out for delivery today! Track it here: ${trackingUrl}`;
    case "DELIVERED":
      return `${hello} Your order ${order.orderNumber} has been delivered. Thank you for shopping with us! 🙏`;
    case "CANCELLED":
      return `${hello} Your order ${order.orderNumber} has been cancelled. If this wasn't expected, please reply here or give us a call. Details: ${trackingUrl}`;
    default:
      return `${hello} Your order ${order.orderNumber} status: ${STATUS_LABELS[order.status as OrderStatus] ?? order.status}. Track it here: ${trackingUrl}`;
  }
}

export async function generateMetadata({ params }: { params: Params }) {
  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    select: { orderNumber: true },
  });
  return { title: order ? `Order ${order.orderNumber}` : "Order" };
}

export default async function AdminOrderDetail({ params }: { params: Params }) {
  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true, customer: { include: { _count: { select: { orders: true } } } } },
  });

  if (!order) notFound();

  const tel = order.contactPhone;
  const trackingUrl = `${SITE.url}/order/${order.publicToken}`;
  const waText = encodeURIComponent(buildStatusMessage(order, trackingUrl));

  const timeline = [
    { label: "Placed", at: order.placedAt },
    { label: "Confirmed", at: order.confirmedAt },
    { label: "Out for delivery", at: order.shippedAt },
    { label: "Delivered", at: order.deliveredAt },
    { label: "Cancelled", at: order.cancelledAt },
  ].filter((t) => t.at);

  return (
    <div className="space-y-5">
      {/* Screen-only header */}
      <div className="print:hidden">
        <Link
          href="/admin/orders"
          className="inline-flex items-center gap-1 text-sm text-ink-muted hover:text-maroon-700"
        >
          <ChevronLeft className="size-4" /> All orders
        </Link>

        <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold sm:text-3xl">{order.orderNumber}</h1>
            <p className="mt-1 text-sm text-ink-muted">
              Placed {formatDate(order.placedAt, true)} ·{" "}
              <span className="font-semibold text-maroon-700">{order.paymentMethod}</span> ·{" "}
              {order.paymentStatus === "PAID" ? "Payment collected" : "Payment pending"}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <OrderStatusSelect id={order.id} status={order.status as OrderStatus} />
            <PrintButton />
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_20rem]">
        {/* Invoice / packing slip — this block is what prints */}
        <div className="space-y-5">
          <section className="card p-6 print:border-0 print:shadow-none">
            {/* Print-only letterhead */}
            <div className="mb-6 hidden items-start justify-between border-b border-cream-300 pb-4 print:flex">
              <div>
                <p className="font-display text-xl font-bold">{SITE.name}</p>
                <p className="mt-0.5 text-xs text-ink-muted">{SITE.society}</p>
                <p className="text-xs text-ink-muted">
                  {SITE.phone} · {SITE.email}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs tracking-wider text-ink-muted uppercase">Invoice</p>
                <p className="font-mono text-sm font-bold">{order.orderNumber}</p>
                <p className="mt-0.5 text-xs text-ink-muted">{formatDate(order.placedAt)}</p>
              </div>
            </div>

            <div className="flex items-center justify-between print:hidden">
              <h2 className="font-bold">Items</h2>
              <span className={`chip ${STATUS_STYLES[order.status as OrderStatus] ?? ""}`}>
                {STATUS_LABELS[order.status as OrderStatus] ?? order.status}
              </span>
            </div>

            <ul className="mt-4 divide-y divide-cream-300">
              {order.items.map((item) => (
                <li key={item.id} className="flex items-center gap-3.5 py-3.5">
                  <div className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-cream-200 print:hidden">
                    {item.imageSnapshot && (
                      <Image
                        src={item.imageSnapshot}
                        alt=""
                        fill
                        sizes="56px"
                        className="object-cover"
                      />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{item.nameSnapshot}</p>
                    <p className="mt-0.5 text-xs text-ink-muted">
                      {formatPaise(item.unitPrice)} × {item.quantity}
                    </p>
                  </div>
                  <span className="text-sm font-semibold tabular-nums">
                    {formatPaise(item.lineTotal)}
                  </span>
                </li>
              ))}
            </ul>

            <dl className="mt-4 space-y-2 border-t border-cream-300 pt-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-ink-soft">Subtotal</dt>
                <dd className="font-semibold tabular-nums">{formatPaise(order.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-soft">Delivery</dt>
                <dd className="font-semibold tabular-nums">
                  {order.shippingFee === 0 ? "Free" : formatPaise(order.shippingFee)}
                </dd>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between">
                  <dt className="text-ink-soft">Discount</dt>
                  <dd className="font-semibold tabular-nums">−{formatPaise(order.discount)}</dd>
                </div>
              )}
              <div className="flex justify-between border-t border-cream-300 pt-2 text-base">
                <dt className="font-bold">
                  Total {order.paymentStatus === "PAID" ? "paid" : "to collect"}
                </dt>
                <dd className="font-bold tabular-nums text-maroon-800">
                  {formatPaise(order.total)}
                </dd>
              </div>
            </dl>

            {/* Print-only delivery block */}
            <div className="mt-6 hidden border-t border-cream-300 pt-4 print:block">
              <p className="text-xs tracking-wider text-ink-muted uppercase">Deliver to</p>
              <p className="mt-1 text-sm font-semibold">{order.contactName}</p>
              <p className="text-sm">+91 {order.contactPhone}</p>
              <p className="mt-1 text-sm">
                {[order.flat, order.tower, order.addressLine1, order.landmark]
                  .filter(Boolean)
                  .join(", ")}
                <br />
                {order.city}, {order.state} — {order.pincode}
              </p>
              {order.customerNote && (
                <p className="mt-2 text-xs">
                  <strong>Note:</strong> {order.customerNote}
                </p>
              )}
              <p className="mt-4 text-xs text-ink-muted">
                Payment method: {order.paymentMethod}. Please collect{" "}
                <strong>{formatPaise(order.total)}</strong> on delivery.
              </p>
            </div>
          </section>

          {timeline.length > 0 && (
            <section className="card p-6 print:hidden">
              <h2 className="font-bold">Timeline</h2>
              <ol className="mt-4 space-y-3">
                {timeline.map((t) => (
                  <li key={t.label} className="flex items-baseline gap-3 text-sm">
                    <span className="size-2 shrink-0 rounded-full bg-maroon-600" />
                    <span className="font-medium">{t.label}</span>
                    <span className="ml-auto text-xs text-ink-muted">
                      {formatDate(t.at!, true)}
                    </span>
                  </li>
                ))}
              </ol>
            </section>
          )}
        </div>

        {/* Sidebar */}
        <aside className="space-y-5 print:hidden">
          <section className="card p-5">
            <h2 className="font-bold">Customer</h2>
            <p className="mt-3 font-semibold">{order.contactName}</p>
            <p className="text-sm text-ink-muted">
              {order.customer._count.orders} order
              {order.customer._count.orders === 1 ? "" : "s"} placed
            </p>

            <div className="mt-4 space-y-2">
              <a href={`tel:+91${tel}`} className="btn btn-outline btn-sm w-full">
                <PhoneIcon className="size-4" /> +91 {tel}
              </a>
              <a
                href={`https://wa.me/91${tel}?text=${waText}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline btn-sm w-full"
              >
                <WhatsAppIcon className="size-4" /> WhatsApp update
              </a>
              {order.contactEmail && (
                <a href={`mailto:${order.contactEmail}`} className="btn btn-ghost btn-sm w-full">
                  <MailIcon className="size-4" /> {order.contactEmail}
                </a>
              )}
            </div>

            <Link
              href={`/admin/customers/${order.customerId}`}
              className="mt-3 block text-center text-xs font-semibold text-maroon-700 hover:underline"
            >
              View customer history
            </Link>
          </section>

          <section className="card p-5">
            <h2 className="font-bold">Delivery address</h2>
            <address className="mt-3 text-sm not-italic leading-relaxed text-ink-soft">
              {[order.flat, order.tower].filter(Boolean).join(", ")}
              {(order.flat || order.tower) && <br />}
              {order.addressLine1}
              <br />
              {order.addressLine2 && (
                <>
                  {order.addressLine2}
                  <br />
                </>
              )}
              {order.landmark && (
                <>
                  {order.landmark}
                  <br />
                </>
              )}
              {order.city}, {order.state}
              <br />
              {order.pincode}
            </address>

            {order.customerNote && (
              <div className="mt-4 rounded-lg bg-gold-50 px-3 py-2.5">
                <p className="text-xs font-semibold text-gold-800">Customer note</p>
                <p className="mt-1 text-xs text-gold-900/80">{order.customerNote}</p>
              </div>
            )}
          </section>

          <section className="card p-5">
            <h2 className="font-bold">Internal note</h2>
            <p className="mt-1 text-xs text-ink-muted">Only visible to staff.</p>
            <div className="mt-3">
              <OrderNoteForm id={order.id} note={order.adminNote ?? ""} />
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
