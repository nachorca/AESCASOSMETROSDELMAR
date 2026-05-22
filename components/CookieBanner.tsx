"use client";

// components/CookieBanner.tsx
// ============================================================
// Banner de cookies
// ============================================================
// Aviso que aparece abajo al entrar en la web por primera vez.
// El usuario puede Aceptar o Rechazar. La elección se recuerda
// para no volver a mostrar el banner.
//
// NOTA: usamos una cookie propia ("cookie-consent") para
// recordar la decisión. Es una cookie técnica, necesaria para
// que el propio banner funcione.
// ============================================================

import { useState, useEffect } from "react";
import Link from "next/link";

export default function CookieBanner() {
  // null = aún no sabemos / no mostrar; true = mostrar el banner
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Al cargar la página, miramos si ya hay una decisión guardada
    const consent = document.cookie
      .split("; ")
      .find((row) => row.startsWith("cookie-consent="));
    if (!consent) {
      setVisible(true);
    }
  }, []);

  function guardarDecision(valor: "accepted" | "rejected") {
    // Guardamos la decisión en una cookie que dura 6 meses
    const seisMeses = 60 * 60 * 24 * 180;
    document.cookie = `cookie-consent=${valor}; path=/; max-age=${seisMeses}; SameSite=Lax`;
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[60] bg-slate-900 text-white/90 px-6 py-5 shadow-2xl">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row md:items-center gap-4">
        <p className="text-sm leading-relaxed flex-1">
          Usamos cookies propias y de terceros para el funcionamiento de la web
          y para analizar la navegación de forma anónima. Puedes aceptarlas o
          rechazarlas. Más información en nuestra{" "}
          <Link
            href="/legal/cookies"
            className="underline hover:text-white"
          >
            Política de Cookies
          </Link>
          .
        </p>
        <div className="flex gap-3 shrink-0">
          <button
            onClick={() => guardarDecision("rejected")}
            className="px-4 py-2 rounded-2xl text-sm border border-white/30 text-white/80 hover:bg-white/10 transition"
          >
            Rechazar
          </button>
          <button
            onClick={() => guardarDecision("accepted")}
            className="px-5 py-2 rounded-2xl text-sm font-medium bg-white text-slate-900 hover:bg-white/90 transition"
          >
            Aceptar
          </button>
        </div>
      </div>
    </div>
  );
}
