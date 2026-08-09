"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";

export type MapPoint = {
  lat: number;
  lng: number;
  city: string | null;
  country: string | null;
  count: number;
  source: "gps" | "ip";
  accuracy: number | null;
};

// Noida — centers the map on the store's home turf when there's no data yet.
const DEFAULT_CENTER: [number, number] = [28.5355, 77.391];

const GPS_COLOR = "#a17b2c"; // gold — precise, device-reported
const IP_COLOR = "#591826"; // maroon — approximate, IP-derived

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

export function VisitorMap({ points }: { points: MapPoint[] }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    let cancelled = false;
    let map: import("leaflet").Map | undefined;

    import("leaflet").then((L) => {
      if (cancelled || !containerRef.current) return;

      map = L.map(containerRef.current, {
        center: DEFAULT_CENTER,
        zoom: points.length ? 4 : 10,
        scrollWheelZoom: false,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 18,
      }).addTo(map);

      const markers: [number, number][] = [];
      for (const p of points) {
        markers.push([p.lat, p.lng]);
        const label = escapeHtml(
          [p.city, p.country].filter(Boolean).join(", ") || "Unknown location",
        );
        const sourceLabel =
          p.source === "gps"
            ? `Device GPS${p.accuracy ? ` · ±${Math.round(p.accuracy)}m` : ""}`
            : "IP-based (approximate)";
        const color = p.source === "gps" ? GPS_COLOR : IP_COLOR;

        L.circleMarker([p.lat, p.lng], {
          radius: Math.min(6 + Math.sqrt(p.count) * 2, 22),
          color,
          weight: 1,
          fillColor: color,
          fillOpacity: 0.5,
        })
          .addTo(map)
          .bindPopup(
            `<strong>${label}</strong><br/>${p.count} visit${p.count === 1 ? "" : "s"} · ${sourceLabel}`,
          );
      }

      if (markers.length > 0) {
        map.fitBounds(markers, { padding: [24, 24], maxZoom: 11 });
      }
    });

    return () => {
      cancelled = true;
      map?.remove();
    };
  }, [points]);

  return <div ref={containerRef} className="h-96 w-full rounded-xl" />;
}
