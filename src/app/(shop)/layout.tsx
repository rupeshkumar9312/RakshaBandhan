import { CartProvider } from "@/components/cart-provider";
import { CartDrawer } from "@/components/cart-drawer";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { VisitTracker } from "@/components/visit-tracker";
import { getCategories } from "@/lib/queries";

// Every storefront page reads live stock/price/catalog data, so none of them
// should be statically generated at build time — that would need DATABASE_URL
// reachable during `next build`, not just at runtime, and would serve stale
// data until the next deploy.
export const dynamic = "force-dynamic";

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const categories = await getCategories();
  const nav = categories.map((c) => ({ name: c.name, slug: c.slug }));

  return (
    <CartProvider>
      <VisitTracker />
      <div className="flex min-h-[100dvh] flex-col">
        <SiteHeader categories={nav} />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </div>
      <CartDrawer />
    </CartProvider>
  );
}
