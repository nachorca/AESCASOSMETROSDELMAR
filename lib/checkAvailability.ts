// lib/checkAvailability.ts
// ============================================================
// Guardiana de disponibilidad de Los Roques
// ============================================================
// Esta es la ÚNICA función que valida si unas fechas están
// libres. La usan: create-checkout-session (antes de cobrar),
// el webhook de Stripe (antes de guardar la reserva) y
// manual-blocks (antes de bloquear fechas).
//
// Comprueba las 3 fuentes de ocupación:
//   1. reservas        -> reservas directas pagadas por la web
//   2. manual_blocks   -> bloqueos manuales del propietario
//   3. external_reservations -> reservas importadas de Airbnb/Booking
// ============================================================

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Dos rangos [startA, endA) y [startB, endB) se solapan si y solo si
// startA < endB && endA > startB.
// Usamos comparadores ESTRICTOS (< y >), no <=, para permitir que
// una reserva termine (check-out) el mismo día que otra empieza
// (check-in). Ej: A sale el día 8, B entra el día 8 -> NO se solapan.
function overlaps(
  startA: string,
  endA: string,
  startB: string,
  endB: string
) {
  return startA < endB && endA > startB;
}

export async function checkAvailability(
  checkIn: string,
  checkOut: string,
  // Opcional: id de un bloqueo manual a ignorar (para poder EDITAR
  // una reserva manual sin que choque consigo misma).
  excludeManualBlockId?: string
) {
  // Validación básica de entrada
  if (!checkIn || !checkOut) {
    return { available: false, reason: "Fechas no válidas" };
  }
  if (checkIn >= checkOut) {
    return {
      available: false,
      reason: "La fecha de salida debe ser posterior a la de entrada",
    };
  }

  // 1. Reservas directas confirmadas
  const reservasRes = await supabase
    .from("reservas")
    .select("check_in, check_out")
    .eq("status", "confirmed");

  // 2. Bloqueos manuales activos
  const blocksRes = await supabase
    .from("manual_blocks")
    .select("id, start_date, end_date")
    .eq("active", true);

  // 3. Reservas externas (Airbnb / Booking) confirmadas
  const externalRes = await supabase
    .from("external_reservations")
    .select("check_in, check_out")
    .eq("status", "confirmed");

  // Si alguna consulta falla, fallamos de forma SEGURA:
  // ante la duda, decimos que NO está disponible. Mejor perder
  // una reserva que aceptar una doble reserva.
  if (reservasRes.error || blocksRes.error || externalRes.error) {
    return {
      available: false,
      reason: "No se pudo verificar la disponibilidad. Inténtalo de nuevo.",
    };
  }

  const reservas = reservasRes.data || [];
  const blocks = blocksRes.data || [];
  const external = externalRes.data || [];

  // Comprobar contra reservas directas
  for (const r of reservas) {
    if (overlaps(checkIn, checkOut, r.check_in, r.check_out)) {
      return {
        available: false,
        reason: "Fechas ocupadas por otra reserva",
      };
    }
  }

  // Comprobar contra bloqueos manuales
  for (const b of blocks) {
    // Si estamos editando un bloqueo, lo ignoramos: no debe
    // chocar consigo mismo.
    if (excludeManualBlockId && b.id === excludeManualBlockId) continue;
    if (overlaps(checkIn, checkOut, b.start_date, b.end_date)) {
      return {
        available: false,
        reason: "Fechas bloqueadas manualmente",
      };
    }
  }

  // Comprobar contra reservas externas (Airbnb / Booking)
  for (const e of external) {
    if (overlaps(checkIn, checkOut, e.check_in, e.check_out)) {
      return {
        available: false,
        reason: "Fechas ocupadas por una reserva externa",
      };
    }
  }

  return { available: true };
}
