// app/robots.ts
// ============================================================
// robots.txt del sitio (se sirve en /robots.txt)
// ============================================================
// Permite indexar toda la web menos el panel de administración
// y las APIs, y apunta al sitemap.
// ============================================================

import type { MetadataRoute } from "next";

const SITE_URL = "https://aescasosmetrosdelmar.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api/"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
