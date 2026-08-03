import { z } from "zod";

/** Indian mobile: 10 digits starting 6-9, tolerant of +91 / spaces / dashes. */
export const phoneSchema = z
  .string()
  .trim()
  .transform((v) => v.replace(/[\s\-()]/g, "").replace(/^(\+91|91|0)/, ""))
  .pipe(
    z
      .string()
      .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number"),
  );

export const pincodeSchema = z
  .string()
  .trim()
  .regex(/^[1-9]\d{5}$/, "Enter a valid 6-digit PIN code");

/**
 * An optional free-text field. FormData yields `null` for inputs that aren't
 * rendered and `""` for ones left blank — both mean "not provided", so
 * normalise them to undefined before length-checking.
 */
function optionalText(max: number) {
  return z
    .union([z.string(), z.null(), z.undefined()])
    .transform((v) => (v == null ? undefined : v.trim() || undefined))
    .pipe(z.string().max(max).optional());
}

export const checkoutSchema = z.object({
  contactName: z.string().trim().min(2, "Name is too short").max(80),
  contactPhone: phoneSchema,
  contactEmail: z
    .union([z.string(), z.null(), z.undefined()])
    .transform((v) => (v == null ? undefined : v.trim() || undefined))
    .pipe(z.string().email("Enter a valid email").optional()),
  addressLine1: z.string().trim().min(4, "Please enter your address").max(160),
  addressLine2: optionalText(160),
  tower: optionalText(60),
  flat: optionalText(60),
  landmark: optionalText(120),
  city: z.string().trim().min(2, "Enter your city").max(60).default("Noida"),
  state: z.string().trim().min(2).max(60).default("Uttar Pradesh"),
  pincode: pincodeSchema,
  customerNote: optionalText(500),
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.coerce.number().int().min(1).max(20),
      }),
    )
    .min(1, "Your cart is empty"),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;

export const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const productSchema = z.object({
  name: z.string().trim().min(2, "Name is required").max(120),
  slug: optionalText(120),
  description: z.string().trim().min(10, "Add a description (10+ characters)"),
  shortDesc: optionalText(200),
  price: z.coerce.number().min(1, "Price must be greater than 0").max(1_000_000),
  compareAtPrice: z.coerce.number().min(0).max(1_000_000).optional(),
  sku: optionalText(60),
  inventory: z.coerce.number().int().min(0).max(100_000),
  categoryId: z.string().min(1, "Pick a category"),
  tags: optionalText(300),
  material: optionalText(120),
  isActive: z.coerce.boolean().default(true),
  isFeatured: z.coerce.boolean().default(false),
  images: z.array(z.string().trim().min(1)).default([]),
});

export const reviewSchema = z.object({
  productId: z.string().min(1),
  authorName: z.string().trim().min(2, "Please enter your name").max(60),
  rating: z.coerce.number().int().min(1).max(5),
  title: optionalText(100),
  body: z.string().trim().min(5, "Tell us a bit more").max(1000),
});

/** Flatten a ZodError into { field: message } for form rendering. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "form";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
