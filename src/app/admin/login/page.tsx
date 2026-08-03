import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "@/components/admin/login-form";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Admin sign in",
  robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
  return (
    <div className="grid min-h-[100dvh] place-items-center bg-gradient-to-br from-maroon-950 via-maroon-900 to-maroon-950 p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <span className="mx-auto grid size-14 place-items-center rounded-full bg-gradient-to-br from-gold-400 to-gold-600 text-2xl font-bold text-maroon-950">
            ॐ
          </span>
          <h1 className="mt-4 font-display text-2xl font-bold text-cream-50">{SITE.name}</h1>
          <p className="mt-1 text-sm text-cream-200/60">Store administration</p>
        </div>

        <div className="rounded-xl2 bg-cream-50 p-6 shadow-2xl">
          <Suspense fallback={<div className="skeleton h-64 rounded-xl" />}>
            <LoginForm />
          </Suspense>
        </div>

        <p className="mt-6 text-center text-xs text-cream-200/45">
          Authorised staff only. All actions are logged.
        </p>
      </div>
    </div>
  );
}
