import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { formatPaise } from "@/lib/money";
import { estimatedDelivery } from "@/lib/utils";
import { SITE } from "@/lib/site";
import { CheckIcon, TruckIcon, CashIcon, PhoneIcon, WhatsAppIcon } from "@/components/icons";
import { OrderTracker } from "@/components/order-tracker";

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
  const trackingUrl = `${SITE.url}/order/${order.publicToken}`;
  const shareText = encodeURIComponent(
    `Thank you for your order from ${SITE.name}! 🙏\n\nOrder ${order.orderNumber} has been placed successfully.\nTrack your order here: ${trackingUrl}`,
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
        </div>

        {/* Status + items */}
        <div className="mt-8">
          <OrderTracker order={order} />
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
            Share on WhatsApp
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
