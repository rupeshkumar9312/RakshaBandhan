import "server-only";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";

type AuditParams = {
  adminId: string | null;
  adminEmail: string;
  adminName?: string | null;
  action: string;
  entityType?: string;
  entityId?: string;
  detail?: string;
};

/**
 * Records an admin action for the audit trail — login/logout plus every
 * mutating action. Best-effort: a logging failure must never break the
 * action it's observing, so every error is swallowed here.
 *
 * IP/geo extraction mirrors src/app/api/track/route.ts's Vercel edge headers,
 * just read via `headers()` instead of a NextRequest (server actions don't
 * get a request object). Locally, these headers are simply absent.
 */
export async function logAdminAction(params: AuditParams): Promise<void> {
  try {
    const h = await headers();
    const ip =
      h.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() ??
      h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      h.get("x-real-ip") ??
      null;
    const cityRaw = h.get("x-vercel-ip-city");

    await prisma.adminAuditLog.create({
      data: {
        adminId: params.adminId,
        adminEmail: params.adminEmail,
        adminName: params.adminName ?? null,
        action: params.action,
        entityType: params.entityType ?? null,
        entityId: params.entityId ?? null,
        detail: params.detail ?? null,
        ip,
        country: h.get("x-vercel-ip-country"),
        region: h.get("x-vercel-ip-country-region"),
        city: cityRaw ? decodeURIComponent(cityRaw) : null,
        userAgent: h.get("user-agent")?.slice(0, 500) ?? null,
      },
    });
  } catch (error) {
    console.error("logAdminAction failed:", error);
  }
}
