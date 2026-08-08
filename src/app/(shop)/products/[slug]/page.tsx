import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductGallery } from "@/components/product-gallery";
import { AddToCart } from "@/components/add-to-cart";
import { ProductGrid } from "@/components/product-card";
import { ReviewForm } from "@/components/review-form";
import {
  getProductBySlug,
  getRelatedProducts,
  ratingSummary,
} from "@/lib/queries";
import {
  formatPaise,
  discountPercent,
  FREE_SHIPPING_THRESHOLD,
} from "@/lib/money";
import { parseTags, formatDate, estimatedDelivery } from "@/lib/utils";
import { SITE } from "@/lib/site";
import {
  StarIcon,
  TruckIcon,
  CashIcon,
  ShieldIcon,
  CheckIcon,
} from "@/components/icons";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Product not found" };

  return {
    title: product.name,
    description: product.shortDesc ?? product.description.slice(0, 155),
    openGraph: {
      title: product.name,
      description: product.shortDesc ?? product.description.slice(0, 155),
      images: product.images[0] ? [{ url: product.images[0].url }] : undefined,
    },
  };
}

export default async function ProductPage({ params }: { params: Params }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const related = await getRelatedProducts(product.categoryId, product.id, 4);
  const { average, count } = ratingSummary(product.reviews);
  const off = discountPercent(product.price, product.compareAtPrice);
  const tags = parseTags(product.tags);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.images.map((i) => `${SITE.url}${i.url}`),
    sku: product.sku ?? product.id,
    brand: { "@type": "Brand", name: SITE.name },
    offers: {
      "@type": "Offer",
      priceCurrency: "INR",
      price: (product.price / 100).toFixed(2),
      availability:
        product.inventory > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
    },
    ...(count > 0 && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: average,
        reviewCount: count,
      },
    }),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="container-x py-6 sm:py-10">
        <nav aria-label="Breadcrumb" className="mb-6 text-xs text-ink-muted">
          <Link href="/" className="hover:text-maroon-700">
            Home
          </Link>
          <span className="mx-1.5">/</span>
          <Link href="/products" className="hover:text-maroon-700">
            Rakhis
          </Link>
          <span className="mx-1.5">/</span>
          <Link
            href={`/products?category=${product.category.slug}`}
            className="hover:text-maroon-700"
          >
            {product.category.name}
          </Link>
        </nav>

        <div className="grid gap-8 lg:grid-cols-2 lg:gap-14">
          <div className="lg:sticky lg:top-24 lg:self-start">
            <ProductGallery
              images={product.images}
              productName={product.name}
            />
          </div>

          <div>
            <p className="eyebrow">{product.category.name}</p>
            <h1 className="mt-2 font-display text-3xl font-bold leading-tight sm:text-4xl">
              {product.name}
            </h1>

            {count > 0 && (
              <a
                href="#reviews"
                className="mt-3 inline-flex items-center gap-2 text-sm"
              >
                <span className="flex gap-0.5 text-gold-500">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <StarIcon
                      key={i}
                      filled={i < Math.round(average)}
                      className="size-4"
                    />
                  ))}
                </span>
                <span className="font-semibold">{average}</span>
                <span className="text-ink-muted">
                  ({count} review{count === 1 ? "" : "s"})
                </span>
              </a>
            )}

            <div className="mt-5 flex flex-wrap items-baseline gap-3">
              <span className="font-display text-4xl font-bold text-maroon-800">
                {formatPaise(product.price)}
              </span>
              {product.compareAtPrice && (
                <>
                  <span className="text-lg text-ink-muted line-through">
                    {formatPaise(product.compareAtPrice)}
                  </span>
                  <span className="chip bg-maroon-100 text-maroon-800">
                    {off}% off
                  </span>
                </>
              )}
            </div>
            <p className="mt-1 text-xs text-ink-muted">
              Inclusive of all taxes
            </p>

            {product.shortDesc && (
              <p className="mt-5 text-[0.9375rem] leading-relaxed text-ink-soft">
                {product.shortDesc}
              </p>
            )}

            {/* Stock signal */}
            <div className="mt-5">
              {product.inventory <= 0 ? (
                <span className="chip bg-cream-200 text-ink-muted">
                  Out of stock
                </span>
              ) : product.inventory <= 5 ? (
                <span className="chip bg-maroon-100 text-maroon-800">
                  Hurry — only {product.inventory} left
                </span>
              ) : (
                <span className="chip bg-emerald-100 text-emerald-800">
                  <CheckIcon className="size-3.5" /> In stock
                </span>
              )}
            </div>

            <div className="mt-7">
              <AddToCart
                productId={product.id}
                slug={product.slug}
                name={product.name}
                price={product.price}
                image={product.images[0]?.url ?? null}
                inventory={product.inventory}
              />
            </div>

            {/* Delivery promises */}
            <ul className="mt-7 space-y-3 rounded-xl2 border border-cream-300 bg-cream-50 p-5">
              {[
                {
                  Icon: TruckIcon,
                  title: `Arrives by ${estimatedDelivery()}`,
                  body: `Same evening inside ${SITE.society.split(",")[0]} if you order before 6 PM.`,
                },
                {
                  Icon: CashIcon,
                  title: "Cash on Delivery",
                  body: `Pay at your door. Free delivery. `,
                },
                {
                  Icon: ShieldIcon,
                  title: "Damage-free promise",
                  body: "Anything that arrives damaged is replaced free.",
                },
              ].map(({ Icon, title, body }) => (
                <li key={title} className="flex gap-3">
                  <Icon className="mt-0.5 size-5 shrink-0 text-maroon-700" />
                  <div>
                    <p className="text-sm font-semibold">{title}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-ink-muted">
                      {body}
                    </p>
                  </div>
                </li>
              ))}
            </ul>

            {/* Details */}
            <div className="mt-8">
              <h2 className="text-sm font-bold">About this rakhi</h2>
              <p className="mt-3 text-[0.9375rem] leading-relaxed text-ink-soft">
                {product.description}
              </p>

              <dl className="mt-6 divide-y divide-cream-300 border-y border-cream-300 text-sm">
                {product.material && (
                  <div className="flex gap-4 py-3">
                    <dt className="w-28 shrink-0 font-semibold text-ink-soft">
                      Material
                    </dt>
                    <dd className="text-ink-muted">{product.material}</dd>
                  </div>
                )}
                {product.sku && (
                  <div className="flex gap-4 py-3">
                    <dt className="w-28 shrink-0 font-semibold text-ink-soft">
                      SKU
                    </dt>
                    <dd className="text-ink-muted tabular-nums">
                      {product.sku}
                    </dd>
                  </div>
                )}
                <div className="flex gap-4 py-3">
                  <dt className="w-28 shrink-0 font-semibold text-ink-soft">
                    Collection
                  </dt>
                  <dd className="text-ink-muted">{product.category.name}</dd>
                </div>
              </dl>

              {tags.length > 0 && (
                <div className="mt-5 flex flex-wrap gap-2">
                  {tags.map((t) => (
                    <Link
                      key={t}
                      href={`/products?q=${encodeURIComponent(t)}`}
                      className="chip border border-cream-300 bg-white text-ink-muted transition-colors hover:border-maroon-300 hover:text-maroon-700"
                    >
                      #{t}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Reviews */}
        <section
          id="reviews"
          className="mt-16 scroll-mt-24 border-t border-cream-300 pt-12"
        >
          <div className="grid gap-10 lg:grid-cols-[20rem_1fr]">
            <div>
              <h2 className="font-display text-2xl font-bold sm:text-3xl">
                Customer reviews
              </h2>
              {count > 0 ? (
                <div className="mt-4">
                  <div className="flex items-center gap-3">
                    <span className="font-display text-4xl font-bold text-maroon-800">
                      {average}
                    </span>
                    <div>
                      <span className="flex gap-0.5 text-gold-500">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <StarIcon
                            key={i}
                            filled={i < Math.round(average)}
                            className="size-4"
                          />
                        ))}
                      </span>
                      <p className="mt-1 text-xs text-ink-muted">
                        Based on {count} review{count === 1 ? "" : "s"}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="mt-3 text-sm text-ink-muted">
                  No reviews yet — be the first to write one.
                </p>
              )}

              <div className="mt-8">
                <ReviewForm productId={product.id} />
              </div>
            </div>

            <div>
              {product.reviews.length === 0 ? (
                <div className="card grid place-items-center px-6 py-16 text-center text-sm text-ink-muted">
                  Reviews from other customers will show up here.
                </div>
              ) : (
                <ul className="space-y-4">
                  {product.reviews.map((r) => (
                    <li key={r.id} className="card p-5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <span className="grid size-9 place-items-center rounded-full bg-maroon-100 text-sm font-bold text-maroon-800">
                            {r.authorName.charAt(0).toUpperCase()}
                          </span>
                          <div>
                            <p className="text-sm font-semibold">
                              {r.authorName}
                            </p>
                            <p className="text-xs text-ink-muted">
                              {formatDate(r.createdAt)}
                            </p>
                          </div>
                        </div>
                        <span className="flex gap-0.5 text-gold-500">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <StarIcon
                              key={i}
                              filled={i < r.rating}
                              className="size-3.5"
                            />
                          ))}
                        </span>
                      </div>
                      {r.title && (
                        <p className="mt-3.5 font-semibold">{r.title}</p>
                      )}
                      <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
                        {r.body}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>

        {/* Related */}
        {related.length > 0 && (
          <section className="mt-16 border-t border-cream-300 pt-12">
            <p className="eyebrow">You might also like</p>
            <h2 className="mt-2 font-display text-2xl font-bold sm:text-3xl">
              More from {product.category.name}
            </h2>
            <div className="mt-8">
              <ProductGrid products={related} priorityCount={0} />
            </div>
          </section>
        )}
      </div>
    </>
  );
}
