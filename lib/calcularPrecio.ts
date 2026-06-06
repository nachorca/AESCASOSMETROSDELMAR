// lib/calcularPrecio.ts
// ============================================================
// Cálculo de precio en el SERVIDOR — fuente única de verdad
// ============================================================
// Conecta con el motor de tarifas (evaluarTarifa):
//   - Si hay regla en rate_rules para esas fechas -> manda esa
//     regla: su descuento, y rechaza si no llega al mínimo.
//   - Si NO hay regla -> sin descuento: se cobra el precio del
//     calendario (daily_prices) tal cual.
// La tarifa de limpieza se lee de la tabla `settings`
// (clave `cleaning_fee`), editable desde el panel admin.
// El sistema antiguo (pricing_rules) ya NO se usa.
// ============================================================

import { createClient } from "@supabase/supabase-js";
import { evaluarTarifa } from "./evaluarTarifa";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const PRECIO_FALLBACK = 130;
const LIMPIEZA_FALLBACK = 75;

function toKey(d: Date) {
  // Fecha en horario LOCAL (no UTC) para no leer el día equivocado.
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function nightsBetween(checkIn: string, checkOut: string) {
  const a = new Date(checkIn + "T00:00:00");
  const b = new Date(checkOut + "T00:00:00");
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

async function getCleaningFee(): Promise<number> {
  const { data, error } = await supabase
    .from("settings")
    .select("value")
    .eq("key", "cleaning_fee")
    .maybeSingle();

  if (error || !data) return LIMPIEZA_FALLBACK;
  const n = Number(data.value);
  return Number.isFinite(n) && n >= 0 ? n : LIMPIEZA_FALLBACK;
}

export async function calcularPrecio(checkIn: string, checkOut: string) {
  if (!checkIn || !checkOut || checkIn >= checkOut) {
    return { ok: false as const, error: "Fechas no válidas" };
  }

  const nights = nightsBetween(checkIn, checkOut);

  // --- 1. Suma de precios por noche (daily_prices) ---
  const pricesRes = await supabase
    .from("daily_prices")
    .select("date, price");

  if (pricesRes.error) {
    return { ok: false as const, error: "No se pudo calcular el precio" };
  }

  const priceMap: Record<string, number> = {};
  for (const p of pricesRes.data || []) {
    priceMap[p.date] = p.price;
  }

  let subtotal = 0;
  const start = new Date(checkIn + "T00:00:00");
  const end = new Date(checkOut + "T00:00:00");
  for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
    subtotal += priceMap[toKey(d)] ?? PRECIO_FALLBACK;
  }

  // --- 2. Motor de tarifas (rate_rules) ---
  const tarifa = await evaluarTarifa(checkIn, nights);

  // Si la tarifa NO permite la estancia -> rechazar con el mínimo
  if (!tarifa.permitida) {
    return {
      ok: false as const,
      error: `La estancia mínima para estas fechas es de ${tarifa.minNights} noches`,
      minNights: tarifa.minNights,
    };
  }

  // --- 3. Descuento: solo manda rate_rules ---
  const activeDiscount = tarifa.discountPercent;

  // --- 4. Tarifa de limpieza desde settings (editable en admin) ---
  const cleaningFee = await getCleaningFee();

  // --- 5. Total final ---
  const discountAmount = Math.round((subtotal * activeDiscount) / 100);
  const discountedSubtotal = subtotal - discountAmount;
  const total = discountedSubtotal + cleaningFee;

  return {
    ok: true as const,
    nights,
    subtotal,
    discountPercent: activeDiscount,
    discountAmount,
    cleaningFee,
    total,
    totalCents: total * 100,
  };
}
