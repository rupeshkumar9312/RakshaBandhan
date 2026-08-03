/**
 * All money in this app is stored and passed around as integer paise.
 * Format only at the edge (render time).
 */

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const inrPrecise = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** 24900 -> "₹249" (or "₹249.50" when there are paise) */
export function formatPaise(paise: number): string {
  const rupees = paise / 100;
  return Number.isInteger(rupees) ? inr.format(rupees) : inrPrecise.format(rupees);
}

/** "249.50" | 249.5 -> 24950 */
export function rupeesToPaise(rupees: string | number): number {
  const n = typeof rupees === "string" ? parseFloat(rupees) : rupees;
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100);
}

/** 24950 -> 249.5 (for prefilling number inputs) */
export function paiseToRupees(paise: number): number {
  return Math.round(paise) / 100;
}

export function discountPercent(price: number, compareAt?: number | null): number | null {
  if (!compareAt || compareAt <= price) return null;
  return Math.round(((compareAt - price) / compareAt) * 100);
}

/** Free delivery inside the society above this cart value. */
export const FREE_SHIPPING_THRESHOLD = 49900; // ₹499
export const SHIPPING_FEE = 4900; // ₹49

export function shippingFor(subtotal: number): number {
  if (subtotal <= 0) return 0;
  return subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
}
