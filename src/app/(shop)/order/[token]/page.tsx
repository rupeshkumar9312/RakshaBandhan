import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { formatPaise } from "@/lib/money";
import { estimatedDelivery, formatDate, STATUS_LABELS, type OrderStatus } from "@/lib/utils";
import { SITE } from "@/lib/site";
import { CheckIcon, TruckIcon, CashIcon, PhoneIcon, WhatsAppIcon } from "@/components/icons";

export const metadata: Metadata = {
  title: "Order confirmed",
  robots: { index: false, follow: false },
};

type Params = Promise<{ token: string }>;

export default async function OrderConfirmationPage({ params }: { params: Params }) {
  const { token } = await params;

  const order = await prisma.order.findUnique({
    where: { publicToken: token },
    include: { items: true },
  });

  if (!order) notFound();

  const tel = SITE.phone.replace(/\s/g, "");
  const shareText = encodeURIComponent(
    `I just ordered rakhis from ${SITE.name} — same-day delivery inside the society and cash on delivery. ${SITE.url}`,
  );

  return (
    <div className="container-x py-10 sm:py-16">
      <div className="mx-auto max-w-3xl">
        {/* Hero confirmation */}
        <div className="text-center">
          <div className="mx-auto grid size-20 place-items-center rounded-full bg-emerald-100 animate-[rise_0.6s_cubic-bezier(0.16,1,0.3,1)_both]">
            <CheckIcon className="size-10 text-emerald-700" />
          </div>
          <h1 className="mt-6 font-display text-3xl font-bold sm:text-4xl">
            Thank you, {order.contactName.split(" ")[0]}!
          </h1>
          <p className="mt-3 text-[0.9375rem] text-ink-muted">
            Your order is confirmed. We&apos;ll call{" "}
            <strong className="text-ink">+91 {order.contactPhone}</strong> before we deliver.
          </p>

          <div className="mt-6 inline-flex flex-wrap items-center justify-center gap-x-6 gap-y-2 rounded-xl2 border border-cream-300 bg-white px-6 py-4">
            <div>
              <p className="text-[0.6875rem] tracking-wider text-ink-muted uppercase">Order number</p>
              <p className="font-display text-lg font-bold text-maroon-800">{order.orderNumber}</p>
            </div>
            <div className="hidden h-9 w-px bg-cream-300 sm:block" />
            <div>
              <p className="text-[0.6875rem] tracking-wider text-ink-muted uppercase">Placed on</p>
              <p className="text-sm font-semibold">{formatDate(order.placedAt, true)}</p>
            </div>
            <div className="hidden h-9 w-px bg-cream-300 sm:block" />
            <div>
              <p className="text-[0.6875rem] tracking-wider text-ink-muted uppercase">Status</p>
              <p className="text-sm font-semibold">
                {STATUS_LABELS[order.status as OrderStatus] ?? order.status}
              </p>
            </div>
          </div>
        </div>

        {/* Delivery + payment */}
        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          <div className="card flex gap-3.5 p-5">
            <TruckIcon className="mt-0.5 size-6 shrink-0 text-maroon-700" />
            <div>
              <p className="font-semibold">Expected by {estimatedDelivery(order.placedAt)}</p>
              <address className="mt-2 text-sm not-italic leading-relaxed text-ink-muted">
                {[order.flat, order.tower].filter(Boolean).join(", ")}
                {(order.flat || order.tower) && <br />}
                {order.addressLine1}
                <br />
                {order.landmark && (
                  <>
                    {order.landmark}
                    <br />
                  </>
                )}
                {order.city}, {order.state} — {order.pincode}
              </address>
            </div>
          </div>

          <div className="card flex gap-3.5 p-5">
            <CashIcon className="mt-0.5 size-6 shrink-0 text-maroon-700" />
            <div>
              <p className="font-semibold">Cash on Delivery</p>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                Keep{" "}
                <strong className="text-maroon-800">{formatPaise(order.total)}</strong> ready for the
                delivery partner. Exact change helps.
              </p>
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="card mt-4 p-6">
          <h2 className="text-lg font-bold">Order summary</h2>

          <ul className="mt-4 divide-y divide-cream-300">
            {order.items.map((item) => (
              <li key={item.id} className="flex gap-3.5 py-3.5">
                <div className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-cream-200">
                  {item.imageSnapshot && (
                    <Image
                      src={item.imageSnapshot}
                      alt=""
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium leading-snug">{item.nameSnapshot}</p>
                  <p className="mt-0.5 text-xs text-ink-muted">
                    {item.quantity} × {formatPaise(item.unitPrice)}
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
                {order.shippingFee === 0 ? (
                  <span className="text-emerald-700">Free</span>
                ) : (
                  formatPaise(order.shippingFee)
                )}
              </dd>
            </div>
            <div className="rule-gold my-2" />
            <div className="flex justify-between text-lg">
              <dt className="font-bold">Total payable</dt>
              <dd className="font-bold tabular-nums text-maroon-800">{formatPaise(order.total)}</dd>
            </div>
          </dl>
        </div>

        {/* Next steps */}
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/products" className="btn btn-primary">
            Continue shopping
          </Link>
          <a
            href={`https://wa.me/?text=${shareText}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-outline"
          >
            <WhatsAppIcon className="size-4" />
            Tell a neighbour
          </a>
          <a href={`tel:${tel}`} className="btn btn-ghost">
            <PhoneIcon className="size-4" />
            Call us
          </a>
        </div>

        <p className="mt-8 text-center text-xs text-ink-muted">
          Save your order number <strong className="text-ink-soft">{order.orderNumber}</strong> — you
          can look it up any time on the{" "}
          <Link href="/track" className="underline hover:text-maroon-700">
            track order
          </Link>{" "}
          page.
        </p>
      </div>
    </div>
  );
}
