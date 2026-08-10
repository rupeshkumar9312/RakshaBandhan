import { OrderForm } from "@/components/admin/order-form";

export const metadata = { title: "New order" };

export default function NewOrderPage() {
  return (
    <div className="space-y-5">
      <h1 className="font-display text-2xl font-bold sm:text-3xl">New order</h1>
      <OrderForm />
    </div>
  );
}
