import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { OrderForm } from "@/components/admin/order-form";

type Params = Promise<{ id: string }>;

const EDITABLE_STATUSES = ["PENDING", "PROCESSING"];

export async function generateMetadata({ params }: { params: Params }) {
  const { id } = await params;
  const order = await prisma.order.findUnique({ where: { id }, select: { orderNumber: true } });
  return { title: order ? `Edit ${order.orderNumber}` : "Edit order" };
}

export default async function EditOrderPage({ params }: { params: Params }) {
  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: { include: { product: { select: { inventory: true } } } } },
  });

  if (!order) notFound();

  // Belt-and-suspenders alongside the transaction-level status re-check in
  // updateOrderItems — a stale/bookmarked link can't reach the form either.
  if (!EDITABLE_STATUSES.includes(order.status)) {
    redirect(`/admin/orders/${order.id}`);
  }

  return (
    <div className="space-y-5">
      <h1 className="font-display text-2xl font-bold sm:text-3xl">Edit {order.orderNumber}</h1>

      <OrderForm
        initial={{
          id: order.id,
          contactName: order.contactName,
          contactPhone: order.contactPhone,
          contactEmail: order.contactEmail ?? "",
          addressLine1: order.addressLine1,
          flat: order.flat ?? "",
          addressLine2: order.addressLine2 ?? "",
          landmark: order.landmark ?? "",
          city: order.city,
          state: order.state,
          pincode: order.pincode,
          customerNote: order.customerNote ?? "",
          adminNote: "",
          items: order.items.map((item) => ({
            productId: item.productId,
            name: item.nameSnapshot,
            price: item.unitPrice,
            inventory: item.product?.inventory ?? 0,
            imageUrl: item.imageSnapshot,
            quantity: item.quantity,
            reservedByThisOrder: item.quantity,
          })),
        }}
      />
    </div>
  );
}
