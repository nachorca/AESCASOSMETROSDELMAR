// lib/i18n/config.ts
// ============================================================
// Configuración de idiomas del sitio
// ============================================================
// Aquí se define qué idiomas existen y cuál es el de por defecto.
// El español es el idioma por defecto.
//
// Fase 1: es, en  (los que se rellenan ahora)
// Fase 2: fr
// Fase 3: de, nl
// ============================================================

export const locales = ["es", "en", "fr", "de", "nl"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "es";

// Nombre de cada idioma para mostrar en el selector
export const localeNames: Record<Locale, string> = {
  es: "Español",
  en: "English",
  fr: "Français",
  de: "Deutsch",
  nl: "Nederlands",
};

// Bandera (emoji) de cada idioma para el selector
export const localeFlags: Record<Locale, string> = {
  es: "🇪🇸",
  en: "🇬🇧",
  fr: "🇫🇷",
  de: "🇩🇪",
  nl: "🇳🇱",
};

// Comprueba si un texto recibido es un idioma válido
export function isValidLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}
