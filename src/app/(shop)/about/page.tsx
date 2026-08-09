import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PageShell, Prose } from "@/components/page-shell";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Our story",
  description:
    "Why we started Rakhi Bazaar — a small rakhi store run out of a Noida society, sourcing directly from artisans in Jaipur and Moradabad.",
};

export default function AboutPage() {
  return (
    <PageShell
      eyebrow="Our story"
      title="A rakhi shop run from your society"
      intro="We are not a marketplace. We are a few neighbours who got tired of the annual scramble and decided to fix it for our own society first."
    >
      <div className="grid gap-12 lg:grid-cols-[1fr_20rem]">
        <Prose>
          <p>
            It starts the same way every August. Someone remembers on the 4th,
            the good designs are gone by the 5th, and by the 7th you are in a
            traffic jam somewhere near Sector 18 settling for whatever is left
            on the rack.
          </p>

          <h2>So we stocked our own</h2>
          <p>
            The first year we bought two hundred rakhis and sold them out of a
            flat in {SITE.society.split(",")[0]}. They went in four days. The
            second year we doubled it and built this website, mostly so people
            would stop calling at eleven at night to ask what was left.
          </p>

          <h2>Where the rakhis come from</h2>
          <p>
            We buy directly from — the same workshops that supply the larger
            brands, minus the layers in between.
          </p>
          <p>
            Every piece is checked by hand before it is boxed. Thread strength,
            stone seating, clasp finish. It is not glamorous work but it is why
            we get almost no complaints.
          </p>

          <h2>How delivery works</h2>
          <ul>
            <li>
              <strong>Inside the society:</strong> order before 9 PM and one of
              us walks it to your tower the same evening.
            </li>
            {/* <li>
              <strong>Elsewhere in Noida:</strong> next-day delivery through a
              local partner.
            </li> */}
            <li>
              <strong>Payment:</strong> Cash / UPI.
            </li>
          </ul>

          {/* <h2>The Cash-on-Delivery thing</h2> */}
          {/* <p>
            People ask why we do not take online payments. Honestly, because a lot of our customers
            are parents and grandparents ordering for their children, and asking them to fumble with
            a UPI PIN at checkout loses more orders than it saves. Cash at the door works. We will
            add other options when enough people ask.
          </p> */}

        </Prose>

        <aside className="space-y-5">
          <div className="relative aspect-4/5 overflow-hidden rounded-xl2 shadow-[var(--shadow-soft)]">
            <Image
              src="/placeholders/banner-03.svg"
              alt=""
              fill
              sizes="320px"
              className="object-cover"
            />
          </div>

          <div className="card p-5">
            <h2 className="font-bold">Come say hello</h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-muted">
              {SITE.society}
            </p>
            <div className="mt-4 space-y-2">
              <a
                href={`tel:${SITE.phone.replace(/\s/g, "")}`}
                className="btn btn-outline btn-sm w-full"
              >
                {SITE.phone}
              </a>
              <Link href="/products" className="btn btn-primary btn-sm w-full">
                Shop the collection
              </Link>
            </div>
          </div>
        </aside>
      </div>
    </PageShell>
  );
}
