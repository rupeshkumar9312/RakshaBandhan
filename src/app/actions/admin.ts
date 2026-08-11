"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import {
  authenticate,
  clearSessionCookie,
  createSessionToken,
  requireSession,
  setSessionCookie,
} from "@/lib/auth";
import {
  loginSchema,
  productSchema,
  categorySchema,
  societySchema,
  adminOrderSchema,
  fieldErrors,
} from "@/lib/validation";
import { rupeesToPaise, shippingFor } from "@/lib/money";
import {
  slugify,
  serializeTags,
  buildOrderNumber,
  formatDate,
  ORDER_STATUSES,
  type OrderStatus,
} from "@/lib/utils";

export type AdminActionState =
  | { ok: true; message?: string }
  | { ok: false; errors: Record<string, string> }
  | null;

export async function loginAction(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };

  const session = await authenticate(parsed.data.email, parsed.data.password);
  if (!session) {
    return { ok: false, errors: { form: "Incorrect email or password." } };
  }

  await setSessionCookie(await createSessionToken(session));

  const next = String(formData.get("next") ?? "/admin");
  // Only allow same-app paths — never redirect to an attacker-supplied origin.
  redirect(next.startsWith("/admin") ? next : "/admin");
}

export async function logoutAction() {
  await clearSessionCookie();
  redirect("/admin/login");
}

/* ───────────────────────── Products ───────────────────────── */

function readProductForm(formData: FormData) {
  return {
    name: formData.get("name"),
    slug: formData.get("slug"),
    description: formData.get("description"),
    shortDesc: formData.get("shortDesc"),
    price: formData.get("price"),
    compareAtPrice: formData.get("compareAtPrice") || undefined,
    sku: formData.get("sku"),
    inventory: formData.get("inventory"),
    categoryId: formData.get("categoryId"),
    tags: formData.get("tags"),
    material: formData.get("material"),
    isActive: formData.get("isActive") === "on",
    isFeatured: formData.get("isFeatured") === "on",
    images: formData.getAll("images").map(String).filter(Boolean),
  };
}

/** Ensures the slug is unique, appending -2, -3, … when it isn't. */
async function uniqueSlug(base: string, excludeId?: string): Promise<string> {
  let candidate = base;
  let n = 1;
  for (;;) {
    const clash = await prisma.product.findFirst({
      where: { slug: candidate, ...(excludeId ? { NOT: { id: excludeId } } : {}) },
      select: { id: true },
    });
    if (!clash) return candidate;
    n += 1;
    candidate = `${base}-${n}`;
  }
}

export async function createProduct(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  await requireSession();

  const parsed = productSchema.safeParse(readProductForm(formData));
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };

  const d = parsed.data;
  const slug = await uniqueSlug(slugify(d.slug || d.name));

  await prisma.product.create({
    data: {
      name: d.name,
      slug,
      description: d.description,
      shortDesc: d.shortDesc ?? null,
      price: rupeesToPaise(d.price),
      compareAtPrice: d.compareAtPrice ? rupeesToPaise(d.compareAtPrice) : null,
      sku: d.sku ?? null,
      inventory: d.inventory,
      categoryId: d.categoryId,
      tags: serializeTags((d.tags ?? "").split(",")),
      material: d.material ?? null,
      isActive: d.isActive,
      isFeatured: d.isFeatured,
      images: {
        create: d.images.map((url, i) => ({ url, alt: d.name, sortOrder: i })),
      },
    },
  });

  revalidatePath("/admin/products");
  revalidatePath("/products");
  redirect("/admin/products?created=1");
}

export async function updateProduct(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  await requireSession();

  const id = String(formData.get("id") ?? "");
  if (!id) return { ok: false, errors: { form: "Missing product id." } };

  const parsed = productSchema.safeParse(readProductForm(formData));
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };

  const d = parsed.data;
  const slug = await uniqueSlug(slugify(d.slug || d.name), id);

  await prisma.$transaction([
    prisma.productImage.deleteMany({ where: { productId: id } }),
    prisma.product.update({
      where: { id },
      data: {
        name: d.name,
        slug,
        description: d.description,
        shortDesc: d.shortDesc ?? null,
        price: rupeesToPaise(d.price),
        compareAtPrice: d.compareAtPrice ? rupeesToPaise(d.compareAtPrice) : null,
        sku: d.sku ?? null,
        inventory: d.inventory,
        categoryId: d.categoryId,
        tags: serializeTags((d.tags ?? "").split(",")),
        material: d.material ?? null,
        isActive: d.isActive,
        isFeatured: d.isFeatured,
        images: {
          create: d.images.map((url, i) => ({ url, alt: d.name, sortOrder: i })),
        },
      },
    }),
  ]);

  revalidatePath("/admin/products");
  revalidatePath("/products");
  revalidatePath(`/products/${slug}`);
  redirect("/admin/products?updated=1");
}

export async function deleteProduct(formData: FormData) {
  await requireSession();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  // Products referenced by an order can't be removed without losing order
  // history, so retire them instead.
  const orderCount = await prisma.orderItem.count({ where: { productId: id } });

  if (orderCount > 0) {
    await prisma.product.update({ where: { id }, data: { isActive: false } });
  } else {
    await prisma.product.delete({ where: { id } });
  }

  revalidatePath("/admin/products");
  revalidatePath("/products");
}

export async function toggleProductFlag(formData: FormData) {
  await requireSession();
  const id = String(formData.get("id") ?? "");
  const field = String(formData.get("field") ?? "");
  if (!id || (field !== "isActive" && field !== "isFeatured")) return;

  const product = await prisma.product.findUnique({
    where: { id },
    select: { isActive: true, isFeatured: true },
  });
  if (!product) return;

  await prisma.product.update({
    where: { id },
    data:
      field === "isActive"
        ? { isActive: !product.isActive }
        : { isFeatured: !product.isFeatured },
  });

  revalidatePath("/admin/products");
  revalidatePath("/products");
}

/* ───────────────────────── Orders ───────────────────────── */

export async function updateOrderStatus(formData: FormData) {
  await requireSession();

  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "") as OrderStatus;

  if (!id || !ORDER_STATUSES.includes(status)) return;

  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true },
  });
  if (!order) return;

  const now = new Date();
  const timestamps: Record<string, Date | null> = {};
  if (status === "PROCESSING") timestamps.confirmedAt = now;
  if (status === "SHIPPED") timestamps.shippedAt = now;
  if (status === "DELIVERED") timestamps.deliveredAt = now;
  if (status === "CANCELLED") timestamps.cancelledAt = now;

  // Cancelling returns the reserved stock; COD is marked paid on delivery.
  const wasCancelled = order.status === "CANCELLED";
  if (status === "CANCELLED" && !wasCancelled) {
    for (const item of order.items) {
      await prisma.product.update({
        where: { id: item.productId },
        data: { inventory: { increment: item.quantity } },
      });
    }
  }

  await prisma.order.update({
    where: { id },
    data: {
      status,
      ...timestamps,
      ...(status === "DELIVERED" ? { paymentStatus: "PAID" } : {}),
      ...(status === "CANCELLED" ? { paymentStatus: "PENDING" } : {}),
    },
  });

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${id}`);
  revalidatePath("/admin");
}

export async function saveOrderNote(formData: FormData) {
  await requireSession();
  const id = String(formData.get("id") ?? "");
  const adminNote = String(formData.get("adminNote") ?? "").slice(0, 1000);
  if (!id) return;

  await prisma.order.update({ where: { id }, data: { adminNote: adminNote || null } });
  revalidatePath(`/admin/orders/${id}`);
}

const EDITABLE_STATUSES: OrderStatus[] = ["PENDING", "PROCESSING"];

function readAdminOrderForm(formData: FormData) {
  return {
    contactName: formData.get("contactName"),
    contactPhone: formData.get("contactPhone"),
    contactEmail: formData.get("contactEmail"),
    addressLine1: formData.get("addressLine1"),
    addressLine2: formData.get("addressLine2"),
    flat: formData.get("flat"),
    landmark: formData.get("landmark"),
    city: formData.get("city") || "Noida",
    state: formData.get("state") || "Uttar Pradesh",
    pincode: formData.get("pincode"),
    customerNote: formData.get("customerNote"),
    adminNote: formData.get("adminNote"),
  };
}

function readOrderItemsField(formData: FormData): unknown {
  try {
    return JSON.parse(String(formData.get("items") ?? "[]"));
  } catch {
    return null;
  }
}

/** Admin equivalent of placeOrder — same stock-check/transaction shape, but
 * free-text address (no Society whitelist) and gated behind requireSession(). */
export async function createOrder(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const session = await requireSession();

  const rawItems = readOrderItemsField(formData);
  if (rawItems === null) {
    return { ok: false, errors: { form: "Items could not be read. Please try again." } };
  }

  const parsed = adminOrderSchema.safeParse({ ...readAdminOrderForm(formData), items: rawItems });
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };
  const input = parsed.data;

  let created: { id: string };
  try {
    created = await prisma.$transaction(async (tx) => {
      const products = await tx.product.findMany({
        where: { id: { in: input.items.map((i) => i.productId) }, isActive: true },
        include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } },
      });
      const byId = new Map(products.map((p) => [p.id, p]));

      const lines = input.items.map((item) => {
        const product = byId.get(item.productId);
        if (!product) {
          throw new Error("UNAVAILABLE:One of the selected products is no longer available.");
        }
        if (product.inventory < item.quantity) {
          throw new Error(`STOCK:${product.name} only has ${product.inventory} in stock.`);
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
      const attribution = `Order created by ${session.name} on ${formatDate(new Date(), true)}`;
      const adminNote = input.adminNote ? `${input.adminNote}\n${attribution}` : attribution;

      const order = await tx.order.create({
        data: {
          orderNumber: buildOrderNumber(sequence),
          customerId: customer.id,
          contactName: input.contactName,
          contactPhone: input.contactPhone,
          contactEmail: input.contactEmail ?? null,
          addressLine1: input.addressLine1,
          addressLine2: input.addressLine2 || null,
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
          adminNote,
          items: { create: lines },
        },
      });

      // Independent per-product updates — run concurrently instead of one
      // round-trip at a time, since a sequential loop here is what was
      // blowing past Prisma's interactive-transaction timeout on larger carts.
      await Promise.all(
        lines.map((line) =>
          tx.product.update({
            where: { id: line.productId },
            data: { inventory: { decrement: line.quantity } },
          }),
        ),
      );

      return order;
    }, { timeout: 15_000 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.startsWith("STOCK:") || message.startsWith("UNAVAILABLE:")) {
      return { ok: false, errors: { form: message.split(":").slice(1).join(":") } };
    }
    console.error("createOrder failed:", error);
    return {
      ok: false,
      errors: { form: "Something went wrong creating the order. Please try again." },
    };
  }

  // Outside the try/catch — redirect() throws internally, and a catch-all
  // above would otherwise swallow that as a false "something went wrong".
  revalidatePath("/admin/orders");
  revalidatePath("/admin");
  redirect(`/admin/orders/${created.id}?created=1`);
}

/** Edits an existing order's items/address/contact. Only orders that are
 * still PENDING or PROCESSING are editable — the check is re-run inside the
 * transaction so a status change in another tab can't be edited around. */
export async function updateOrderItems(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const session = await requireSession();

  const id = String(formData.get("id") ?? "");
  if (!id) return { ok: false, errors: { form: "Missing order id." } };

  const rawItems = readOrderItemsField(formData);
  if (rawItems === null) {
    return { ok: false, errors: { form: "Items could not be read. Please try again." } };
  }

  const parsed = adminOrderSchema.safeParse({ ...readAdminOrderForm(formData), items: rawItems });
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };
  const input = parsed.data;

  try {
    await prisma.$transaction(async (tx) => {
      const existing = await tx.order.findUnique({ where: { id }, include: { items: true } });
      if (!existing) throw new Error("UNAVAILABLE:Order not found.");
      if (!EDITABLE_STATUSES.includes(existing.status as OrderStatus)) {
        throw new Error("LOCKED:This order can no longer be edited because its status has moved on.");
      }

      const oldQtyByProduct = new Map(existing.items.map((i) => [i.productId, i.quantity]));
      const newQtyByProduct = new Map<string, number>();
      for (const item of input.items) {
        newQtyByProduct.set(
          item.productId,
          (newQtyByProduct.get(item.productId) ?? 0) + item.quantity,
        );
      }

      const productIds = new Set([...oldQtyByProduct.keys(), ...newQtyByProduct.keys()]);
      const products = await tx.product.findMany({
        where: { id: { in: [...productIds] } },
        include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } },
      });
      const byId = new Map(products.map((p) => [p.id, p]));

      // Validate before writing anything — every referenced product must
      // still exist, and any net-increase in reserved stock must fit.
      for (const pid of productIds) {
        const product = byId.get(pid);
        const oldQty = oldQtyByProduct.get(pid) ?? 0;
        const newQty = newQtyByProduct.get(pid) ?? 0;
        const delta = newQty - oldQty;
        if (newQty > 0 && !product) {
          throw new Error("UNAVAILABLE:One of the selected products is no longer available.");
        }
        if (delta > 0 && product!.inventory < delta) {
          throw new Error(`STOCK:${product!.name} only has ${product!.inventory} more in stock.`);
        }
      }

      // Independent per-product updates — run concurrently instead of one
      // round-trip at a time, since a sequential loop here is what was
      // blowing past Prisma's interactive-transaction timeout on larger orders.
      await Promise.all(
        [...productIds].map((pid) => {
          const oldQty = oldQtyByProduct.get(pid) ?? 0;
          const newQty = newQtyByProduct.get(pid) ?? 0;
          const delta = newQty - oldQty;
          if (delta === 0) return null;
          return tx.product.update({
            where: { id: pid },
            data: { inventory: delta > 0 ? { decrement: delta } : { increment: -delta } },
          });
        }),
      );

      const lines = [...newQtyByProduct.entries()].map(([pid, qty]) => {
        const product = byId.get(pid)!;
        return {
          productId: pid,
          nameSnapshot: product.name,
          imageSnapshot: product.images[0]?.url ?? null,
          unitPrice: product.price,
          quantity: qty,
          lineTotal: product.price * qty,
        };
      });
      const subtotal = lines.reduce((s, l) => s + l.lineTotal, 0);
      const shippingFee = shippingFor(subtotal);

      const attribution = `Items edited by ${session.name} on ${formatDate(new Date(), true)}`;
      const adminNote = existing.adminNote ? `${existing.adminNote}\n${attribution}` : attribution;

      await tx.orderItem.deleteMany({ where: { orderId: id } });
      await tx.order.update({
        where: { id },
        data: {
          contactName: input.contactName,
          contactPhone: input.contactPhone,
          contactEmail: input.contactEmail ?? null,
          addressLine1: input.addressLine1,
          addressLine2: input.addressLine2 || null,
          flat: input.flat || null,
          landmark: input.landmark || null,
          city: input.city,
          state: input.state,
          pincode: input.pincode,
          subtotal,
          shippingFee,
          total: subtotal + shippingFee,
          customerNote: input.customerNote || null,
          adminNote,
          items: { create: lines },
        },
      });
    }, { timeout: 15_000 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (
      message.startsWith("STOCK:") ||
      message.startsWith("UNAVAILABLE:") ||
      message.startsWith("LOCKED:")
    ) {
      return { ok: false, errors: { form: message.split(":").slice(1).join(":") } };
    }
    console.error("updateOrderItems failed:", error);
    return {
      ok: false,
      errors: { form: "Something went wrong saving the order. Please try again." },
    };
  }

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${id}`);
  revalidatePath("/admin");
  return { ok: true, message: "Order updated." };
}

export type AdminProductSearchResult = {
  id: string;
  name: string;
  price: number;
  inventory: number;
  isActive: boolean;
  imageUrl: string | null;
};

/** Powers the product picker in the admin order form. Not filtered by
 * isActive — editing an order may need to re-add a temporarily hidden
 * product; the UI flags inactive results instead of hiding them outright. */
export async function searchProductsForOrder(query: string): Promise<AdminProductSearchResult[]> {
  await requireSession();
  const q = query.trim();
  if (q.length < 2) return [];

  const products = await prisma.product.findMany({
    where: { OR: [{ name: { contains: q } }, { sku: { contains: q } }] },
    select: {
      id: true,
      name: true,
      price: true,
      inventory: true,
      isActive: true,
      images: { select: { url: true }, orderBy: { sortOrder: "asc" }, take: 1 },
    },
    take: 10,
  });

  return products.map((p) => ({
    id: p.id,
    name: p.name,
    price: p.price,
    inventory: p.inventory,
    isActive: p.isActive,
    imageUrl: p.images[0]?.url ?? null,
  }));
}

/* ───────────────────────── Categories ───────────────────────── */

function readCategoryForm(formData: FormData) {
  return {
    name: formData.get("name"),
    slug: formData.get("slug"),
    description: formData.get("description"),
    imageUrl: formData.get("imageUrl"),
    sortOrder: formData.get("sortOrder") || 0,
    isActive: formData.get("isActive") === "on",
  };
}

/** Ensures the slug is unique, appending -2, -3, … when it isn't. */
async function uniqueCategorySlug(base: string, excludeId?: string): Promise<string> {
  let candidate = base;
  let n = 1;
  for (;;) {
    const clash = await prisma.category.findFirst({
      where: { slug: candidate, ...(excludeId ? { NOT: { id: excludeId } } : {}) },
      select: { id: true },
    });
    if (!clash) return candidate;
    n += 1;
    candidate = `${base}-${n}`;
  }
}

export async function createCategory(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  await requireSession();

  const parsed = categorySchema.safeParse(readCategoryForm(formData));
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };

  const d = parsed.data;
  const slug = await uniqueCategorySlug(slugify(d.slug || d.name));
  const count = await prisma.category.count();

  await prisma.category.create({
    data: {
      name: d.name,
      slug,
      description: d.description ?? null,
      // Falls back to a placeholder banner so the storefront never shows a
      // broken image — swap it for a real photo from the edit page.
      imageUrl: d.imageUrl || `/placeholders/banner-0${(count % 6) + 1}.svg`,
      sortOrder: d.sortOrder || count + 1,
      isActive: d.isActive,
    },
  });

  revalidatePath("/admin/categories");
  revalidatePath("/products");
  revalidatePath("/rakhi-bazaar");
  redirect("/admin/categories?created=1");
}

export async function updateCategory(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  await requireSession();

  const id = String(formData.get("id") ?? "");
  if (!id) return { ok: false, errors: { form: "Missing category id." } };

  const parsed = categorySchema.safeParse(readCategoryForm(formData));
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };

  const d = parsed.data;
  const slug = await uniqueCategorySlug(slugify(d.slug || d.name), id);

  await prisma.category.update({
    where: { id },
    data: {
      name: d.name,
      slug,
      description: d.description ?? null,
      imageUrl: d.imageUrl || null,
      sortOrder: d.sortOrder,
      isActive: d.isActive,
    },
  });

  revalidatePath("/admin/categories");
  revalidatePath("/products");
  revalidatePath("/rakhi-bazaar");
  redirect("/admin/categories?updated=1");
}

export async function deleteCategory(formData: FormData) {
  await requireSession();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  // Products reference categories with onDelete: Restrict, so a category
  // that's still in use gets hidden from the storefront instead of removed.
  const productCount = await prisma.product.count({ where: { categoryId: id } });

  if (productCount > 0) {
    await prisma.category.update({ where: { id }, data: { isActive: false } });
  } else {
    await prisma.category.delete({ where: { id } });
  }

  revalidatePath("/admin/categories");
  revalidatePath("/products");
  revalidatePath("/rakhi-bazaar");
}

/* ───────────────────────── Societies ───────────────────────── */

function readSocietyForm(formData: FormData) {
  return {
    name: formData.get("name"),
    sortOrder: formData.get("sortOrder") || 0,
    isActive: formData.get("isActive") === "on",
  };
}

export async function createSociety(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  await requireSession();

  const parsed = societySchema.safeParse(readSocietyForm(formData));
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };

  const d = parsed.data;
  const clash = await prisma.society.findFirst({ where: { name: d.name } });
  if (clash) return { ok: false, errors: { name: "A society with this name already exists." } };

  const count = await prisma.society.count();
  await prisma.society.create({
    data: {
      name: d.name,
      sortOrder: d.sortOrder || count + 1,
      isActive: d.isActive,
    },
  });

  revalidatePath("/admin/societies");
  revalidatePath("/checkout");
  redirect("/admin/societies?created=1");
}

export async function updateSociety(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  await requireSession();

  const id = String(formData.get("id") ?? "");
  if (!id) return { ok: false, errors: { form: "Missing society id." } };

  const parsed = societySchema.safeParse(readSocietyForm(formData));
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };

  const d = parsed.data;
  const clash = await prisma.society.findFirst({
    where: { name: d.name, NOT: { id } },
  });
  if (clash) return { ok: false, errors: { name: "A society with this name already exists." } };

  await prisma.society.update({
    where: { id },
    data: {
      name: d.name,
      sortOrder: d.sortOrder,
      isActive: d.isActive,
    },
  });

  revalidatePath("/admin/societies");
  revalidatePath("/checkout");
  redirect("/admin/societies?updated=1");
}

export async function deleteSociety(formData: FormData) {
  await requireSession();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  // Orders snapshot the society name as a plain string (never a foreign
  // key), so deleting one here never orphans past orders.
  await prisma.society.delete({ where: { id } });

  revalidatePath("/admin/societies");
  revalidatePath("/checkout");
}
