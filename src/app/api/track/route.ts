import { randomUUID } from "crypto";
import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { parseUserAgent } from "@/lib/ua";

const VISITOR_COOKIE = "gb_visitor";
const ONE_YEAR = 60 * 60 * 24 * 365;

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}) as Record<string, unknown>);
  const path = typeof body.path === "string" ? body.path.slice(0, 300) : "/";
  const referrer =
    typeof body.referrer === "string" && body.referrer ? body.referrer.slice(0, 300) : null;

  const ua = req.headers.get("user-agent") ?? "";
  const { browser, os, deviceType } = parseUserAgent(ua);

  // Vercel's edge network injects these on every request; absent in local dev.
  const country = req.headers.get("x-vercel-ip-country");
  const region = req.headers.get("x-vercel-ip-country-region");
  const cityRaw = req.headers.get("x-vercel-ip-city");
  const ip =
    req.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    null;

  // Client-reported device GPS (only present if the visitor granted the
  // browser's location prompt) takes priority over IP-derived location.
  const gps = body.gps as { lat?: unknown; lng?: unknown; accuracy?: unknown } | undefined;
  const gpsLat = typeof gps?.lat === "number" && Math.abs(gps.lat) <= 90 ? gps.lat : null;
  const gpsLng = typeof gps?.lng === "number" && Math.abs(gps.lng) <= 180 ? gps.lng : null;
  const gpsAccuracy =
    typeof gps?.accuracy === "number" && gps.accuracy >= 0 ? gps.accuracy : null;
  const hasGps = gpsLat !== null && gpsLng !== null;

  const latitude = hasGps ? gpsLat : parseFloat(req.headers.get("x-vercel-ip-latitude") ?? "");
  const longitude = hasGps ? gpsLng : parseFloat(req.headers.get("x-vercel-ip-longitude") ?? "");

  const existingVisitorId = req.cookies.get(VISITOR_COOKIE)?.value;
  const visitorId = existingVisitorId ?? randomUUID();

  await prisma.visit.create({
    data: {
      visitorId,
      path,
      referrer,
      ip,
      country,
      region,
      city: cityRaw ? decodeURIComponent(cityRaw) : null,
      latitude: Number.isFinite(latitude) ? latitude : null,
      longitude: Number.isFinite(longitude) ? longitude : null,
      locationSource: hasGps ? "gps" : Number.isFinite(latitude) ? "ip" : null,
      gpsAccuracy: hasGps ? gpsAccuracy : null,
      deviceType,
      browser,
      os,
      userAgent: ua.slice(0, 500),
    },
  });

  const res = NextResponse.json({ ok: true });
  if (!existingVisitorId) {
    res.cookies.set(VISITOR_COOKIE, visitorId, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: ONE_YEAR,
    });
  }
  return res;
}
