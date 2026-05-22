// lib/i18n/index.ts
// ============================================================
// Lector de traducciones
// ============================================================
// Dado un idioma, carga su diccionario JSON y devuelve una
// función `t()` para pedir textos por su clave.
// ============================================================

import { type Locale, defaultLocale } from "./config";

import es from "./es.json";
import en from "./en.json";
import fr from "./fr.json";
import de from "./de.json";
import nl from "./nl.json";

const dictionaries: Record<string, Record<string, unknown>> = {
  es,
  en,
  fr,
  de,
  nl,
};

function resolveKey(
  dict: Record<string, unknown>,
  key: string
): string | undefined {
  const parts = key.split(".");
  let current: unknown = dict;

  for (const part of parts) {
    if (current && typeof current === "object" && part in current) {
      current = (current as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }

  return typeof current === "string" ? current : undefined;
}

export function getTranslations(locale: Locale) {
  const dict = dictionaries[locale] || dictionaries[defaultLocale];
  const fallback = dictionaries[defaultLocale];

  return function t(key: string): string {
    const value = resolveKey(dict, key);
    if (value !== undefined) return value;

    const fallbackValue = resolveKey(fallback, key);
    if (fallbackValue !== undefined) return fallbackValue;

    return key;
  };
}

export type TranslationFunction = ReturnType<typeof getTranslations>;
