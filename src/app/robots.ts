import { MetadataRoute } from "next";
import { headers } from "next/headers";

export default async function robots(): Promise<MetadataRoute.Robots> {
  let baseUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (!baseUrl) {
    try {
      const headersList = await headers();
      const host = headersList.get("x-forwarded-host") || headersList.get("host");
      const proto = headersList.get("x-forwarded-proto") || (host?.includes("localhost") ? "http" : "https");
      if (host) {
        baseUrl = `${proto}://${host}`;
      }
    } catch {
      // In static rendering or non-request context
    }
  }

  if (!baseUrl) {
    baseUrl = "https://smmaroc.site";
  }

  baseUrl = baseUrl.replace(/\/$/, "");

  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/catalogue",
          "/fonctionnement",
          "/faq",
          "/blog",
          "/blog/*",
          "/login",
          "/register",
          "/google159838da1a429b07.html",
        ],
        disallow: [
          "/dashboard",
          "/dashboard/*",
          "/admin",
          "/admin/*",
          "/espace",
          "/espace/*",
          "/orders",
          "/orders/*",
          "/deposits",
          "/deposits/*",
          "/add-funds",
          "/add-funds/*",
          "/services",
          "/services/*",
          "/providers",
          "/providers/*",
          "/settings",
          "/settings/*",
          "/api/",
          "/api/*",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
