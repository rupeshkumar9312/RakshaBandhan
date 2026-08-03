import type { Metadata } from "next";
import { PageShell, Prose } from "@/components/page-shell";
import { formatPaise, FREE_SHIPPING_THRESHOLD, SHIPPING_FEE } from "@/lib/money";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Delivery & returns",
  description:
    "Delivery timings, charges and our replacement policy for rakhi orders in Noida.",
};

export default function ShippingPage() {
  return (
    <PageShell
      eyebrow="Policies"
      title="Delivery & returns"
      intro="Short version: same-day inside the society, next-day across Noida, and anything damaged gets replaced free."
    >
      <div className="grid gap-6 sm:grid-cols-3">
        {[
          { title: "Delivery charge", value: formatPaise(SHIPPING_FEE), note: `Free above ${formatPaise(FREE_SHIPPING_THRESHOLD)}` },
          { title: "Society delivery", value: "Same day", note: "Order before 6 PM" },
          { title: "Rest of Noida", value: "Next day", note: "Via local partner" },
        ].map((s) => (
          <div key={s.title} className="card p-5">
            <p className="text-xs font-semibold tracking-wide text-ink-muted uppercase">
              {s.title}
            </p>
            <p className="mt-2 font-display text-2xl font-bold text-maroon-800">{s.value}</p>
            <p className="mt-1 text-xs text-ink-muted">{s.note}</p>
          </div>
        ))}
      </div>

      <div className="mt-12">
        <Prose>
          <h2>Where we deliver</h2>
          <p>
            We deliver across Noida, with same-day service inside {SITE.society}. Orders placed
            before 6 PM in the society reach you the same evening; anything later goes out the next
            morning.
          </p>
          <p>
            We do not currently ship outside Noida. If you are close to our boundary, call us before
            ordering and we will tell you honestly whether we can make it.
          </p>

          <h2>Charges</h2>
          <ul>
            <li>
              Flat {formatPaise(SHIPPING_FEE)} delivery on all orders.
            </li>
            <li>
              Free delivery once your cart crosses {formatPaise(FREE_SHIPPING_THRESHOLD)}.
            </li>
            <li>No packaging charges, no handling fees, no surprises at the door.</li>
          </ul>

          <h2>Payment</h2>
          <p>
            Cash on Delivery is the only payment method. Please keep the exact amount ready where
            possible — our delivery partners rarely carry much change during the rush.
          </p>

          <h2>If something is wrong</h2>
          <p>
            <strong>Damaged in transit:</strong> send a photo on WhatsApp within 48 hours of
            delivery and we will send a replacement free. You do not need to return the damaged one.
          </p>
          <p>
            <strong>Wrong item:</strong> call us and we will swap it the same day if you are inside
            the society, next day otherwise.
          </p>
          <p>
            <strong>Change of mind:</strong> rakhis are seasonal and hand-finished, so once a parcel
            is opened we cannot take it back. If it is unopened and within two days of delivery,
            call us and we will work it out.
          </p>
          <p>
            <strong>Hampers with sweets:</strong> these are perishable and cannot be returned, but
            if the sweets arrive stale or damaged we will replace the whole hamper.
          </p>

          <h2>Cancellations</h2>
          <p>
            You can cancel any time before the order goes out for delivery — just call with your
            order number. After that, simply decline the parcel at the door. Since nothing is paid
            upfront, there is no refund to process.
          </p>

          <h2>Festival week</h2>
          <p>
            In the three days before Raksha Bandhan our volumes roughly triple. We keep same-day
            delivery running inside the society, but the rest of Noida may slip to 48 hours. Order
            early if you can — we will always tell you the truth about timing when you call.
          </p>
        </Prose>
      </div>
    </PageShell>
  );
}
