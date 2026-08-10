import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/page-shell";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "FAQ",
  description:
    "Answers about rakhi delivery in Noida, Cash on Delivery, returns, replacements and order tracking.",
};

const FAQS = [
  {
    group: "Ordering & payment",
    items: [
      {
        q: "How do I pay?",
        a: "Cash on Delivery only. You pay the person who hands you the parcel — nothing is charged upfront and there is no online payment to set up. Keeping exact change ready helps a lot.",
      },
      {
        q: "Do I need an account?",
        a: "No. Checkout takes a name, a phone number and an address. We create a customer record from your phone number automatically so repeat orders are quicker.",
      },
      {
        q: "Can I change or cancel an order?",
        a: "Yes, as long as it has not gone out for delivery. Call us with your order number and we will sort it out. Once it is out for delivery you can simply decline it at the door.",
      },
      {
        q: "Is there a minimum order?",
        a: "No minimum. Delivery is free.",
      },
    ],
  },
  {
    group: "Delivery",
    items: [
      {
        q: "How fast is delivery?",
        a: `Order before 9 PM and it reaches you the same evening. We call before we come.`,
      },
      {
        q: "Do you deliver outside Noida?",
        a: "Not right now. We are a small operation and we would rather do one area properly than three badly. If you are just outside our range, give us a call — sometimes we can work something out.",
      },
      {
        q: "What if I am not home?",
        a: "Add a note at checkout and we will leave it with your guard or a neighbour. If nobody is available we will call and try again the next day.",
      },
      {
        q: "How do I track my order?",
        a: "Use the track order page with your order number and the phone number you ordered with. You will also get a call from us before delivery.",
      },
    ],
  },
  {
    group: "Products & returns",
    items: [
      {
        q: "Something arrived damaged. What now?",
        a: "We replace it free, no questions and no return shipping. Send us a photo on WhatsApp within 48 hours of delivery and we will send a new one out.",
      },
      {
        q: "Are the silver rakhis really silver?",
        a: "Yes — 925 sterling, hallmarked, and each one ships with a certificate of purity. The plated pieces are described as plated in their product listing, never as solid silver.",
      },
      {
        q: "Can I return something I just did not like?",
        a: "Rakhis are seasonal and hand-finished, so we do not accept change-of-mind returns once the parcel is opened. If it is unopened and still within two days of delivery, call us.",
      },
      {
        // q: "Do the hampers contain fresh sweets?",
        // a: "Yes. Sweets are boxed the morning of delivery from a local Noida sweet house. Eat within three days and keep them refrigerated in this weather.",
      },
    ],
  },
];

export default function FaqPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.flatMap((g) =>
      g.items.map((i) => ({
        "@type": "Question",
        name: i.q,
        acceptedAnswer: { "@type": "Answer", text: i.a },
      })),
    ),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PageShell
        eyebrow="Help"
        title="Questions, answered"
        intro="Most of what people call to ask. If yours is not here, ring us — a person picks up."
      >
        <div className="grid gap-10 lg:grid-cols-[1fr_18rem]">
          <div className="max-w-2xl space-y-10">
            {FAQS.map((group) => (
              <section key={group.group}>
                <h2 className="font-display text-xl font-bold">{group.group}</h2>
                <div className="mt-4 space-y-2.5">
                  {group.items.map((item) => (
                    <details key={item.q} className="card group overflow-hidden p-0">
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 font-semibold transition-colors hover:bg-cream-50">
                        {item.q}
                        <span className="grid size-6 shrink-0 place-items-center rounded-full bg-cream-200 text-ink-soft transition-transform group-open:rotate-45">
                          +
                        </span>
                      </summary>
                      <p className="border-t border-cream-300 px-5 py-4 text-sm leading-relaxed text-ink-soft">
                        {item.a}
                      </p>
                    </details>
                  ))}
                </div>
              </section>
            ))}
          </div>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="card p-5">
              <h2 className="font-bold">Still stuck?</h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                Call between 9 AM and 9 PM, any day during the festival season.
              </p>
              <div className="mt-4 space-y-2">
                <a
                  href={`tel:${SITE.phone.replace(/\s/g, "")}`}
                  className="btn btn-primary btn-sm w-full"
                >
                  {SITE.phone}
                </a>
                <a
                  href={`https://wa.me/${SITE.phone.replace(/[\s+]/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-outline btn-sm w-full"
                >
                  WhatsApp us
                </a>
                <Link href="/track" className="btn btn-ghost btn-sm w-full">
                  Track an order
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </PageShell>
    </>
  );
}
