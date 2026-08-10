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
  fieldErrors,
} from "@/lib/validation";
import { rupeesToPaise } from "@/lib/money";
import { slugify, serializeTags, ORDER_STATUSES, type OrderStatus } from "@/lib/utils";

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
