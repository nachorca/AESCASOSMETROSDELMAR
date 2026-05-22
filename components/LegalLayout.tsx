// components/LegalLayout.tsx
// ============================================================
// Plantilla común para las páginas legales
// ============================================================
// Da a las 3 páginas (aviso legal, privacidad, cookies) la
// misma cabecera, estilo y enlace de "volver al inicio".
// Las páginas legales van solo en español.
// ============================================================

import Link from "next/link";
import { propertyConfig } from "@/lib/property";

export default function LegalLayout({
  title,
  lastUpdated,
  children,
}: {
  title: string;
  lastUpdated: string;
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-[#f7f4ee] text-slate-900">
      {/* Cabecera simple */}
      <header className="bg-slate-900 text-white">
        <div className="max-w-3xl mx-auto px-6 py-6 flex items-center justify-between">
          <Link href="/" className="font-semibold tracking-wide hover:text-white/80 transition">
            {propertyConfig.brand}
          </Link>
          <Link
            href="/"
            className="text-sm text-white/70 hover:text-white transition"
          >
            ← Volver al inicio
          </Link>
        </div>
      </header>

      {/* Contenido legal */}
      <article className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-semibold mb-2">{title}</h1>
        <p className="text-sm text-slate-500 mb-8">
          Última actualización: {lastUpdated}
        </p>

        <div className="legal-content space-y-4 text-slate-700 leading-relaxed">
          {children}
        </div>

        {/* Pie con enlaces a las otras páginas legales */}
        <nav className="mt-12 pt-8 border-t border-slate-200 flex flex-wrap gap-x-6 gap-y-2 text-sm">
          <Link href="/legal/aviso-legal" className="text-slate-600 hover:text-slate-900 underline">
            Aviso legal
          </Link>
          <Link href="/legal/privacidad" className="text-slate-600 hover:text-slate-900 underline">
            Política de privacidad
          </Link>
          <Link href="/legal/cookies" className="text-slate-600 hover:text-slate-900 underline">
            Política de cookies
          </Link>
        </nav>
      </article>
    </main>
  );
}
