import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/utils";
import { UsersIcon, ChartIcon, GlobeIcon, DeviceIcon } from "@/components/icons";
import { VisitorMap, type MapPoint } from "@/components/admin/visitor-map";

export const metadata = { title: "Visitors" };

const DEVICE_LABELS: Record<string, string> = {
  mobile: "Mobile",
  tablet: "Tablet",
  desktop: "Desktop",
};

export default async function AdminVisitorsPage() {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const sevenDaysAgo = new Date(startOfToday);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

  const [
    totalVisits,
    uniqueVisitors,
    todayVisits,
    weekVisits,
    countryGroups,
    deviceGroups,
    browserGroups,
    recent,
    locatedVisits,
  ] = await Promise.all([
    prisma.visit.count(),
    prisma.visit.findMany({ distinct: ["visitorId"], select: { visitorId: true } }),
    prisma.visit.count({ where: { createdAt: { gte: startOfToday } } }),
    prisma.visit.findMany({
      where: { createdAt: { gte: sevenDaysAgo } },
      select: { createdAt: true },
    }),
    prisma.visit.groupBy({
      by: ["country"],
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 6,
    }),
    prisma.visit.groupBy({
      by: ["deviceType"],
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
    }),
    prisma.visit.groupBy({
      by: ["browser"],
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 6,
    }),
    prisma.visit.findMany({ orderBy: { createdAt: "desc" }, take: 50 }),
    prisma.visit.findMany({
      where: { latitude: { not: null }, longitude: { not: null } },
      select: {
        latitude: true,
        longitude: true,
        city: true,
        country: true,
        locationSource: true,
        gpsAccuracy: true,
      },
    }),
  ]);

  // Group into map points so pageviews from the same spot become one sized
  // marker instead of hundreds of overlapping dots. GPS points keep full
  // precision (each is a distinct device-reported fix); IP points are rounded
  // since city-level IP geolocation clusters naturally by area.
  const pointsByLocation = new Map<string, MapPoint>();
  for (const v of locatedVisits) {
    if (v.latitude == null || v.longitude == null) continue;
    const isGps = v.locationSource === "gps";
    const key = isGps
      ? `gps:${v.latitude},${v.longitude}`
      : `ip:${v.latitude.toFixed(1)},${v.longitude.toFixed(1)}`;
    const existing = pointsByLocation.get(key);
    if (existing) existing.count += 1;
    else
      pointsByLocation.set(key, {
        lat: v.latitude,
        lng: v.longitude,
        city: v.city,
        country: v.country,
        count: 1,
        source: isGps ? "gps" : "ip",
        accuracy: v.gpsAccuracy,
      });
  }
  const mapPoints = Array.from(pointsByLocation.values());

  // Bucket the last 7 days for the trend chart.
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(sevenDaysAgo);
    d.setDate(d.getDate() + i);
    return { date: d, count: 0 };
  });
  for (const v of weekVisits) {
    const idx = Math.floor((v.createdAt.getTime() - sevenDaysAgo.getTime()) / 86_400_000);
    if (idx >= 0 && idx < 7) days[idx].count += 1;
  }
  const peak = Math.max(1, ...days.map((d) => d.count));

  const topCountry = countryGroups.find((c) => c.country)?.country ?? "Unknown";
  const deviceTotal = deviceGroups.reduce((s, d) => s + d._count.id, 0);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl font-bold sm:text-3xl">Visitors</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Where your traffic comes from and what it's browsing on.
        </p>
      </header>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Total pageviews" value={String(totalVisits)} hint="All time" Icon={ChartIcon} />
        <Kpi
          label="Unique visitors"
          value={String(uniqueVisitors.length)}
          hint="By browser cookie"
          Icon={UsersIcon}
        />
        <Kpi label="Today" value={String(todayVisits)} hint="Pageviews so far" Icon={ChartIcon} />
        <Kpi label="Top location" value={topCountry} hint="Most visits from" Icon={GlobeIcon} />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        {/* Trend */}
        <section className="card p-5 xl:col-span-2">
          <div className="flex items-baseline justify-between">
            <h2 className="font-bold">Last 7 days</h2>
            <span className="text-xs text-ink-muted">
              {days.reduce((s, d) => s + d.count, 0)} pageviews
            </span>
          </div>

          <div className="mt-6 flex h-44 items-end gap-2">
            {days.map((d) => (
              <div key={d.date.toISOString()} className="group flex flex-1 flex-col items-center gap-2">
                <span className="text-[0.625rem] font-semibold text-ink-muted opacity-0 transition-opacity group-hover:opacity-100">
                  {d.count > 0 ? d.count : "—"}
                </span>
                <div
                  className="w-full rounded-t-lg bg-gradient-to-t from-maroon-700 to-maroon-500 transition-all"
                  style={{ height: `${Math.max(3, (d.count / peak) * 100)}%` }}
                />
                <span className="text-[0.625rem] text-ink-muted">
                  {d.date.toLocaleDateString("en-IN", { weekday: "short" })}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Devices */}
        <section className="card p-5">
          <h2 className="flex items-center gap-2 font-bold">
            <DeviceIcon className="size-4.5 text-ink-muted" /> Devices
          </h2>
          {deviceGroups.length === 0 ? (
            <p className="mt-4 text-sm text-ink-muted">No data yet.</p>
          ) : (
            <ul className="mt-4 space-y-2.5">
              {deviceGroups.map((d) => {
                const label = DEVICE_LABELS[d.deviceType ?? ""] ?? "Unknown";
                const pct = deviceTotal > 0 ? (d._count.id / deviceTotal) * 100 : 0;
                return (
                  <li key={label}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-ink-soft">{label}</span>
                      <span className="font-semibold tabular-nums">{d._count.id}</span>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-cream-200">
                      <div
                        className="h-full rounded-full bg-gold-500 transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      {/* Map */}
      <section className="card overflow-hidden p-5">
        <h2 className="flex items-center gap-2 font-bold">
          <GlobeIcon className="size-4.5 text-ink-muted" /> Visitor locations
        </h2>
        <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-muted">
          <span>Marker size reflects visit count.</span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block size-2.5 rounded-full bg-gold-600" /> Device GPS
            (visitor opted in)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block size-2.5 rounded-full bg-maroon-700" /> IP-based
            (approximate)
          </span>
        </p>
        <div className="mt-4 overflow-hidden rounded-xl">
          <VisitorMap points={mapPoints} />
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-3">
        {/* Top locations */}
        <section className="card p-5">
          <h2 className="flex items-center gap-2 font-bold">
            <GlobeIcon className="size-4.5 text-ink-muted" /> Top locations
          </h2>
          {countryGroups.length === 0 ? (
            <p className="mt-4 text-sm text-ink-muted">No data yet.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {countryGroups.map((c) => (
                <li key={c.country ?? "unknown"} className="flex items-center justify-between text-sm">
                  <span className="text-ink-soft">{c.country ?? "Unknown"}</span>
                  <span className="font-semibold tabular-nums">{c._count.id}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Top browsers */}
        <section className="card p-5 xl:col-span-2">
          <h2 className="font-bold">Top browsers</h2>
          {browserGroups.length === 0 ? (
            <p className="mt-4 text-sm text-ink-muted">No data yet.</p>
          ) : (
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {browserGroups.map((b) => (
                <li key={b.browser ?? "unknown"} className="flex items-center justify-between text-sm">
                  <span className="text-ink-soft">{b.browser ?? "Unknown"}</span>
                  <span className="font-semibold tabular-nums">{b._count.id}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* Recent visits */}
      <section className="card overflow-hidden">
        <div className="border-b border-cream-300 px-5 py-4">
          <h2 className="font-bold">Recent visits</h2>
        </div>

        {recent.length === 0 ? (
          <p className="px-5 py-12 text-center text-sm text-ink-muted">
            No visits recorded yet — this fills in as people browse the site.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[46rem] text-sm">
              <thead className="border-b border-cream-300 bg-cream-50 text-left">
                <tr>
                  <th className="px-4 py-3 text-xs font-semibold tracking-wide text-ink-muted uppercase">
                    Time
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold tracking-wide text-ink-muted uppercase">
                    Page
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold tracking-wide text-ink-muted uppercase">
                    Location
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold tracking-wide text-ink-muted uppercase">
                    Device
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold tracking-wide text-ink-muted uppercase">
                    Referrer
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-300">
                {recent.map((v) => (
                  <tr key={v.id} className="hover:bg-cream-50">
                    <td className="px-4 py-3 whitespace-nowrap text-xs text-ink-muted">
                      {formatDate(v.createdAt, true)}
                    </td>
                    <td className="max-w-48 truncate px-4 py-3 font-medium">{v.path}</td>
                    <td className="px-4 py-3 text-ink-soft">
                      {[v.city, v.country].filter(Boolean).join(", ") || "Unknown"}
                    </td>
                    <td className="px-4 py-3">
                      <span className="chip bg-cream-200 text-ink-soft">
                        {DEVICE_LABELS[v.deviceType ?? ""] ?? "Unknown"}
                      </span>
                      <span className="ml-1.5 text-xs text-ink-muted">
                        {[v.browser, v.os].filter(Boolean).join(" · ")}
                      </span>
                    </td>
                    <td className="max-w-40 truncate px-4 py-3 text-xs text-ink-muted">
                      {v.referrer ? new URL(v.referrer, "http://x").hostname || v.referrer : "Direct"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function Kpi({
  label,
  value,
  hint,
  Icon,
}: {
  label: string;
  value: string;
  hint: string;
  Icon: (p: React.SVGProps<SVGSVGElement>) => React.ReactElement;
}) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <p className="text-xs font-semibold tracking-wide text-ink-muted uppercase">{label}</p>
        <span className="grid size-8 place-items-center rounded-full bg-maroon-50 text-maroon-700">
          <Icon className="size-4" />
        </span>
      </div>
      <p className="mt-3 truncate font-display text-2xl font-bold text-ink">{value}</p>
      <p className="mt-1 text-xs text-ink-muted">{hint}</p>
    </div>
  );
}
