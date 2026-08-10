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

// The store operates in Noida, but Vercel's serverless functions run in UTC —
// without pinning a zone, every server-rendered date/hour silently shifts by
// 5h30m (and sometimes a whole calendar day) versus what the customer sees.
const IST_TIME_ZONE = "Asia/Kolkata";

/** Year/month/day/hour as seen on an India clock, regardless of server TZ. */
function istParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: IST_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  return { year: get("year"), month: get("month"), day: get("day"), hour: get("hour") };
}

/** RB-2508-0007 — year/month prefix keeps it sortable and human-readable. */
export function buildOrderNumber(sequence: number, at = new Date()): string {
  const { year, month } = istParts(at);
  const yy = String(year).slice(2);
  const mm = String(month).padStart(2, "0");
  return `RB-${yy}${mm}-${String(sequence).padStart(4, "0")}`;
}

export function formatDate(date: Date | string, withTime = false): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-IN", {
    timeZone: IST_TIME_ZONE,
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

/** Same-day if ordered before 9 PM IST, next-day otherwise. */
export function estimatedDelivery(from = new Date()): string {
  const { hour } = istParts(from);
  const d = new Date(from);
  if (hour >= 21) {
    // Explicit UTC setter — adds exactly 24h regardless of the server's local
    // TZ, so the shift stays correct once formatDate renders it back in IST.
    d.setUTCDate(d.getUTCDate() + 1);
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
