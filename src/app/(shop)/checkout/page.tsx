import type { Metadata } from "next";
import { CheckoutForm } from "@/components/checkout-form";

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false, follow: false },
};

export default function CheckoutPage() {
  return (
    <div className="container-x py-10 sm:py-14">
      <h1 className="font-display text-3xl font-bold sm:text-4xl">Checkout</h1>
      <p className="mt-2 text-[0.9375rem] text-ink-muted">
        Three quick steps. You pay in cash when the order reaches you.
      </p>

      <div className="mt-8">
        <CheckoutForm />
      </div>
    </div>
  );
}
