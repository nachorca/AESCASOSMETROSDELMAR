// lib/evaluarTarifa.ts
// ============================================================
// Motor de tarifas — evalúa qué regla aplica a una reserva
// ============================================================
// Dada una reserva (fechas + nº de noches), consulta rate_rules
// y decide:
//   1. Si la reserva está PERMITIDA (estancia mínima).
//   2. Qué descuento aplicar.
//
// Si NO hay reglas para esas fechas -> reserva permitida sin
// descuento (no rompe el comportamiento actual).
// ============================================================

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type RateRule = {
  id: string;
  rate_type: "day" | "week" | "month";
  start_date: string;
  end_date: string;
  min_nights: number;
  discount_percent: number;
  active: boolean;
};

export type ResultadoTarifa =
  | { permitida: true; discountPercent: number }
  | { permitida: false; minNights: number };

// Una regla "cubre" la estancia si su rango contiene el check-in.
// (Simplificación: la regla del día de entrada manda. Suficiente
//  para tarifas por temporada; se puede afinar en el futuro.)
function reglaCubre(rule: RateRule, checkIn: string) {
  return rule.start_date <= checkIn && checkIn <= rule.end_date;
}

export async function evaluarTarifa(
  checkIn: string,
  nights: number
): Promise<ResultadoTarifa> {
  const { data, error } = await supabase
    .from("rate_rules")
    .select("*")
    .eq("active", true);

  // Si falla la consulta o no hay reglas -> permitir sin descuento.
  if (error || !data || data.length === 0) {
    return { permitida: true, discountPercent: 0 };
  }

  // Reglas activas que cubren la fecha de entrada
  const aplicables = (data as RateRule[]).filter((r) =>
    reglaCubre(r, checkIn)
  );

  if (aplicables.length === 0) {
    return { permitida: true, discountPercent: 0 };
  }

  // Ordenar por min_nights ascendente: la tarifa más corta primero
  aplicables.sort((a, b) => a.min_nights - b.min_nights);

  // La tarifa más corta disponible marca la estancia mínima.
  const minimaDisponible = aplicables[0].min_nights;

  // Si no llega ni al mínimo de la tarifa más corta -> RECHAZAR
  if (nights < minimaDisponible) {
    return { permitida: false, minNights: minimaDisponible };
  }

  // Encaja: aplicar el descuento de la mejor tarifa posible
  // (la de mayor min_nights que el huésped cumpla).
  let mejor = aplicables[0];
  for (const r of aplicables) {
    if (nights >= r.min_nights) {
      mejor = r;
    }
  }

  return { permitida: true, discountPercent: mejor.discount_percent };
}
