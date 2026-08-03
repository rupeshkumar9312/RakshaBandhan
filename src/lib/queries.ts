import "server-only";
import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";

export const productCardSelect = {
  id: true,
  name: true,
  slug: true,
  shortDesc: true,
  price: true,
  compareAtPrice: true,
  inventory: true,
  tags: true,
  isFeatured: true,
  category: { select: { name: true, slug: true } },
  images: { select: { url: true, alt: true }, orderBy: { sortOrder: "asc" }, take: 1 },
} satisfies Prisma.ProductSelect;

export type ProductCard = Prisma.ProductGetPayload<{ select: typeof productCardSelect }>;

export async function getCategories() {
  return prisma.category.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { products: { where: { isActive: true } } } } },
  });
}

export async function getFeaturedProducts(limit = 8): Promise<ProductCard[]> {
  return prisma.product.findMany({
    where: { isActive: true, isFeatured: true },
    select: productCardSelect,
    orderBy: { sortOrder: "asc" },
    take: limit,
  });
}

export async function getNewArrivals(limit = 8): Promise<ProductCard[]> {
  return prisma.product.findMany({
    where: { isActive: true },
    select: productCardSelect,
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export type CatalogParams = {
  category?: string;
  q?: string;
  sort?: string;
  min?: number;
  max?: number;
  page?: number;
  perPage?: number;
};

export async function getCatalog(params: CatalogParams) {
  const perPage = params.perPage ?? 12;
  const page = Math.max(1, params.page ?? 1);

  const where: Prisma.ProductWhereInput = { isActive: true };

  if (params.category) {
    where.category = { slug: params.category };
  }

  if (params.q) {
    const q = params.q.trim();
    // SQLite connector has no `mode: "insensitive"`; seeded data is
    // lower-cased on the search fields we care about, and LIKE is
    // case-insensitive for ASCII in SQLite by default.
    where.OR = [
      { name: { contains: q } },
      { description: { contains: q } },
      { tags: { contains: q } },
      { material: { contains: q } },
    ];
  }

  if (params.min != null || params.max != null) {
    where.price = {
      ...(params.min != null ? { gte: params.min } : {}),
      ...(params.max != null ? { lte: params.max } : {}),
    };
  }

  const orderBy: Prisma.ProductOrderByWithRelationInput[] =
    params.sort === "price-asc"
      ? [{ price: "asc" }]
      : params.sort === "price-desc"
        ? [{ price: "desc" }]
        : params.sort === "newest"
          ? [{ createdAt: "desc" }]
          : [{ isFeatured: "desc" }, { sortOrder: "asc" }, { createdAt: "desc" }];

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      select: productCardSelect,
      orderBy,
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.product.count({ where }),
  ]);

  return {
    items,
    total,
    page,
    perPage,
    pageCount: Math.max(1, Math.ceil(total / perPage)),
  };
}

export async function getProductBySlug(slug: string) {
  return prisma.product.findFirst({
    where: { slug, isActive: true },
    include: {
      category: true,
      images: { orderBy: { sortOrder: "asc" } },
      reviews: { where: { isApproved: true }, orderBy: { createdAt: "desc" } },
    },
  });
}

export async function getRelatedProducts(
  categoryId: string,
  excludeId: string,
  limit = 4,
): Promise<ProductCard[]> {
  return prisma.product.findMany({
    where: { isActive: true, categoryId, NOT: { id: excludeId } },
    select: productCardSelect,
    orderBy: { isFeatured: "desc" },
    take: limit,
  });
}

export async function getPriceBounds() {
  const agg = await prisma.product.aggregate({
    where: { isActive: true },
    _min: { price: true },
    _max: { price: true },
  });
  return { min: agg._min.price ?? 0, max: agg._max.price ?? 200000 };
}

export function ratingSummary(reviews: { rating: number }[]) {
  if (reviews.length === 0) return { average: 0, count: 0 };
  const sum = reviews.reduce((s, r) => s + r.rating, 0);
  return { average: Math.round((sum / reviews.length) * 10) / 10, count: reviews.length };
}
