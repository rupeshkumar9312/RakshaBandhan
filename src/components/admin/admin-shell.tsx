"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { logoutAction } from "@/app/actions/admin";
import { cn } from "@/lib/utils";
import { SITE } from "@/lib/site";
import {
  ChartIcon,
  PackageIcon,
  GridIcon,
  UsersIcon,
  LogoutIcon,
  MenuIcon,
  CloseIcon,
} from "@/components/icons";
import type { AdminSession } from "@/lib/auth";

const NAV = [
  { href: "/admin", label: "Dashboard", Icon: ChartIcon, exact: true },
  { href: "/admin/orders", label: "Orders", Icon: PackageIcon },
  { href: "/admin/products", label: "Products", Icon: GridIcon },
  { href: "/admin/customers", label: "Customers", Icon: UsersIcon },
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

  useEffect(() => setOpen(false), [pathname]);

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
        </Link>
      ))}
    </nav>
  );

  return (
    <div className="min-h-[100dvh] bg-cream-100 lg:flex">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-[100dvh] w-64 shrink-0 flex-col bg-maroon-950 p-4 lg:flex">
        <Link href="/admin" className="flex items-center gap-2.5 px-2 py-3">
          <span className="grid size-9 place-items-center rounded-full bg-gradient-to-br from-gold-400 to-gold-600 text-base font-bold text-maroon-950">
            ॐ
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
    </div>
  );
}
