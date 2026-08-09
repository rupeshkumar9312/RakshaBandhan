"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useCart } from "@/components/cart-provider";
import { CartIcon, SearchIcon, MenuIcon, CloseIcon, LogoMark } from "@/components/icons";
import { cn } from "@/lib/utils";
import { SITE } from "@/lib/site";

type NavCategory = { name: string; slug: string };

export function SiteHeader({ categories }: { categories: NavCategory[] }) {
  const { count, openCart, hydrated } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    router.push(q ? `/products?q=${encodeURIComponent(q)}` : "/products");
    setSearchOpen(false);
  }

  const navLinks = [
    { href: "/products", label: "All rakhis" },
    ...categories
      .slice(0, 4)
      .map((c) => ({ href: `/products?category=${c.slug}`, label: c.name })),
    { href: "/about", label: "Our story" },
  ];

  return (
    <>
      {/* Announcement bar */}
      <div className="relative overflow-hidden border-b border-gold-400/15 bg-maroon-950 text-cream-100">
        <div className="flex whitespace-nowrap py-2 animate-[marquee_32s_linear_infinite]">
          {[0, 1].map((k) => (
            <div
              key={k}
              className="flex shrink-0 items-center gap-10 pr-10 text-xs font-medium text-cream-200/90"
            >
              <span>✦ Free delivery</span>
              <span>✦ Cash on Delivery available</span>
              <span>
                ✦ Same-day delivery inside {SITE.society.split(",")[0]}, Sector 168, Noida
              </span>
              <span>
                ✦ Same-day delivery inside Paras Seasons, Sector 168, Noida
              </span>
              <span>
                ✦ Same-day delivery inside Lotus Zing, Sector 168, Noida
              </span>

              <span className="text-gold-300">
                ✦ Raksha Bandhan — {SITE.festivalDate}
              </span>
            </div>
          ))}
        </div>
      </div>

      <header
        className={cn(
          "shell-dark sticky top-0 z-40 border-b border-gold-400/10 transition-shadow duration-300",
          scrolled && "shadow-[0_8px_30px_-12px_rgba(0,0,0,0.6)]",
        )}
      >
        <div className="container-x flex h-16 items-center gap-3 sm:h-18">
          <button
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
            className="-ml-2 grid size-10 place-items-center rounded-full text-cream-100 transition-colors hover:bg-white/8 lg:hidden"
          >
            <MenuIcon className="size-5.5" />
          </button>

          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <span className="grid size-9 place-items-center rounded-full bg-gradient-to-br from-gold-300 via-gold-500 to-gold-600 text-maroon-950 shadow-[var(--shadow-gold)] sm:size-10">
              <LogoMark className="size-5 sm:size-5.5" />
            </span>
            <span className="leading-none">
              <span className="block font-display text-lg font-bold tracking-tight text-cream-50 sm:text-xl">
                {SITE.name}
              </span>
              <span className="hidden text-[0.625rem] font-medium tracking-[0.18em] text-gold-400 uppercase sm:block">
                Noida
              </span>
            </span>
          </Link>

          <nav className="ml-6 hidden flex-1 items-center gap-1 lg:flex">
            {navLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="rounded-full px-3 py-2 text-sm font-medium text-cream-200/85 transition-colors hover:bg-white/8 hover:text-gold-300"
              >
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-0.5">
            <button
              onClick={() => setSearchOpen((v) => !v)}
              aria-label="Search"
              aria-expanded={searchOpen}
              className="grid size-10 place-items-center rounded-full text-cream-100 transition-colors hover:bg-white/8"
            >
              {searchOpen ? (
                <CloseIcon className="size-5" />
              ) : (
                <SearchIcon className="size-5" />
              )}
            </button>

            <button
              onClick={openCart}
              aria-label={`Cart, ${count} items`}
              className="relative grid size-10 place-items-center rounded-full text-cream-100 transition-colors hover:bg-white/8"
            >
              <CartIcon className="size-5.5" />
              {hydrated && count > 0 && (
                <span className="absolute -right-0.5 -top-0.5 grid min-w-5 place-items-center rounded-full bg-gradient-to-br from-gold-300 to-gold-500 px-1 text-[0.625rem] font-bold text-maroon-950 tabular-nums">
                  {count > 99 ? "99+" : count}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Search bar */}
        <div
          className={cn(
            "overflow-hidden border-white/10 transition-all duration-300",
            searchOpen ? "max-h-24 border-t" : "max-h-0",
          )}
        >
          <form onSubmit={submitSearch} className="container-x flex gap-2 py-3">
            <div className="relative flex-1">
              <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 size-4.5 -translate-y-1/2 text-ink-muted" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search kundan, silver, hampers…"
                aria-label="Search products"
                autoFocus={searchOpen}
                className="field pl-11"
              />
            </div>
            <button type="submit" className="btn btn-gold btn-sm px-5">
              Search
            </button>
          </form>
        </div>
      </header>

      {/* Mobile drawer */}
      <div
        onClick={() => setMenuOpen(false)}
        aria-hidden
        className={cn(
          "fixed inset-0 z-50 bg-ink/45 backdrop-blur-[2px] transition-opacity duration-300 lg:hidden",
          menuOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />
      <nav
        aria-label="Main menu"
        className={cn(
          "shell-dark fixed left-0 top-0 z-51 h-[100dvh] w-[82%] max-w-xs text-cream-100 shadow-2xl transition-transform duration-350 ease-[cubic-bezier(0.16,1,0.3,1)] lg:hidden",
          menuOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <span className="font-display text-lg font-bold text-cream-50">
            {SITE.name}
          </span>
          <button
            onClick={() => setMenuOpen(false)}
            aria-label="Close menu"
            className="grid size-9 place-items-center rounded-full hover:bg-white/8"
          >
            <CloseIcon className="size-5" />
          </button>
        </div>

        <div className="overflow-y-auto p-3">
          <p className="eyebrow px-3 pb-2 pt-3 text-gold-400">Shop</p>
          <Link
            href="/products"
            className="block rounded-xl px-3 py-3 font-semibold text-cream-50 transition-colors hover:bg-white/8"
          >
            All rakhis
          </Link>
          {categories.map((c) => (
            <Link
              key={c.slug}
              href={`/products?category=${c.slug}`}
              className="block rounded-xl px-3 py-3 text-cream-200/85 transition-colors hover:bg-white/8"
            >
              {c.name}
            </Link>
          ))}

          <div className="my-3 h-px bg-gradient-to-r from-transparent via-gold-400/35 to-transparent" />
          <p className="eyebrow px-3 pb-2 text-gold-400">More</p>
          {[
            { href: "/about", label: "Our story" },
            { href: "/faq", label: "FAQ" },
            { href: "/track", label: "Track order" },
          ].map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="block rounded-xl px-3 py-3 text-cream-200/85 transition-colors hover:bg-white/8"
            >
              {l.label}
            </Link>
          ))}

          <a
            href={`tel:${SITE.phone.replace(/\s/g, "")}`}
            className="btn mt-4 w-full border border-gold-400/40 text-gold-300 hover:bg-gold-400 hover:text-maroon-950"
          >
            Call {SITE.phone}
          </a>
        </div>
      </nav>
    </>
  );
}
