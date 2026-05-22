// app/[lang]/layout.tsx
// ============================================================
// Layout de idioma
// ============================================================
// Recibe el idioma desde la URL (/es, /en, /fr...) y comprueba
// que sea uno de los idiomas válidos. Si no lo es, muestra 404.
//
// generateMetadata añade las etiquetas hreflang: le dicen a
// Google que existe una versión por idioma. Sin esto, Google.fr
// no posiciona la versión francesa.
// ============================================================

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { locales, isValidLocale } from "@/lib/i18n/config";

const SITE_URL = "https://aescasosmetrosdelmar.com";

// Genera una versión de la web para cada idioma
export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;

  const languages: Record<string, string> = {};
  for (const l of locales) {
    languages[l] = `${SITE_URL}/${l}`;
  }
  languages["x-default"] = `${SITE_URL}/es`;

  return {
    alternates: {
      canonical: `${SITE_URL}/${lang}`,
      languages,
    },
  };
}

export default async function LangLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;

  // Si la URL trae un idioma que no existe (ej. /xx) -> 404
  if (!isValidLocale(lang)) {
    notFound();
  }

  return children;
}