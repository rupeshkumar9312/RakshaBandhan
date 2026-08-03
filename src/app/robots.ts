import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  const base = SITE.url.replace(/\/$/, "");

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Order pages carry customer addresses; cart and checkout are per-session.
      disallow: ["/admin", "/api/", "/checkout", "/cart", "/order/"],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
