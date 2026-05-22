import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
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
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
