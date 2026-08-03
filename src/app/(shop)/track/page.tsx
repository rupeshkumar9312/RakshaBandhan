import type { Metadata } from "next";
import { TrackOrderForm } from "@/components/track-order-form";

export const metadata: Metadata = {
  title: "Track your order",
  description: "Look up the status of your Rakhi Bazaar order using your order number and phone.",
};

export default function TrackPage() {
  return (
    <div className="container-x py-12 sm:py-16">
      <div className="mx-auto max-w-lg">
        <p className="eyebrow">Order status</p>
        <h1 className="mt-2 font-display text-3xl font-bold sm:text-4xl">Track your order</h1>
        <p className="mt-3 text-[0.9375rem] text-ink-muted">
          Enter the order number from your confirmation page along with the phone number you
          ordered with.
        </p>

        <div className="mt-8">
          <TrackOrderForm />
        </div>
      </div>
    </div>
  );
}
