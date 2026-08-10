export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/** Tags are stored comma-separated for SQLite portability. */
export function parseTags(raw: string | null | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

export function serializeTags(tags: string[]): string {
  return Array.from(new Set(tags.map((t) => t.trim()).filter(Boolean))).join(",");
}

/** RB-2508-0007 — year/month prefix keeps it sortable and human-readable. */
export function buildOrderNumber(sequence: number, at = new Date()): string {
  const yy = String(at.getFullYear()).slice(2);
  const mm = String(at.getMonth() + 1).padStart(2, "0");
  return `RB-${yy}${mm}-${String(sequence).padStart(4, "0")}`;
}

export function formatDate(date: Date | string, withTime = false): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...(withTime ? { hour: "numeric", minute: "2-digit" } : {}),
  });
}

export function relativeDays(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const diff = Math.floor((Date.now() - d.getTime()) / 86_400_000);
  if (diff <= 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff < 7) return `${diff} days ago`;
  return formatDate(d);
}

/** Same-day if ordered before 9 PM, next-day otherwise. */
export function estimatedDelivery(from = new Date()): string {
  const d = new Date(from);
  if (d.getHours() >= 21) {
    d.setDate(d.getDate() + 1);
  }
  return formatDate(d);
}

export const ORDER_STATUSES = [
  "PENDING",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: "Pending",
  PROCESSING: "Processing",
  SHIPPED: "Out for delivery",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

export const STATUS_STYLES: Record<OrderStatus, string> = {
  PENDING: "bg-gold-100 text-gold-800",
  PROCESSING: "bg-blue-100 text-blue-800",
  SHIPPED: "bg-purple-100 text-purple-800",
  DELIVERED: "bg-emerald-100 text-emerald-800",
  CANCELLED: "bg-maroon-100 text-maroon-800",
};
