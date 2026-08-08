import Image from "next/image";
import Link from "next/link";
import { SITE } from "@/lib/site";
import { ChevronRight, SparkleIcon } from "@/components/icons";

const HERO_IMG = "/hero/hero-bg.jpg";

const COMING_SOON = ["Diwali", "Birthdays", "Anniversaries", "Weddings"];

export default function HomePage() {
  return (
    <section className="shell-dark relative overflow-hidden">
      <div aria-hidden className="grain-overlay" />
      <div
        aria-hidden
        className="absolute -right-24 -top-24 size-96 rounded-full bg-gold-500/15 blur-3xl animate-[floatSlow_9s_ease-in-out_infinite]"
      />
      <div
        aria-hidden
        className="absolute -bottom-32 -left-20 size-80 rounded-full bg-maroon-500/15 blur-3xl"
      />

      <div className="container-x relative flex min-h-[92vh] flex-col justify-center gap-12 py-20 sm:gap-14">
        <div className="mx-auto max-w-2xl text-center animate-[rise_0.7s_cubic-bezier(0.16,1,0.3,1)_both]">
          <span className="chip border border-gold-400/35 bg-gold-400/10 text-gold-300 backdrop-blur-sm">
            <SparkleIcon className="size-3.5" />
            Now live
          </span>
          <h1 className="mt-5 font-display text-4xl font-bold leading-[1.08] text-cream-50 sm:text-5xl lg:text-6xl">
            {SITE.name}
          </h1>
          <p className="mt-3 font-display text-xl text-gold-300 sm:text-2xl">{SITE.tagline}</p>
          <p className="mx-auto mt-5 max-w-lg text-sm leading-relaxed text-cream-200/75 sm:text-base">
            One partner for every occasion that matters to you. We&apos;re opening our doors with
            the festival that started it all — the rest of the calendar is on its way.
          </p>
        </div>

        {/* Featured occasion */}
        <Link
          href="/rakhi-bazaar"
          className="group relative mx-auto block w-full max-w-3xl overflow-hidden rounded-xl2 border border-gold-400/20 shadow-[var(--shadow-glow)] transition-transform duration-500 hover:-translate-y-1"
        >
          <div className="relative aspect-4/3 sm:aspect-21/9">
            <Image
              src={HERO_IMG}
              alt=""
              fill
              sizes="(max-width: 768px) 100vw, 768px"
              priority
              className="object-cover object-center transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-maroon-950/95 via-maroon-950/50 to-maroon-950/15" />
            <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-10">
              <p className="eyebrow text-gold-400">Festive season · {SITE.festivalDate}</p>
              <h2 className="mt-2 font-display text-3xl font-bold text-cream-50 sm:text-4xl">
                Raksha Bandhan
              </h2>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-cream-200/80 sm:text-base">
                Kundan, silver, meenakari and hampers — step into Rakhi Bazaar, our storefront
                built just for the thread.
              </p>
              <span className="btn btn-gold mt-6 w-fit">
                Enter Rakhi Bazaar
                <ChevronRight className="size-4" />
              </span>
            </div>
          </div>
        </Link>

        {/* Coming soon */}
        <div className="mx-auto flex flex-wrap items-center justify-center gap-2.5">
          <span className="text-xs font-medium tracking-[0.14em] text-cream-300/45 uppercase">
            More occasions soon
          </span>
          {COMING_SOON.map((o) => (
            <span key={o} className="chip border border-white/10 bg-white/5 text-cream-300/55">
              {o}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
