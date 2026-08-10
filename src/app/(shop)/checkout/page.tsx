import type { Metadata } from "next";
import { CheckoutForm } from "@/components/checkout-form";
import { prisma } from "@/lib/db";

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false, follow: false },
};

export default async function CheckoutPage() {
  const societies = await prisma.society.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    select: { id: true, name: true },
  });

  return (
    <div className="container-x py-10 sm:py-14">
      <h1 className="font-display text-3xl font-bold sm:text-4xl">Checkout</h1>
      <p className="mt-2 text-[0.9375rem] text-ink-muted">
        Three quick steps. You pay in cash when the order reaches you.
      </p>

      <div className="mt-8">
        <CheckoutForm societies={societies} />
      </div>
    </div>
  );
}
