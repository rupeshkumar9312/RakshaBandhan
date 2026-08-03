import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PageShell } from "@/components/page-shell";
import { sortedPosts } from "@/lib/posts";
import { formatDate } from "@/lib/utils";
import { ChevronRight } from "@/components/icons";

export const metadata: Metadata = {
  title: "Journal",
  description:
    "Buying guides, gift ideas and the history behind Raksha Bandhan, written by the people who pack your orders.",
};

export default function BlogIndexPage() {
  const posts = sortedPosts();
  const [lead, ...rest] = posts;

  return (
    <PageShell
      eyebrow="Journal"
      title="Notes from the shop"
      intro="Buying guides, gift ideas and a bit of history — written between packing orders."
    >
      {lead && (
        <Link
          href={`/blog/${lead.slug}`}
          className="group grid gap-6 overflow-hidden rounded-xl2 border border-cream-300 bg-white shadow-[var(--shadow-soft)] transition-shadow hover:shadow-[var(--shadow-lift)] lg:grid-cols-2"
        >
          <div className="relative aspect-16/10 lg:aspect-auto lg:h-full">
            <Image
              src={lead.image}
              alt=""
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
          </div>

          <div className="flex flex-col justify-center p-6 sm:p-8">
            <div className="flex items-center gap-2 text-xs">
              <span className="chip bg-maroon-100 text-maroon-800">{lead.category}</span>
              <span className="text-ink-muted">
                {formatDate(lead.date)} · {lead.readingMinutes} min read
              </span>
            </div>

            <h2 className="mt-4 font-display text-2xl font-bold leading-tight sm:text-3xl">
              {lead.title}
            </h2>
            <p className="mt-3 text-[0.9375rem] leading-relaxed text-ink-muted">{lead.excerpt}</p>

            <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-maroon-700">
              Read the article <ChevronRight className="size-4" />
            </span>
          </div>
        </Link>
      )}

      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {rest.map((post) => (
          <Link
            key={post.slug}
            href={`/blog/${post.slug}`}
            className="group card flex flex-col overflow-hidden transition-shadow hover:shadow-[var(--shadow-lift)]"
          >
            <div className="relative aspect-16/10 overflow-hidden bg-cream-200">
              <Image
                src={post.image}
                alt=""
                fill
                sizes="(max-width: 640px) 100vw, 33vw"
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
            </div>

            <div className="flex flex-1 flex-col p-5">
              <div className="flex items-center gap-2 text-xs">
                <span className="chip bg-cream-200 text-ink-soft">{post.category}</span>
                <span className="text-ink-muted">{post.readingMinutes} min</span>
              </div>

              <h2 className="mt-3 font-display text-lg font-bold leading-snug">{post.title}</h2>
              <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-ink-muted">
                {post.excerpt}
              </p>
              <p className="mt-4 text-xs text-ink-muted">{formatDate(post.date)}</p>
            </div>
          </Link>
        ))}
      </div>
    </PageShell>
  );
}
