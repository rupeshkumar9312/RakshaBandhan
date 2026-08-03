"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { checkoutSchema, reviewSchema, fieldErrors } from "@/lib/validation";
import { shippingFor } from "@/lib/money";
import { buildOrderNumber } from "@/lib/utils";

export type ActionState =
  | { ok: true; orderNumber?: string; publicToken?: string; message?: string }
  | { ok: false; errors: Record<string, string> }
  | null;

/**
 * Places a Cash-on-Delivery order.
 *
 * Prices come from the database, never the client — the cart only supplies
 * product ids and quantities. Stock is re-checked and decremented inside a
 * transaction so two people can't buy the last rakhi.
 */
export async function placeOrder(_prev: ActionState, formData: FormData): Promise<ActionState> {
  let rawItems: unknown;
  try {
    rawItems = JSON.parse(String(formData.get("items") ?? "[]"));
  } catch {
    return { ok: false, errors: { form: "Your cart could not be read. Please try again." } };
  }

  const parsed = checkoutSchema.safeParse({
    contactName: formData.get("contactName"),
    contactPhone: formData.get("contactPhone"),
    contactEmail: formData.get("contactEmail"),
    addressLine1: formData.get("addressLine1"),
    addressLine2: formData.get("addressLine2"),
    tower: formData.get("tower"),
    flat: formData.get("flat"),
    landmark: formData.get("landmark"),
    city: formData.get("city") || "Noida",
    state: formData.get("state") || "Uttar Pradesh",
    pincode: formData.get("pincode"),
    customerNote: formData.get("customerNote"),
    items: rawItems,
  });

  if (!parsed.success) {
    return { ok: false, errors: fieldErrors(parsed.error) };
  }

  const input = parsed.data;

  try {
    const placed = await prisma.$transaction(async (tx) => {
      const products = await tx.product.findMany({
        where: { id: { in: input.items.map((i) => i.productId) }, isActive: true },
        include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } },
      });

      const byId = new Map(products.map((p) => [p.id, p]));

      const lines = input.items.map((item) => {
        const product = byId.get(item.productId);
        if (!product) {
          throw new Error(`UNAVAILABLE:An item in your cart is no longer available.`);
        }
        if (product.inventory < item.quantity) {
          throw new Error(
            `STOCK:${product.name} only has ${product.inventory} left. Please update your cart.`,
          );
        }
        return {
          productId: product.id,
          nameSnapshot: product.name,
          imageSnapshot: product.images[0]?.url ?? null,
          unitPrice: product.price,
          quantity: item.quantity,
          lineTotal: product.price * item.quantity,
        };
      });

      const subtotal = lines.reduce((s, l) => s + l.lineTotal, 0);
      const shippingFee = shippingFor(subtotal);

      // Customers are keyed by phone — repeat buyers reuse the same record.
      const customer = await tx.customer.upsert({
        where: { phone: input.contactPhone },
        update: {
          name: input.contactName,
          ...(input.contactEmail ? { email: input.contactEmail } : {}),
        },
        create: {
          name: input.contactName,
          phone: input.contactPhone,
          email: input.contactEmail ?? null,
        },
      });

      const sequence = (await tx.order.count()) + 1;

      const order = await tx.order.create({
        data: {
          orderNumber: buildOrderNumber(sequence),
          customerId: customer.id,
          contactName: input.contactName,
          contactPhone: input.contactPhone,
          contactEmail: input.contactEmail ?? null,
          addressLine1: input.addressLine1,
          addressLine2: input.addressLine2 || null,
          tower: input.tower || null,
          flat: input.flat || null,
          landmark: input.landmark || null,
          city: input.city,
          state: input.state,
          pincode: input.pincode,
          subtotal,
          shippingFee,
          total: subtotal + shippingFee,
          paymentMethod: "COD",
          customerNote: input.customerNote || null,
          items: { create: lines },
        },
      });

      for (const line of lines) {
        await tx.product.update({
          where: { id: line.productId },
          data: { inventory: { decrement: line.quantity } },
        });
      }

      return { orderNumber: order.orderNumber, publicToken: order.publicToken };
    });

    revalidatePath("/products");
    revalidatePath("/admin");
    return { ok: true, ...placed };
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.startsWith("STOCK:") || message.startsWith("UNAVAILABLE:")) {
      return { ok: false, errors: { form: message.split(":").slice(1).join(":") } };
    }
    console.error("placeOrder failed:", error);
    return {
      ok: false,
      errors: { form: "Something went wrong placing your order. Please try again." },
    };
  }
}

export async function submitReview(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = reviewSchema.safeParse({
    productId: formData.get("productId"),
    authorName: formData.get("authorName"),
    rating: formData.get("rating"),
    title: formData.get("title"),
    body: formData.get("body"),
  });

  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };

  const product = await prisma.product.findUnique({
    where: { id: parsed.data.productId },
    select: { slug: true },
  });
  if (!product) return { ok: false, errors: { form: "Product not found." } };

  await prisma.review.create({
    data: {
      productId: parsed.data.productId,
      authorName: parsed.data.authorName,
      rating: parsed.data.rating,
      title: parsed.data.title || null,
      body: parsed.data.body,
    },
  });

  revalidatePath(`/products/${product.slug}`);
  return { ok: true, message: "Thanks — your review is live." };
}

/** Public order lookup for the /track page. */
export async function trackOrder(_prev: unknown, formData: FormData) {
  const orderNumber = String(formData.get("orderNumber") ?? "").trim().toUpperCase();
  const phone = String(formData.get("phone") ?? "").replace(/\D/g, "").slice(-10);

  if (!orderNumber || phone.length !== 10) {
    return { ok: false as const, error: "Enter your order number and the 10-digit phone number." };
  }

  const order = await prisma.order.findFirst({
    where: { orderNumber, contactPhone: phone },
    include: { items: true },
  });

  if (!order) {
    return {
      ok: false as const,
      error: "No order matched those details. Check the order number and phone number.",
    };
  }

  return { ok: true as const, order };
}
