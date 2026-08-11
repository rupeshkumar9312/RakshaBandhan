"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { logoutAction } from "@/app/actions/admin";
import { cn } from "@/lib/utils";
import { formatPaise } from "@/lib/money";
import { SITE } from "@/lib/site";
import {
  ChartIcon,
  PackageIcon,
  GridIcon,
  UsersIcon,
  GlobeIcon,
  TagIcon,
  BuildingIcon,
  TruckIcon,
  LogoutIcon,
  MenuIcon,
  CloseIcon,
  LogoMark,
} from "@/components/icons";
import type { AdminSession } from "@/lib/auth";

type OrderToast = {
  id: string;
  orderNumber: string;
  contactName: string;
  total: number;
};

const POLL_INTERVAL_MS = 12_000;
const TOAST_LIFETIME_MS = 6_000;

type AudioContextCtor = typeof AudioContext;

function getAudioContextCtor(): AudioContextCtor | undefined {
  return window.AudioContext || (window as unknown as { webkitAudioContext?: AudioContextCtor }).webkitAudioContext;
}

/**
 * Short two-note chime via Web Audio — no audio asset needed.
 *
 * Browsers only let an AudioContext actually produce sound if it was created
 * or resumed as a direct result of a user gesture (click/keypress) — a
 * `setInterval` poll callback doesn't count, so a fresh context created there
 * comes up permanently "suspended" and is silently inaudible. The caller is
 * responsible for handing in a context that's already been unlocked by a
 * real gesture (see the pointerdown/keydown listener in AdminShell below).
 */
function playNotificationSound(ctx: AudioContext) {
  try {
    if (ctx.state === "suspended") ctx.resume();
    const now = ctx.currentTime;

    [880, 1175].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      const start = now + i * 0.12;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.2, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.25);
      osc.connect(gain).connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.3);
    });
  } catch {
    /* sound is a nice-to-have — never let it block the toast/badge update */
  }
}

const NAV = [
  { href: "/admin", label: "Dashboard", Icon: ChartIcon, exact: true },
  { href: "/admin/orders", label: "Orders", Icon: PackageIcon },
  { href: "/admin/products", label: "Products", Icon: GridIcon },
  { href: "/admin/categories", label: "Categories", Icon: TagIcon },
  { href: "/admin/societies", label: "Societies", Icon: BuildingIcon },
  { href: "/admin/delivery-requests", label: "Delivery requests", Icon: TruckIcon },
  { href: "/admin/customers", label: "Customers", Icon: UsersIcon },
  { href: "/admin/visitors", label: "Visitors", Icon: GlobeIcon },
];

export function AdminShell({
  session,
  children,
}: {
  session: AdminSession;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [unreadOrders, setUnreadOrders] = useState(0);
  const [toasts, setToasts] = useState<OrderToast[]>([]);
  const sinceRef = useRef<string>(new Date().toISOString());
  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => setOpen(false), [pathname]);

  // AudioContext can only be started/resumed as a direct result of a real
  // user gesture — grab (and keep) one on the admin's first click/keypress
  // anywhere in the panel so the poll below has something usable later.
  useEffect(() => {
    function unlockAudio() {
      if (!audioCtxRef.current) {
        const Ctx = getAudioContextCtor();
        if (Ctx) audioCtxRef.current = new Ctx();
      }
      audioCtxRef.current?.resume();
    }
    window.addEventListener("pointerdown", unlockAudio);
    window.addEventListener("keydown", unlockAudio);
    return () => {
      window.removeEventListener("pointerdown", unlockAudio);
      window.removeEventListener("keydown", unlockAudio);
    };
  }, []);

  // New orders since the panel loaded — cleared once the admin actually
  // opens the orders list, not just when a toast fades.
  useEffect(() => {
    if (pathname === "/admin/orders") setUnreadOrders(0);
  }, [pathname]);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const res = await fetch(`/api/admin/notifications?since=${encodeURIComponent(sinceRef.current)}`);
        if (!res.ok || cancelled) return;
        const data: { orders: OrderToast[]; serverTime: string } = await res.json();
        sinceRef.current = data.serverTime;
        if (data.orders.length === 0) return;

        if (audioCtxRef.current) playNotificationSound(audioCtxRef.current);
        setUnreadOrders((n) => n + data.orders.length);
        setToasts((prev) => [...data.orders, ...prev].slice(0, 3));
        for (const order of data.orders) {
          setTimeout(() => {
            if (!cancelled) setToasts((prev) => prev.filter((t) => t.id !== order.id));
          }, TOAST_LIFETIME_MS);
        }
      } catch {
        /* transient network error — next poll will retry */
      }
    }

    const interval = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const isActive = (item: (typeof NAV)[number]) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href);

  const nav = (
    <nav className="space-y-1">
      {NAV.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors",
            isActive(item)
              ? "bg-maroon-700 text-cream-50 shadow-[var(--shadow-soft)]"
              : "text-cream-200/65 hover:bg-white/6 hover:text-cream-100",
          )}
        >
          <item.Icon className="size-4.5 shrink-0" />
          {item.label}
          {item.href === "/admin/orders" && unreadOrders > 0 && (
            <span className="ml-auto grid min-w-5 place-items-center rounded-full bg-gold-500 px-1.5 py-0.5 text-[0.6875rem] font-bold text-maroon-950 tabular-nums">
              {unreadOrders > 99 ? "99+" : unreadOrders}
            </span>
          )}
        </Link>
      ))}
    </nav>
  );

  return (
    <div className="min-h-[100dvh] bg-cream-100 lg:flex">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-[100dvh] w-64 shrink-0 flex-col bg-maroon-950 p-4 lg:flex">
        <Link href="/admin" className="flex items-center gap-2.5 px-2 py-3">
          <span className="grid size-9 place-items-center rounded-full bg-gradient-to-br from-gold-400 to-gold-600 text-maroon-950">
            <LogoMark className="size-5" />
          </span>
          <span>
            <span className="block font-display text-base font-bold text-cream-50">
              {SITE.name}
            </span>
            <span className="block text-[0.625rem] tracking-[0.16em] text-gold-500 uppercase">
              Admin
            </span>
          </span>
        </Link>

        <div className="my-4 h-px bg-white/10" />
        {nav}

        <div className="mt-auto">
          <Link
            href="/"
            target="_blank"
            className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm text-cream-200/65 transition-colors hover:bg-white/6 hover:text-cream-100"
          >
            <GridIcon className="size-4.5" />
            View storefront
          </Link>

          <div className="mt-3 rounded-xl bg-white/6 p-3.5">
            <p className="truncate text-sm font-semibold text-cream-50">{session.name}</p>
            <p className="mt-0.5 truncate text-xs text-cream-200/55">{session.email}</p>
            <form action={logoutAction} className="mt-3">
              <button
                type="submit"
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-white/8 py-2 text-xs font-semibold text-cream-100 transition-colors hover:bg-white/14"
              >
                <LogoutIcon className="size-3.5" />
                Sign out
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-cream-300 bg-cream-50/95 px-4 backdrop-blur lg:hidden">
        <button
          onClick={() => setOpen(true)}
          aria-label="Open admin menu"
          className="-ml-2 grid size-10 place-items-center rounded-full hover:bg-cream-200"
        >
          <MenuIcon className="size-5" />
        </button>
        <span className="font-display text-base font-bold">{SITE.name} Admin</span>
      </header>

      {/* Mobile drawer */}
      <div
        onClick={() => setOpen(false)}
        aria-hidden
        className={cn(
          "fixed inset-0 z-50 bg-ink/50 transition-opacity lg:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />
      <aside
        className={cn(
          "fixed left-0 top-0 z-51 flex h-[100dvh] w-72 flex-col bg-maroon-950 p-4 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] lg:hidden",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between px-2 py-2">
          <span className="font-display text-base font-bold text-cream-50">Admin</span>
          <button
            onClick={() => setOpen(false)}
            aria-label="Close menu"
            className="grid size-9 place-items-center rounded-full text-cream-200 hover:bg-white/10"
          >
            <CloseIcon className="size-5" />
          </button>
        </div>
        <div className="my-3 h-px bg-white/10" />
        {nav}
        <div className="mt-auto">
          <Link
            href="/"
            target="_blank"
            className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm text-cream-200/65 hover:bg-white/6"
          >
            <GridIcon className="size-4.5" /> View storefront
          </Link>
          <form action={logoutAction} className="mt-2">
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm text-cream-200/65 hover:bg-white/6"
            >
              <LogoutIcon className="size-4.5" /> Sign out
            </button>
          </form>
        </div>
      </aside>

      <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">{children}</main>

      {/* New-order toasts */}
      <div className="fixed right-4 top-4 z-52 flex w-[90%] max-w-sm flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className="card relative flex items-start gap-3 p-4 pr-9 shadow-(--shadow-lift)"
          >
            <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full bg-gold-100 text-gold-700">
              <PackageIcon className="size-4" />
            </span>
            <Link
              href={`/admin/orders/${t.id}`}
              onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
              className="min-w-0 flex-1"
            >
              <p className="text-sm font-bold">New order {t.orderNumber}</p>
              <p className="mt-0.5 truncate text-xs text-ink-muted">
                {formatPaise(t.total)} · {t.contactName}
              </p>
            </Link>
            <button
              type="button"
              onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
              aria-label="Dismiss"
              className="absolute right-2 top-2 grid size-6 place-items-center rounded-full text-ink-muted hover:bg-cream-200"
            >
              <CloseIcon className="size-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
