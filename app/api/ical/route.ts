// app/api/ical/route.ts
// ============================================================
// Calendario iCal de Los Roques (calendario saliente)
// ============================================================
// Genera el feed iCal con TODA la ocupación del apartamento:
//   1. reservas             -> reservas directas confirmadas
//   2. manual_blocks        -> bloqueos manuales
//   3. external_reservations -> reservas de Airbnb / Booking
//
// Así este calendario es la "fuente única de verdad": si se
// importa esta URL en Airbnb y Booking, cada plataforma ve la
// ocupación de la otra y se evitan dobles reservas.
//
// Nota sobre fechas: DTEND con VALUE=DATE es EXCLUSIVO. Una
// reserva del 1 al 8 ocupa las noches 1..7 y deja libre el 8.
// ============================================================

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function formatDate(date: string) {
  return date.replace(/-/g, "");
}

// Escapa caracteres especiales en los textos del iCal
function escapeText(text: string) {
  return String(text)
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

export async function GET() {
  const reservasRes = await supabase
    .from("reservas")
    .select("id, check_in, check_out")
    .eq("status", "confirmed");

  const blocksRes = await supabase
    .from("manual_blocks")
    .select("id, start_date, end_date, reason")
    .eq("active", true);

  const externalRes = await supabase
    .from("external_reservations")
    .select("id, check_in, check_out, source, summary")
    .eq("status", "confirmed");

  const reservas = reservasRes.data || [];
  const blocks = blocksRes.data || [];
  const external = externalRes.data || [];

  let ical = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Los Roques//ES
CALSCALE:GREGORIAN
`;

  // 1. Reservas directas
  reservas.forEach((r) => {
    ical += `BEGIN:VEVENT
UID:reserva-${r.id}
DTSTART;VALUE=DATE:${formatDate(r.check_in)}
DTEND;VALUE=DATE:${formatDate(r.check_out)}
SUMMARY:Reserva directa
END:VEVENT
`;
  });

  // 2. Bloqueos manuales
  blocks.forEach((b) => {
    ical += `BEGIN:VEVENT
UID:bloqueo-${b.id}
DTSTART;VALUE=DATE:${formatDate(b.start_date)}
DTEND;VALUE=DATE:${formatDate(b.end_date)}
SUMMARY:${escapeText(b.reason || "Bloqueo manual")}
END:VEVENT
`;
  });

  // 3. Reservas externas (Airbnb / Booking)
  external.forEach((e) => {
    ical += `BEGIN:VEVENT
UID:externa-${e.id}
DTSTART;VALUE=DATE:${formatDate(e.check_in)}
DTEND;VALUE=DATE:${formatDate(e.check_out)}
SUMMARY:${escapeText(e.summary || `Reserva ${e.source || "externa"}`)}
END:VEVENT
`;
  });

  ical += `END:VCALENDAR
`;

  return new Response(ical, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
  });
}
