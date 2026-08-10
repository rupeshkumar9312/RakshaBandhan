import { CategoryForm } from "@/components/admin/category-form";

export const metadata = { title: "New category" };

export default function NewCategoryPage() {
  return (
    <div className="space-y-5">
      <h1 className="font-display text-2xl font-bold sm:text-3xl">New category</h1>
      <CategoryForm />
    </div>
  );
}