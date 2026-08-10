import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { SocietyForm } from "@/components/admin/society-form";

type Params = Promise<{ id: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  const { id } = await params;
  const society = await prisma.society.findUnique({ where: { id }, select: { name: true } });
  return { title: society ? `Edit ${society.name}` : "Edit society" };
}

export default async function EditSocietyPage({ params }: { params: Params }) {
  const { id } = await params;

  const society = await prisma.society.findUnique({ where: { id } });
  if (!society) notFound();

  return (
    <div className="space-y-5">
      <h1 className="font-display text-2xl font-bold sm:text-3xl">{society.name}</h1>

      <SocietyForm
        initial={{
          id: society.id,
          name: society.name,
          sortOrder: society.sortOrder,
          isActive: society.isActive,
        }}
      />
    </div>
  );
}
