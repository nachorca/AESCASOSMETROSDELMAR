// app/[lang]/layout.tsx
// ============================================================
// Layout de idioma
// ============================================================
// Recibe el idioma desde la URL (/es, /en, /fr...) y comprueba
// que sea uno de los idiomas válidos. Si no lo es, muestra 404.
//
// generateStaticParams le dice a Next.js qué idiomas existen,
// para que pueda pre-generar las páginas de cada uno.
// ============================================================

import { notFound } from "next/navigation";
import { locales, isValidLocale } from "@/lib/i18n/config";

// Genera una versión de la web para cada idioma
export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
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
