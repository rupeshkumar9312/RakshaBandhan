"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

type Gps = { lat: number; lng: number; accuracy: number };

/** Fires a beacon to /api/track on first load and every client-side route change. */
export function VisitTracker() {
  const pathname = usePathname();
  const lastTracked = useRef<string | null>(null);
  const gpsRef = useRef<Gps | null>(null);
  const geoRequested = useRef(false);

  // Ask for device GPS once per page load. The browser's own permission
  // prompt handles accept/deny — either way nothing here blocks the visitor
  // from using the site, and a denial never triggers a retry within this session.
  useEffect(() => {
    if (geoRequested.current) return;
    geoRequested.current = true;
    if (typeof navigator === "undefined" || !navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        gpsRef.current = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        };
      },
      () => {
        // Denied, unavailable or timed out — silently fall back to IP-based location.
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 300_000 },
    );
  }, []);

  useEffect(() => {
    if (lastTracked.current === pathname) return;
    lastTracked.current = pathname;

    const payload = JSON.stringify({
      path: pathname,
      referrer: document.referrer || undefined,
      gps: gpsRef.current ?? undefined,
    });

    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/track", new Blob([payload], { type: "application/json" }));
    } else {
      fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
        keepalive: true,
      }).catch(() => {});
    }
  }, [pathname]);

  return null;
}
