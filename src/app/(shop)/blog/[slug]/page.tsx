import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPost, sortedPosts } from "@/lib/posts";
import { formatDate } from "@/lib/utils";
import { SITE } from "@/lib/site";
import { ChevronLeft, ChevronRight } from "@/components/icons";

type Params = Promise<{ slug: string }>;

export function generateStaticParams() {
  return sortedPosts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return { title: "Article not found" };

  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      type: "article",
      title: post.title,
      description: post.excerpt,
      publishedTime: post.date,
      images: [{ url: post.image }],
    },
  };
}

export default async function BlogPostPage({ params }: { params: Params }) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  const others = sortedPosts()
    .filter((p) => p.slug !== post.slug)
    .slice(0, 3);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    datePublished: post.date,
    image: `${SITE.url}${post.image}`,
    author: { "@type": "Organization", name: SITE.name },
    publisher: { "@type": "Organization", name: SITE.name },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <article className="container-x py-10 sm:py-14">
        <div className="mx-auto max-w-2xl">
          <Link
            href="/blog"
            className="inline-flex items-center gap-1 text-sm text-ink-muted hover:text-maroon-700"
          >
            <ChevronLeft className="size-4" /> Journal
          </Link>

          <div className="mt-5 flex flex-wrap items-center gap-2 text-xs">
            <span className="chip bg-maroon-100 text-maroon-800">{post.category}</span>
            <span className="text-ink-muted">
              {formatDate(post.date)} · {post.readingMinutes} min read
            </span>
          </div>

          <h1 className="mt-4 font-display text-3xl font-bold leading-tight sm:text-4xl">
            {post.title}
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-ink-muted">{post.excerpt}</p>
        </div>

        <div className="relative mx-auto mt-8 aspect-16/9 max-w-3xl overflow-hidden rounded-xl2">
          <Image
            src={post.image}
            alt=""
            fill
            priority
            sizes="(max-width: 768px) 100vw, 768px"
            className="object-cover"
          />
        </div>

        <div className="mx-auto mt-10 max-w-2xl space-y-5 text-[1.0625rem] leading-relaxed text-ink-soft">
          {post.body.map((para, i) => (
            <p key={i} className={i === 0 ? "text-lg text-ink" : undefined}>
              {para}
            </p>
          ))}
        </div>

        <div className="mx-auto mt-12 max-w-2xl rounded-xl2 bg-gradient-to-br from-maroon-800 to-maroon-950 p-8 text-center">
          <p className="eyebrow text-gold-400">Ready when you are</p>
          <h2 className="mt-2 font-display text-2xl font-bold text-cream-50">
            Twenty designs, delivered the same evening
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-cream-200/75">
            Cash on Delivery, free above ₹499, and we call before we come.
          </p>
          <Link href="/products" className="btn btn-gold mt-6">
            Shop the collection <ChevronRight className="size-4" />
          </Link>
        </div>

        {others.length > 0 && (
          <section className="mx-auto mt-14 max-w-4xl border-t border-cream-300 pt-10">
            <h2 className="font-display text-2xl font-bold">Keep reading</h2>
            <div className="mt-6 grid gap-5 sm:grid-cols-3">
              {others.map((p) => (
                <Link key={p.slug} href={`/blog/${p.slug}`} className="group">
                  <div className="relative aspect-16/10 overflow-hidden rounded-xl bg-cream-200">
                    <Image
                      src={p.image}
                      alt=""
                      fill
                      sizes="(max-width: 640px) 100vw, 33vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  </div>
                  <h3 className="mt-3 font-semibold leading-snug group-hover:text-maroon-700">
                    {p.title}
                  </h3>
                  <p className="mt-1 text-xs text-ink-muted">{p.readingMinutes} min read</p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </article>
    </>
  );
}
