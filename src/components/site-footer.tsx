import Link from "next/link";
import { SITE } from "@/lib/site";
import { PhoneIcon, MailIcon, WhatsAppIcon, TruckIcon, CashIcon, ShieldIcon } from "@/components/icons";

const COLUMNS = [
  {
    title: "Shop",
    links: [
      { href: "/products", label: "All rakhis" },
      { href: "/products?category=designer-rakhi", label: "Designer rakhi" },
      { href: "/products?category=silver-rakhi", label: "Silver rakhi" },
      { href: "/products?category=kids-rakhi", label: "Kids rakhi" },
      { href: "/products?category=rakhi-hampers", label: "Hampers" },
    ],
  },
  {
    title: "Help",
    links: [
      { href: "/track", label: "Track your order" },
      { href: "/faq", label: "FAQ" },
      { href: "/shipping", label: "Delivery & returns" },
      { href: "/contact", label: "Contact us" },
    ],
  },
  {
    title: "About",
    links: [
      { href: "/about", label: "Our story" },
      { href: "/blog", label: "Journal" },
      { href: "/privacy", label: "Privacy policy" },
      { href: "/terms", label: "Terms of service" },
    ],
  },
];

export function SiteFooter() {
  const tel = SITE.phone.replace(/\s/g, "");

  return (
    <footer className="shell-dark relative mt-20 overflow-hidden text-cream-200">
      <div aria-hidden className="grain-overlay" />
      <div
        aria-hidden
        className="absolute -top-32 left-1/2 size-96 -translate-x-1/2 rounded-full bg-gold-500/10 blur-3xl"
      />
      {/* Trust strip */}
      <div className="relative border-b border-gold-400/12">
        <div className="container-x grid gap-6 py-8 sm:grid-cols-3">
          {[
            { Icon: TruckIcon, title: "Same-day society delivery", body: "Order before 6 PM" },
            { Icon: CashIcon, title: "Cash on Delivery", body: "Pay at your door" },
            { Icon: ShieldIcon, title: "Damage-free promise", body: "Free replacement" },
          ].map(({ Icon, title, body }) => (
            <div key={title} className="flex items-center gap-3">
              <span className="grid size-11 shrink-0 place-items-center rounded-full bg-gradient-to-br from-gold-400/20 to-gold-600/10 text-gold-300 ring-1 ring-gold-400/20">
                <Icon className="size-5.5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-cream-50">{title}</p>
                <p className="text-xs text-cream-300/70">{body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="container-x relative grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <div className="flex items-center gap-2.5">
            <span className="grid size-10 place-items-center rounded-full bg-gradient-to-br from-gold-300 via-gold-500 to-gold-600 text-lg font-bold text-maroon-950 shadow-[var(--shadow-gold)]">
              ॐ
            </span>
            <span className="font-display text-xl font-bold text-cream-50">{SITE.name}</span>
          </div>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-cream-300/75">
            A small rakhi store run out of {SITE.society}. We hand-pick every design, box every
            order ourselves, and deliver most of them on foot.
          </p>

          <div className="mt-5 space-y-2.5 text-sm">
            <a href={`tel:${tel}`} className="flex items-center gap-2.5 text-cream-200 hover:text-gold-300">
              <PhoneIcon className="size-4 text-gold-400" /> {SITE.phone}
            </a>
            <a href={`mailto:${SITE.email}`} className="flex items-center gap-2.5 text-cream-200 hover:text-gold-300">
              <MailIcon className="size-4 text-gold-400" /> {SITE.email}
            </a>
            <a
              href={`https://wa.me/${tel.replace("+", "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 text-cream-200 hover:text-gold-300"
            >
              <WhatsAppIcon className="size-4 text-gold-400" /> Chat on WhatsApp
            </a>
          </div>
        </div>

        {COLUMNS.map((col) => (
          <div key={col.title}>
            <h3 className="text-xs font-bold tracking-[0.18em] text-gold-400 uppercase">
              {col.title}
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-cream-300/75 transition-colors hover:text-gold-300">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-white/10">
        <div className="container-x flex flex-col items-center justify-between gap-3 py-5 text-xs text-cream-300/60 sm:flex-row">
          <p>
            © {new Date().getFullYear()} {SITE.name}. Made with care in Noida.
          </p>
          <p>Cash on Delivery · Free delivery above ₹499</p>
        </div>
      </div>
    </footer>
  );
}
