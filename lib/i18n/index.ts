// lib/i18n/index.ts
// ============================================================
// Lector de traducciones
// ============================================================
// Dado un idioma, carga su diccionario JSON y devuelve una
// función `t()` para pedir textos por su clave.
//
// Uso en una página:
//   const t = await getTranslations("en");
//   t("hero.title")  ->  "Just steps from the sea"
//
// Si una clave no existe en el idioma pedido, cae al español
// (para que nunca se muestre un hueco vacío en la web).
// ============================================================

import { type Locale, defaultLocale } from "./config";

import es from "./es.json";
import en from "./en.json";
import fr from "./fr.json";

// Diccionarios disponibles. Cuando se añadan fr/de/nl, se
// importan arriba y se registran aquí.
const dictionaries: Record<string, Record<string, unknown>> = {
  es,
  en,
  fr,
};

// Recorre un objeto anidado siguiendo una ruta tipo "hero.title"
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

// Devuelve la función de traducción para un idioma dado
export function getTranslations(locale: Locale) {
  // Diccionario del idioma pedido (si no existe aún, usa español)
  const dict = dictionaries[locale] || dictionaries[defaultLocale];
  const fallback = dictionaries[defaultLocale];

  return function t(key: string): string {
    // 1. Intenta en el idioma pedido
    const value = resolveKey(dict, key);
    if (value !== undefined) return value;

    // 2. Si no está, intenta en español (fallback)
    const fallbackValue = resolveKey(fallback, key);
    if (fallbackValue !== undefined) return fallbackValue;

    // 3. Si tampoco, devuelve la propia clave (señal visible de
    //    que falta una traducción, para detectarlo en pruebas)
    return key;
  };
}

export type TranslationFunction = ReturnType<typeof getTranslations>;
