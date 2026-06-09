// lib/sincronizarExternal.ts
// ============================================================
// Sincronización del iCal de Airbnb/Booking con la tabla
// `external_reservations`.
//
// REGLAS clave (Opción B — Jose, 6 jun 2026):
//
//  1. UPSERT por `external_uid`: si la reserva externa ya
//     existe, SOLO actualiza summary/fechas/status. Nunca
//     toca los campos manuales (guest_name, guest_phone,
//     guest_email, checkin_status, cleaning_status,
//     internal_notes, etc.). Así no se pierde el trabajo
//     que el host ha metido a mano.
//
//  2. LIMPIEZA inteligente de cancelaciones: tras upsertar,
//     borra solo las externas que cumplen TODAS estas:
//       - ya NO aparecen en el iCal actual
//       - check_in está en el futuro (no tocar pasado)
//       - no tienen datos manuales (guest_name vacío
//         Y guest_phone vacío Y guest_email vacío)
//     Eso son cancelaciones limpias y se eliminan sin
//     riesgo de perder información.
//
//  3. NUNCA se hace DELETE masivo previo. Eso era el bug.
// ============================================================

import ICAL from "ical.js";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function formatDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

type ParsedEvent = {
  source: string;
  external_uid: string;
  summary: string;
  check_in: string;
  check_out: string;
  status: string;
};

function overlapsOrTouches(a: ParsedEvent, b: ParsedEvent) {
  return a.source === b.source && a.check_in < b.check_out && a.check_out > b.check_in;
}

function normalizeEvents(events: ParsedEvent[]): ParsedEvent[] {
  const sorted = events.sort((a, b) =>
    `${a.source}-${a.check_in}`.localeCompare(`${b.source}-${b.check_in}`)
  );

  const merged: ParsedEvent[] = [];

  for (const event of sorted) {
    const last = merged[merged.length - 1];

    if (last && overlapsOrTouches(last, event)) {
      last.check_in = last.check_in < event.check_in ? last.check_in : event.check_in;
      last.check_out = last.check_out > event.check_out ? last.check_out : event.check_out;
      last.summary = last.summary || event.summary;
      last.external_uid = `${last.source}-${last.check_in}-${last.check_out}`;
    } else {
      merged.push({ ...event });
    }
  }

  return merged;
}

async function readCalendar(url: string | undefined, source: string): Promise<ParsedEvent[]> {
  if (!url) return [];

  const res = await fetch(url, { cache: "no-store" });
  const text = await res.text();

  const jcal = ICAL.parse(text);
  const comp = new ICAL.Component(jcal);
  const events = comp.getAllSubcomponents("vevent");

  return events.map((event) => {
    const vevent = new ICAL.Event(event);
    const checkIn = formatDate(vevent.startDate.toJSDate());
    const checkOut = formatDate(vevent.endDate.toJSDate());

    return {
      source,
      external_uid: `${source}-${checkIn}-${checkOut}`,
      summary: vevent.summary || "Reserva externa",
      check_in: checkIn,
      check_out: checkOut,
      status: "confirmed",
    };
  });
}

export async function sincronizarExternal() {
  // 1. Leer ambos calendarios y normalizar (mergea solapamientos del mismo origen).
  const airbnb = await readCalendar(process.env.AIRBNB_ICAL_URL, "airbnb");
  const booking = await readCalendar(process.env.BOOKING_ICAL_URL, "booking");
  const rows = normalizeEvents([...airbnb, ...booking]);

  // 2. UPSERT: si la fila ya existe, actualiza solo los campos del iCal.
  //    Los campos manuales (guest_name, guest_phone, guest_email,
  //    checkin_status, cleaning_status, internal_notes...) NO se
  //    incluyen en el payload, por tanto Postgres los deja intactos.
  if (rows.length > 0) {
    const { error } = await supabase
      .from("external_reservations")
      .upsert(rows, { onConflict: "external_uid" });

    if (error) {
      return { ok: false as const, error: error.message };
    }
  }

  // 3. LIMPIEZA de cancelaciones.
  //    Buscar externas en el futuro, SIN datos manuales, que ya no
  //    aparecen en el iCal actual -> son cancelaciones limpias.
  const uidsActuales = new Set(rows.map((r) => r.external_uid));
  const hoy = formatDate(new Date());

  const { data: futurasSinDatos, error: errSelect } = await supabase
    .from("external_reservations")
    .select("id, external_uid, check_in, guest_name, guest_phone, guest_email")
    .gte("check_in", hoy);

  if (errSelect) {
    return { ok: false as const, error: errSelect.message };
  }

  type FuturaRow = {
    id: string;
    external_uid: string | null;
    check_in: string;
    guest_name: string | null;
    guest_phone: string | null;
    guest_email: string | null;
  };

  const aBorrar = ((futurasSinDatos || []) as FuturaRow[]).filter((r) => {
    const sigueEnIcal = r.external_uid && uidsActuales.has(r.external_uid);
    const tieneDatosManuales =
      (r.guest_name && r.guest_name.trim() !== "") ||
      (r.guest_phone && r.guest_phone.trim() !== "") ||
      (r.guest_email && r.guest_email.trim() !== "");
    return !sigueEnIcal && !tieneDatosManuales;
  });

  let cancelacionesBorradas = 0;

  if (aBorrar.length > 0) {
    const ids = aBorrar.map((r: FuturaRow) => r.id);
    const { error: errDel } = await supabase
      .from("external_reservations")
      .delete()
      .in("id", ids);

    if (errDel) {
      return { ok: false as const, error: errDel.message };
    }
    cancelacionesBorradas = aBorrar.length;
  }

  return {
    ok: true as const,
    imported: rows.length,
    cancelacionesBorradas,
  };
}
