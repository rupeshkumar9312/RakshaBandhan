import { CartProvider } from "@/components/cart-provider";
import { CartDrawer } from "@/components/cart-drawer";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { getCategories } from "@/lib/queries";

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const categories = await getCategories();
  const nav = categories.map((c) => ({ name: c.name, slug: c.slug }));

  return (
    <CartProvider>
      <div className="flex min-h-[100dvh] flex-col">
        <SiteHeader categories={nav} />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </div>
      <CartDrawer />
    </CartProvider>
  );
}
