import type { Metadata } from "next";
import { CartPageView } from "@/components/cart-page-view";

export const metadata: Metadata = {
  title: "Your cart",
  robots: { index: false, follow: false },
};

export default function CartPage() {
  return <CartPageView />;
}
