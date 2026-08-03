import { prisma } from "@/lib/db";
import { ProductForm } from "@/components/admin/product-form";

export const metadata = { title: "New product" };

export default async function NewProductPage() {
  const categories = await prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
    select: { id: true, name: true },
  });

  return (
    <div className="space-y-5">
      <h1 className="font-display text-2xl font-bold sm:text-3xl">New product</h1>
      <ProductForm categories={categories} />
    </div>
  );
}
