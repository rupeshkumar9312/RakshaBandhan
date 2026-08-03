import Link from "next/link";

export default function NotFound() {
  return (
    <div className="grid min-h-[100dvh] place-items-center bg-cream-100 px-4">
      <div className="max-w-md text-center">
        <p className="eyebrow">404</p>
        <h1 className="mt-3 font-display text-4xl font-bold sm:text-5xl">
          This thread leads nowhere
        </h1>
        <p className="mt-4 text-[0.9375rem] leading-relaxed text-ink-muted">
          The page you were after has moved or never existed. The rakhis, happily, are still where
          we left them.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/products" className="btn btn-primary">
            Browse rakhis
          </Link>
          <Link href="/" className="btn btn-outline">
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}
