import type { Metadata } from "next";
import { PageShell, Prose } from "@/components/page-shell";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy policy",
  description: "What data Rakhi Bazaar collects, why, and how long we keep it.",
};

export default function PrivacyPage() {
  return (
    <PageShell
      eyebrow="Legal"
      title="Privacy policy"
      intro="We collect the bare minimum needed to deliver a parcel to you, and we do not sell any of it."
    >
      <Prose>
        <p className="text-sm text-ink-muted">Last updated: 4 August 2026</p>

        <h2>What we collect</h2>
        <ul>
          <li>
            <strong>Your name and phone number</strong> — to deliver the order and to call you when
            we are outside your tower.
          </li>
          <li>
            <strong>Your delivery address</strong> — tower, flat, landmark, PIN code.
          </li>
          <li>
            <strong>Your email</strong> — only if you choose to give it. It is optional at checkout.
          </li>
          <li>
            <strong>Your order history</strong> — what you bought and when, so repeat orders are
            faster and we know what to restock.
          </li>
        </ul>
        <p>
          We do not collect payment information, because every order is Cash on Delivery. There is
          no card number, UPI ID or bank detail anywhere in our system.
        </p>

        <h2>What we do with it</h2>
        <p>
          We use it to pack and deliver your order, to call you about that order, and to decide what
          to stock next season. That is the entire list.
        </p>
        <p>
          We do not sell, rent or share your details with advertisers or data brokers. The only
          third party who sees your name and address is the delivery partner carrying your parcel,
          and only for orders outside our own society.
        </p>

        <h2>Cookies</h2>
        <p>
          Your shopping cart is stored in your own browser&apos;s local storage — it never reaches
          our server until you place an order. We set one cookie, and only for store staff signing
          in to the admin panel. There are no advertising or tracking cookies on this site.
        </p>

        <h2>Reviews</h2>
        <p>
          If you post a product review, the name you enter is shown publicly alongside it. Use a
          first name and initial if you would rather not be identifiable.
        </p>

        <h2>How long we keep it</h2>
        <p>
          Order records are kept for three years, because we occasionally need them to settle a
          dispute or honour a replacement. After that they are deleted.
        </p>

        <h2>Your choices</h2>
        <p>
          Call or email us and we will tell you exactly what we hold about you, correct anything
          wrong, or delete your record entirely. There is no form to fill in — just ask.
        </p>

        <h2>Children</h2>
        <p>
          This store is meant for adults placing orders. We do not knowingly collect information
          from anyone under 18.
        </p>

        <h2>Contact</h2>
        <p>
          Questions about any of this: {SITE.email} or {SITE.phone}. We are at {SITE.society}.
        </p>
      </Prose>
    </PageShell>
  );
}
