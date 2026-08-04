import Image from "next/image";
import Link from "next/link";
import { ProductGrid } from "@/components/product-card";
import { getCategories, getFeaturedProducts, getNewArrivals } from "@/lib/queries";
import { SITE, TRUST_POINTS } from "@/lib/site";
import { ChevronRight, SparkleIcon, StarIcon, CheckIcon } from "@/components/icons";

const HERO_IMG = "/hero/hero-bg.jpg";
const STORY_IMG = "/placeholders/banner-04.svg";

export default async function HomePage() {
  const [categories, featured, arrivals] = await Promise.all([
    getCategories(),
    getFeaturedProducts(8),
    getNewArrivals(4),
  ]);

  return (
    <>
      {/* ───────────────────────── Hero ───────────────────────── */}
      <section className="relative overflow-hidden bg-maroon-950">
        {/* Portrait source (654×980) in a wide frame — object-cover crops to the
            middle band, where the rakhi and the roli/rice bowls sit. */}
        <Image
          src={HERO_IMG}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        {/* Two layers, deliberately not stacked on the same axis: a light maroon
            wash keeps the whole frame on-brand, then a left-to-right scrim that
            fades out by ~70% so the photograph stays visible on the right while
            the headline sits on solid colour. */}
        {/* Heavier on phones: the headline runs the full width there and the
            gold type would otherwise sit on the bright rice bowl. */}
        <div className="absolute inset-0 bg-gradient-to-br from-maroon-950/95 via-maroon-950/80 to-maroon-900/50 sm:from-maroon-950/88 sm:via-maroon-950/62 sm:to-maroon-900/28" />
        <div className="absolute inset-0 bg-gradient-to-r from-maroon-950 from-5% via-maroon-950/78 via-42% to-transparent to-75%" />
        <div aria-hidden className="grain-overlay" />
        <div
          aria-hidden
          className="absolute -right-24 -top-24 size-96 rounded-full bg-gold-500/20 blur-3xl animate-[floatSlow_9s_ease-in-out_infinite]"
        />
        <div
          aria-hidden
          className="absolute -bottom-32 -left-20 size-80 rounded-full bg-maroon-500/20 blur-3xl"
        />

        <div className="container-x relative grid min-h-[85vh] items-center gap-12 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:py-24">
          <div className="max-w-xl animate-[rise_0.7s_cubic-bezier(0.16,1,0.3,1)_both]">
            <span className="chip border border-gold-400/35 bg-gold-400/10 text-gold-300 backdrop-blur-sm">
              <SparkleIcon className="size-3.5" />
              Raksha Bandhan · {SITE.festivalDate}
            </span>

            <h1 className="mt-5 font-display text-[2.75rem] leading-[1.05] font-bold text-cream-50 sm:text-6xl lg:text-7xl">
              A thread that
              <span className="block bg-gradient-to-r from-gold-200 via-gold-400 to-gold-200 bg-clip-text text-transparent">
                holds everything
              </span>
              together.
            </h1>

            <p className="mt-6 max-w-md text-base leading-relaxed text-cream-200/85 sm:text-lg">
              Kundan, sterling silver, meenakari and hampers — handpicked for the one you&apos;ve
              been arguing with since childhood. Delivered to your tower the same evening.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/products" className="btn btn-gold">
                Shop the collection
                <ChevronRight className="size-4" />
              </Link>
              <Link
                href="/products?category=rakhi-hampers"
                className="btn border border-cream-200/25 text-cream-100 backdrop-blur-sm hover:bg-white/8"
              >
                Explore hampers
              </Link>
            </div>

            <ul className="mt-10 flex flex-wrap gap-x-6 gap-y-2.5 text-sm text-cream-200/75">
              {["Cash on Delivery", "Free above ₹499", "Same-day in society"].map((t) => (
                <li key={t} className="flex items-center gap-1.5">
                  <CheckIcon className="size-4 text-gold-400" />
                  {t}
                </li>
              ))}
            </ul>
          </div>

          {/* Floating product preview */}
          <div className="relative hidden lg:block">
            <div className="relative mx-auto aspect-4/5 w-full max-w-md">
              {featured.slice(0, 2).map((p, i) => (
                <Link
                  key={p.id}
                  href={`/products/${p.slug}`}
                  className={
                    i === 0
                      ? "absolute inset-x-8 top-0 z-10 overflow-hidden rounded-[1.75rem] border border-white/15 shadow-[0_40px_80px_-30px_rgba(0,0,0,0.7)] transition-transform duration-500 hover:-translate-y-2"
                      : "absolute -bottom-2 right-0 z-20 w-52 overflow-hidden rounded-2xl border border-white/15 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.7)] transition-transform duration-500 hover:-translate-y-2"
                  }
                >
                  <div className={i === 0 ? "relative aspect-4/5" : "relative aspect-square"}>
                    {p.images[0] && (
                      <Image
                        src={p.images[0].url}
                        alt={p.name}
                        fill
                        sizes="(max-width: 1024px) 0px, 400px"
                        priority={i === 0}
                        className="object-cover"
                      />
                    )}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent p-4">
                      <p className="line-clamp-1 text-sm font-semibold text-cream-50">{p.name}</p>
                      <p className="text-xs text-gold-300">₹{Math.round(p.price / 100)}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────── Trust bar ─────────────────── */}
      <section className="border-b border-cream-300 bg-cream-50">
        <div className="container-x grid gap-5 py-8 sm:grid-cols-2 lg:grid-cols-4">
          {TRUST_POINTS.map((p) => (
            <div key={p.title}>
              <p className="text-sm font-bold text-maroon-800">{p.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-ink-muted">{p.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─────────────────── Categories ─────────────────── */}
      <section className="container-x py-16 sm:py-20">
        <SectionHead
          eyebrow="Browse by style"
          title="Find the right thread"
          subtitle="Five collections, from ₹149 pocket-money rakhis to hallmarked sterling silver."
        />

        <div className="mt-10 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3">
          {categories.map((c, i) => (
            <Link
              key={c.id}
              href={`/products?category=${c.slug}`}
              className={`group relative overflow-hidden rounded-xl2 ${
                i === 0 ? "col-span-2 lg:col-span-1 lg:row-span-2" : ""
              }`}
            >
              <div className={`relative ${i === 0 ? "aspect-3/2 lg:aspect-3/4" : "aspect-4/3"}`}>
                {c.imageUrl && (
                  <Image
                    src={c.imageUrl}
                    alt={c.name}
                    fill
                    sizes="(max-width: 640px) 50vw, 33vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-107"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-maroon-950/88 via-maroon-950/25 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
                  <h3 className="font-display text-lg font-bold text-cream-50 sm:text-xl">
                    {c.name}
                  </h3>
                  <p className="mt-0.5 text-xs text-cream-200/70">
                    {c._count.products} design{c._count.products === 1 ? "" : "s"}
                  </p>
                  {i === 0 && c.description && (
                    <p className="mt-2 hidden max-w-xs text-xs leading-relaxed text-cream-200/70 lg:block">
                      {c.description}
                    </p>
                  )}
                </div>
                <span className="absolute right-4 top-4 grid size-8 place-items-center rounded-full bg-cream-50/12 text-cream-50 opacity-0 backdrop-blur transition-opacity group-hover:opacity-100">
                  <ChevronRight className="size-4" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ─────────────────── Featured ─────────────────── */}
      <section className="bg-cream-50 py-16 sm:py-20">
        <div className="container-x">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <SectionHead
              eyebrow="Most loved"
              title="This season's favourites"
              subtitle="What our society has been ordering most."
            />
            <Link
              href="/products"
              className="hidden items-center gap-1 text-sm font-semibold text-maroon-700 hover:text-maroon-900 sm:flex"
            >
              View all <ChevronRight className="size-4" />
            </Link>
          </div>

          <div className="mt-10">
            <ProductGrid products={featured} />
          </div>

          <div className="mt-8 text-center sm:hidden">
            <Link href="/products" className="btn btn-outline">
              View all rakhis
            </Link>
          </div>
        </div>
      </section>

      {/* ─────────────────── Story ─────────────────── */}
      <section className="container-x py-16 sm:py-20">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div className="relative aspect-4/3 overflow-hidden rounded-xl2 shadow-[var(--shadow-lift)]">
            <Image
              src={STORY_IMG}
              alt="A rakhi thali prepared for the ceremony"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          </div>

          <div>
            <p className="eyebrow">Why we do this</p>
            <h2 className="mt-3 font-display text-3xl font-bold sm:text-4xl">
              It was never really about the thread
            </h2>
            <div className="mt-5 space-y-4 text-[0.9375rem] leading-relaxed text-ink-soft">
              <p>
                Every August, the same scramble: three shops, no parking, and the good rakhis gone
                by the 5th. We started {SITE.name} because a festival about showing up shouldn&apos;t
                begin with a traffic jam.
              </p>
              <p>
                We source directly from artisan clusters in Jaipur and Moradabad, check every piece
                by hand, and box each order the morning it ships. If you live in{" "}
                {SITE.society.split(",")[0]}, we walk it over ourselves.
              </p>
            </div>

            <dl className="mt-8 grid grid-cols-3 gap-4 border-t border-cream-300 pt-6">
              {[
                { k: "20+", v: "Handpicked designs" },
                { k: "6 PM", v: "Same-day cutoff" },
                { k: "₹0", v: "Delivery above ₹499" },
              ].map((s) => (
                <div key={s.k}>
                  <dt className="font-display text-2xl font-bold text-maroon-800">{s.k}</dt>
                  <dd className="mt-0.5 text-xs text-ink-muted">{s.v}</dd>
                </div>
              ))}
            </dl>

            <Link href="/about" className="btn btn-outline mt-8">
              Read our story
            </Link>
          </div>
        </div>
      </section>

      {/* ─────────────────── New arrivals ─────────────────── */}
      <section className="bg-cream-50 py-16 sm:py-20">
        <div className="container-x">
          <SectionHead
            eyebrow="Just in"
            title="New this week"
            subtitle="Fresh designs added ahead of the festival."
          />
          <div className="mt-10">
            <ProductGrid products={arrivals} priorityCount={0} />
          </div>
        </div>
      </section>

      {/* ─────────────────── Reviews ─────────────────── */}
      <section className="container-x py-16 sm:py-20">
        <SectionHead
          eyebrow="From our neighbours"
          title="What people say"
          align="center"
        />
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {[
            {
              name: "Meera Joshi",
              tower: "Tower B, Sector 76",
              text: "Ordered at 4 PM, it was at my door by 7. The kundan rakhi looked far more expensive than what I paid.",
            },
            {
              name: "Arjun Sethi",
              tower: "Tower D, Sector 76",
              text: "The bhaiya-bhabhi set was beautifully boxed. My sister-in-law asked where I got it from, which is the real review.",
            },
            {
              name: "Sneha Reddy",
              tower: "Tower A, Sector 76",
              text: "Cash on delivery made it easy for my mother to order without calling me for the UPI PIN. Small thing, big deal.",
            },
          ].map((r) => (
            <figure key={r.name} className="card flex flex-col p-6">
              <div className="flex gap-0.5 text-gold-500">
                {Array.from({ length: 5 }).map((_, i) => (
                  <StarIcon key={i} filled className="size-4" />
                ))}
              </div>
              <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-ink-soft">
                &ldquo;{r.text}&rdquo;
              </blockquote>
              <figcaption className="mt-5 border-t border-cream-300 pt-4">
                <p className="text-sm font-semibold">{r.name}</p>
                <p className="text-xs text-ink-muted">{r.tower}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* ─────────────────── CTA ─────────────────── */}
      <section className="container-x pb-4">
        <div className="relative overflow-hidden rounded-xl2 bg-gradient-to-br from-maroon-800 via-maroon-900 to-maroon-950 px-6 py-14 text-center shadow-[var(--shadow-glow)] sm:px-12 sm:py-20">
          <div aria-hidden className="grain-overlay" />
          <div
            aria-hidden
            className="absolute -right-16 -top-16 size-64 rounded-full bg-gold-500/20 blur-3xl"
          />
          <div className="relative">
            <p className="eyebrow text-gold-400">Don&apos;t leave it to the 8th</p>
            <h2 className="mx-auto mt-3 max-w-2xl font-display text-3xl font-bold text-cream-50 sm:text-4xl">
              The good ones sell out first. They always do.
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-sm text-cream-200/75 sm:text-base">
              Order now, pay cash when it arrives. Nothing to set up, nothing to remember.
            </p>
            <Link href="/products" className="btn btn-gold mt-8">
              Start shopping
              <ChevronRight className="size-4" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

function SectionHead({
  eyebrow,
  title,
  subtitle,
  align = "left",
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  align?: "left" | "center";
}) {
  return (
    <div className={align === "center" ? "mx-auto max-w-xl text-center" : "max-w-xl"}>
      <p className="eyebrow">{eyebrow}</p>
      <h2 className="mt-2.5 font-display text-3xl font-bold sm:text-4xl">{title}</h2>
      {subtitle && <p className="mt-3 text-[0.9375rem] text-ink-muted">{subtitle}</p>}
    </div>
  );
}
