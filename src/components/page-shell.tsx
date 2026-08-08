import Link from "next/link";

/** Shared header for the simple content pages (about, FAQ, policies…). */
export function PageShell({
  eyebrow,
  title,
  intro,
  children,
}: {
  eyebrow: string;
  title: string;
  intro?: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <section className="border-b border-cream-300 bg-gradient-to-b from-cream-50 to-cream-100">
        <div className="container-x py-12 sm:py-16">
          <nav aria-label="Breadcrumb" className="mb-3 text-xs text-ink-muted">
            <Link href="/rakhi-bazaar" className="hover:text-maroon-700">
              Home
            </Link>
            <span className="mx-1.5">/</span>
            <span className="text-ink-soft">{title}</span>
          </nav>
          <p className="eyebrow">{eyebrow}</p>
          <h1 className="mt-2 font-display text-3xl font-bold sm:text-5xl">{title}</h1>
          {intro && (
            <p className="mt-4 max-w-2xl text-[0.9375rem] leading-relaxed text-ink-muted sm:text-base">
              {intro}
            </p>
          )}
        </div>
      </section>

      <div className="container-x py-12 sm:py-16">{children}</div>
    </>
  );
}

/** Long-form body copy with sensible vertical rhythm. */
export function Prose({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-2xl space-y-5 text-[0.9375rem] leading-relaxed text-ink-soft [&_h2]:mt-10 [&_h2]:font-display [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-ink [&_h3]:mt-6 [&_h3]:font-bold [&_h3]:text-ink [&_li]:ml-5 [&_li]:list-disc [&_strong]:text-ink [&_ul]:space-y-2">
      {children}
    </div>
  );
}
