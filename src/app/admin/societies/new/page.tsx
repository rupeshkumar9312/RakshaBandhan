import { SocietyForm } from "@/components/admin/society-form";

export const metadata = { title: "New society" };

export default function NewSocietyPage() {
  return (
    <div className="space-y-5">
      <h1 className="font-display text-2xl font-bold sm:text-3xl">New society</h1>
      <SocietyForm />
    </div>
  );
}
