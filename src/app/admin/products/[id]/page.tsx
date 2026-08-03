import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { ProductForm } from "@/components/admin/product-form";

type Params = Promise<{ id: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  const { id } = await params;
  const product = await prisma.product.findUnique({ where: { id }, select: { name: true } });
  return { title: product ? `Edit ${product.name}` : "Edit product" };
}

export default async function EditProductPage({ params }: { params: Params }) {
  const { id } = await params;

  const [product, categories] = await Promise.all([
    prisma.product.findUnique({
      where: { id },
      include: { images: { orderBy: { sortOrder: "asc" } } },
    }),
    prisma.category.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true } }),
  ]);

  if (!product) notFound();

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold sm:text-3xl">{product.name}</h1>
        <Link
          href={`/products/${product.slug}`}
          target="_blank"
          className="text-sm font-semibold text-maroon-700 hover:underline"
        >
          View in store ↗
        </Link>
      </div>

      <ProductForm
        categories={categories}
        initial={{
          id: product.id,
          name: product.name,
          slug: product.slug,
          description: product.description,
          shortDesc: product.shortDesc ?? "",
          price: product.price,
          compareAtPrice: product.compareAtPrice,
          sku: product.sku ?? "",
          inventory: product.inventory,
          categoryId: product.categoryId,
          tags: product.tags,
          material: product.material ?? "",
          isActive: product.isActive,
          isFeatured: product.isFeatured,
          images: product.images.map((i) => i.url),
        }}
      />
    </div>
  );
}
