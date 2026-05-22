"use client";

// components/LanguageSwitcher.tsx
// ============================================================
// Selector de idioma
// ============================================================
// Botón con bandera que despliega la lista de idiomas.
// Al elegir uno, lleva al visitante a la misma página en el
// idioma elegido (cambia el /es, /en... de la URL).
// ============================================================

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  locales,
  localeNames,
  localeFlags,
  type Locale,
} from "@/lib/i18n/config";

export default function LanguageSwitcher({
  currentLocale,
}: {
  currentLocale: Locale;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  // Cambia el idioma: sustituye el primer segmento de la URL
  // (/es/... -> /en/...) y navega allí.
  function switchTo(locale: Locale) {
    const parts = pathname.split("/");
    // parts[0] es "" , parts[1] es el idioma actual
    parts[1] = locale;
    const newPath = parts.join("/") || `/${locale}`;
    setOpen(false);
    router.push(newPath);
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-2xl bg-white/15 hover:bg-white/25 px-3 py-2 text-sm text-white transition"
        aria-label="Cambiar idioma"
      >
        <span className="text-base">{localeFlags[currentLocale]}</span>
        <span className="hidden sm:inline">
          {localeNames[currentLocale]}
        </span>
        <span className="text-xs">▾</span>
      </button>

      {open && (
        <>
          {/* Capa invisible: si haces clic fuera, cierra el menú */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />

          <div className="absolute right-0 mt-2 z-50 w-44 rounded-2xl bg-white shadow-xl border border-slate-200 overflow-hidden">
            {locales.map((loc) => (
              <button
                key={loc}
                onClick={() => switchTo(loc)}
                className={`flex items-center gap-3 w-full px-4 py-3 text-sm text-left hover:bg-slate-100 transition ${
                  loc === currentLocale
                    ? "bg-slate-50 font-semibold text-slate-900"
                    : "text-slate-700"
                }`}
              >
                <span className="text-base">{localeFlags[loc]}</span>
                <span>{localeNames[loc]}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
