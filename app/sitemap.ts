// app/sitemap.ts
// ============================================================
// Sitemap del sitio (se sirve en /sitemap.xml)
// ============================================================
// Lista todas las URLs indexables para Google:
//   - La portada en cada idioma (/es, /en, /fr, /de, /nl),
//     con sus alternates hreflang.
//   - Las páginas legales (solo existen en español).
// /admin y /api NO van aquí (y robots.ts las bloquea).
// ============================================================

import type { MetadataRoute } from "next";
import { locales } from "@/lib/i18n/config";

const SITE_URL = "https://aescasosmetrosdelmar.com";

export default function sitemap(): MetadataRoute.Sitemap {
  // Mapa hreflang compartido por todas las portadas
  const languages: Record<string, string> = {};
  for (const l of locales) {
    languages[l] = `${SITE_URL}/${l}`;
  }

  const homePages: MetadataRoute.Sitemap = locales.map((lang) => ({
    url: `${SITE_URL}/${lang}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: lang === "es" ? 1 : 0.9,
    alternates: { languages },
  }));

  const legalPages: MetadataRoute.Sitemap = [
    "aviso-legal",
    "privacidad",
    "cookies",
    "condiciones-venta",
  ].map((slug) => ({
    url: `${SITE_URL}/legal/${slug}`,
    lastModified: new Date(),
    changeFrequency: "yearly",
    priority: 0.3,
  }));

  return [...homePages, ...legalPages];
}
