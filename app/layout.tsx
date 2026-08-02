// app/layout.tsx
// ============================================================
// Layout raíz
// ============================================================
// Contiene el <html> y <body> (Next.js los necesita en la raíz)
// y carga Vercel Analytics + Speed Insights.
//
// El atributo lang="es" es el valor por defecto. El layout de
// app/[lang]/ ajustará el contenido al idioma correcto. Para el
// SEO multiidioma, lo que de verdad cuenta son las rutas /es,
// /en, /fr... y las etiquetas hreflang (se añaden más adelante).
// ============================================================

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import CookieBanner from "@/components/CookieBanner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  // Base para resolver URLs relativas de OG/canonical/hreflang
  metadataBase: new URL("https://aescasosmetrosdelmar.com"),
  title: "A escasos metros del mar | Apartamento turístico en El Campello",
  description:
    "Apartamento turístico junto al paseo marítimo de El Campello, Alicante. Estancia junto al mar, reserva directa, calendario disponible y alojamiento mediterráneo.",
  keywords: [
    "apartamento El Campello",
    "apartamento turístico Alicante",
    "alquiler vacacional Campello",
    "apartamento junto al mar Alicante",
    "paseo marítimo El Campello",
    "vacaciones Alicante playa",
  ],
  // Tarjeta al compartir el enlace (WhatsApp, Facebook, etc.)
  openGraph: {
    type: "website",
    siteName: "A escasos metros del mar",
    title: "A escasos metros del mar | Apartamento turístico en El Campello",
    description:
      "Apartamento a 50 metros del Mediterráneo en El Campello, Alicante. Reserva directa sin comisiones.",
    locale: "es_ES",
    images: [
      {
        url: "/images/portada.jpg",
        width: 1200,
        height: 630,
        alt: "Apartamento turístico A escasos metros del mar, El Campello",
      },
    ],
  },
  // Tarjeta en X/Twitter
  twitter: {
    card: "summary_large_image",
    title: "A escasos metros del mar | Apartamento en El Campello",
    description:
      "Apartamento a 50 metros del Mediterráneo. Reserva directa sin comisiones.",
    images: ["/images/portada.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <CookieBanner />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
