import type { Metadata } from "next";
import Link from "next/link";
import { PageShell, Prose } from "@/components/page-shell";
import { formatPaise, FREE_SHIPPING_THRESHOLD, SHIPPING_FEE } from "@/lib/money";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms of service",
  description: "The terms you agree to when ordering from Rakhi Bazaar.",
};

export default function TermsPage() {
  return (
    <PageShell
      eyebrow="Legal"
      title="Terms of service"
      intro="Plain terms for a small shop. Nothing here is designed to catch you out."
    >
      <Prose>
        <p className="text-sm text-ink-muted">Last updated: 4 August 2026</p>

        <h2>Who we are</h2>
        <p>
          {SITE.name} is a small retail operation based at {SITE.society}, selling rakhis and
          festival hampers within Noida. Using this site or placing an order means you accept these
          terms.
        </p>

        <h2>Orders</h2>
        <p>
          An order placed on this site is an offer to buy. It becomes a contract when we confirm it
          — usually by phone. We may decline an order if an item has sold out, if the address is
          outside our delivery area, or if we cannot reach you on the number provided.
        </p>
        <p>
          Stock is checked at the moment you place the order, but in the days before the festival
          things move fast. If something sells out between your order and our confirmation, we will
          call you and either substitute with your agreement or cancel that line.
        </p>

        <h2>Pricing</h2>
        <ul>
          <li>All prices are in Indian Rupees and include applicable taxes.</li>
          <li>
            Delivery is {formatPaise(SHIPPING_FEE)}, free above{" "}
            {formatPaise(FREE_SHIPPING_THRESHOLD)}.
          </li>
          <li>
            Struck-through prices are our own earlier list price for that item, not a competitor
            comparison.
          </li>
          <li>
            If an item is listed at an obviously wrong price because of a mistake on our side, we
            will contact you rather than silently cancelling.
          </li>
        </ul>

        <h2>Payment</h2>
        <p>
          Cash on Delivery only. Payment is due in full to the delivery partner when the order is
          handed over. We do not accept cards, UPI or bank transfer at this time.
        </p>
        <p>
          Repeatedly refusing delivery of confirmed Cash-on-Delivery orders may mean we decline
          future orders from that number.
        </p>

        <h2>Delivery</h2>
        <p>
          Delivery estimates shown at checkout are estimates, not guarantees. We aim for same-day
          inside the society and next-day across Noida, and we will call you if anything slips. Full
          detail is on the{" "}
          <Link href="/shipping" className="underline hover:text-maroon-700">
            delivery and returns
          </Link>{" "}
          page.
        </p>

        <h2>Products</h2>
        <p>
          These are hand-finished items. Small variations in stone placement, thread shade and
          finish are normal and are not defects. Where a product is described as plated we say so;
          where it is described as 925 sterling silver it is hallmarked and ships with a
          certificate.
        </p>
        <p>
          Product photographs are indicative. Where placeholder imagery is still in use we say so on
          the listing.
        </p>

        <h2>Returns and replacements</h2>
        <p>
          Damaged or incorrect items are replaced free within 48 hours of delivery. Change-of-mind
          returns are not accepted once a parcel has been opened, and perishable hamper contents
          cannot be returned. The{" "}
          <Link href="/shipping" className="underline hover:text-maroon-700">
            returns policy
          </Link>{" "}
          has the specifics.
        </p>

        <h2>Reviews</h2>
        <p>
          Reviews you post must be your own honest experience of the product. We remove reviews that
          are abusive, contain personal information, or are clearly not about the item.
        </p>

        <h2>Liability</h2>
        <p>
          Our responsibility for any order is limited to the value of that order. We are not liable
          for indirect losses — a delayed rakhi is genuinely disappointing, but it is not something
          we can compensate beyond refunding or replacing what you paid for.
        </p>

        <h2>Changes</h2>
        <p>
          We may update these terms. The version in force is whichever was published on the day you
          ordered.
        </p>

        <h2>Governing law</h2>
        <p>
          These terms are governed by the laws of India, with courts in Gautam Buddh Nagar, Uttar
          Pradesh having jurisdiction.
        </p>

        <h2>Contact</h2>
        <p>
          {SITE.email} · {SITE.phone}
        </p>
      </Prose>
    </PageShell>
  );
}
