import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { CategoryForm } from "@/components/admin/category-form";

type Params = Promise<{ id: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  const { id } = await params;
  const category = await prisma.category.findUnique({ where: { id }, select: { name: true } });
  return { title: category ? `Edit ${category.name}` : "Edit category" };
}

export default async function EditCategoryPage({ params }: { params: Params }) {
  const { id } = await params;

  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) notFound();

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold sm:text-3xl">{category.name}</h1>
        <Link
          href={`/products?category=${category.slug}`}
          target="_blank"
          className="text-sm font-semibold text-maroon-700 hover:underline"
        >
          View in store ↗
        </Link>
      </div>

      <CategoryForm
        initial={{
          id: category.id,
          name: category.name,
          slug: category.slug,
          description: category.description ?? "",
          imageUrl: category.imageUrl ?? "",
          sortOrder: category.sortOrder,
          isActive: category.isActive,
        }}
      />
    </div>
  );
}