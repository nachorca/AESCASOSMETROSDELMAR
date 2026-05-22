// proxy.ts
// ============================================================
// Proxy de idioma  (antes "middleware" — renombrado en Next.js 16)
// ============================================================
// Se ejecuta antes de servir cada página. Su función:
//
// 1. Si la URL ya tiene idioma (/es, /en...) -> no hace nada.
// 2. Si la URL NO tiene idioma (ej. "/") -> redirige al idioma
//    del navegador del visitante, o al español por defecto.
//
// NO afecta a /admin ni a /api: esas rutas se excluyen abajo
// en el "matcher" para que sigan funcionando igual que ahora.
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { locales, defaultLocale } from "./lib/i18n/config";

// Detecta el idioma preferido del navegador del visitante
function getLocaleFromRequest(req: NextRequest): string {
  const accptLang = req.headers.get("accept-language");
  if (!accptLang) return defaultLocale;

  // accept-language llega tipo "en-GB,en;q=0.9,es;q=0.8"
  // Cogemos el primer idioma de 2 letras que coincida con los nuestros
  const preferred = accptLang
    .split(",")
    .map((part) => part.split(";")[0].trim().slice(0, 2).toLowerCase());

  for (const lang of preferred) {
    if (locales.includes(lang as (typeof locales)[number])) {
      return lang;
    }
  }

  return defaultLocale;
}

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ¿La ruta ya empieza por un idioma válido? (/es, /en, /fr...)
  const hasLocale = locales.some(
    (loc) => pathname === `/${loc}` || pathname.startsWith(`/${loc}/`)
  );

  if (hasLocale) {
    return NextResponse.next();
  }

  // No tiene idioma -> redirige añadiendo el idioma detectado
  const locale = getLocaleFromRequest(req);
  const url = req.nextUrl.clone();
  url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;

  return NextResponse.redirect(url);
}

// El matcher EXCLUYE /admin, /api, archivos estáticos e imágenes.
// Solo actúa sobre las páginas de cara al cliente.
export const config = {
  matcher: [
    "/((?!api|admin|_next/static|_next/image|images|favicon.ico|.*\\.).*)",
  ],
};
