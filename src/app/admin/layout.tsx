import type { Metadata } from "next";
import { getSession } from "@/lib/auth";
import { AdminShell } from "@/components/admin/admin-shell";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Admin" },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  // /admin/login renders its own full-page shell and middleware lets it through
  // unauthenticated, so bypass the chrome when there's no session.
  if (!session) return <>{children}</>;

  return <AdminShell session={session}>{children}</AdminShell>;
}
