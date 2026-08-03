"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Swap for a real error reporter (Sentry et al.) before going live.
    console.error("Unhandled application error:", error);
  }, [error]);

  return (
    <div className="grid min-h-[100dvh] place-items-center bg-cream-100 px-4">
      <div className="max-w-md text-center">
        <p className="eyebrow">Something broke</p>
        <h1 className="mt-3 font-display text-3xl font-bold sm:text-4xl">
          That did not go to plan
        </h1>
        <p className="mt-4 text-[0.9375rem] leading-relaxed text-ink-muted">
          An unexpected error stopped this page from loading. Trying again usually works — if it
          does not, give us a call and we will take the order over the phone.
        </p>

        {error.digest && (
          <p className="mt-4 font-mono text-xs text-ink-muted">Reference: {error.digest}</p>
        )}

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button onClick={reset} className="btn btn-primary">
            Try again
          </button>
          <Link href="/" className="btn btn-outline">
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}
