import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/page-shell";
import { SITE } from "@/lib/site";
import { PhoneIcon, MailIcon, WhatsAppIcon, PackageIcon } from "@/components/icons";

export const metadata: Metadata = {
  title: "Contact us",
  description: `Reach ${SITE.name} by phone, WhatsApp or email. Based in ${SITE.society}.`,
};

export default function ContactPage() {
  const tel = SITE.phone.replace(/\s/g, "");

  const channels = [
    {
      Icon: PhoneIcon,
      title: "Call us",
      body: "9 AM – 9 PM, every day through the festival season. A person answers.",
      action: SITE.phone,
      href: `tel:${tel}`,
    },
    {
      Icon: WhatsAppIcon,
      title: "WhatsApp",
      body: "Best for photos — damaged items, custom hamper requests, bulk orders.",
      action: "Open WhatsApp",
      href: `https://wa.me/${tel.replace("+", "")}`,
    },
    {
      Icon: MailIcon,
      title: "Email",
      body: "For anything that is not urgent. We reply within a day.",
      action: SITE.email,
      href: `mailto:${SITE.email}`,
    },
    {
      Icon: PackageIcon,
      title: "Track an order",
      body: "Check where your parcel is with your order number and phone.",
      action: "Track order",
      href: "/track",
    },
  ];

  return (
    <PageShell
      eyebrow="Get in touch"
      title="Talk to a human"
      intro="No ticket system, no chatbot. Whichever way you reach us, one of the three of us picks it up."
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {channels.map((c) => (
          <div key={c.title} className="card flex flex-col p-6">
            <span className="grid size-11 place-items-center rounded-full bg-maroon-50 text-maroon-700">
              <c.Icon className="size-5" />
            </span>
            <h2 className="mt-4 text-lg font-bold">{c.title}</h2>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-muted">{c.body}</p>
            {c.href.startsWith("/") ? (
              <Link href={c.href} className="btn btn-outline btn-sm mt-5 self-start">
                {c.action}
              </Link>
            ) : (
              <a
                href={c.href}
                target={c.href.startsWith("http") ? "_blank" : undefined}
                rel={c.href.startsWith("http") ? "noopener noreferrer" : undefined}
                className="btn btn-outline btn-sm mt-5 self-start"
              >
                {c.action}
              </a>
            )}
          </div>
        ))}
      </div>

      <div className="card mt-6 p-6">
        <h2 className="text-lg font-bold">Where we are</h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-muted">
          {SITE.society}. We are not a shopfront — it is a flat with a lot of boxes in it — but if
          you live in the society you are welcome to collect your order in person. Call first so
          someone is home.
        </p>

        <div className="mt-5 rounded-xl bg-cream-100 p-4">
          <p className="text-sm font-semibold">Bulk and corporate orders</p>
          <p className="mt-1 text-sm leading-relaxed text-ink-muted">
            Ordering 25 rakhis or more for an office or an RWA event? WhatsApp us — we do custom
            hampers and a better rate, but we need about a week&apos;s notice.
          </p>
        </div>
      </div>
    </PageShell>
  );
}
