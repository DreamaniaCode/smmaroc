import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://smmaroc.com";

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
