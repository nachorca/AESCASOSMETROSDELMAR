// lib/calcularPrecio.ts
// ============================================================
// Cálculo de precio en el SERVIDOR — fuente única de verdad
// ============================================================
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const PRECIO_FALLBACK = 130;
const LIMPIEZA = 75;

function toKey(d: Date) {
  // Construye la fecha en horario LOCAL (no UTC).
  // toISOString() convierte a UTC y puede retroceder un dia,
  // leyendo el precio del dia equivocado. Esto lo evita.
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

export async function calcularPrecio(checkIn: string, checkOut: string) {
  if (!checkIn || !checkOut || checkIn >= checkOut) {
    return { ok: false as const, error: "Fechas no válidas" };
  }

  const nights = nightsBetween(checkIn, checkOut);

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

  const rulesRes = await supabase
    .from("pricing_rules")
    .select("weekly_discount, monthly_discount")
    .limit(1)
    .single();

  const weeklyDiscount = rulesRes.data?.weekly_discount || 0;
  const monthlyDiscount = rulesRes.data?.monthly_discount || 0;

  const activeDiscount =
    nights >= 28 && monthlyDiscount > 0
      ? monthlyDiscount
      : nights >= 7 && weeklyDiscount > 0
      ? weeklyDiscount
      : 0;

  const discountAmount = Math.round((subtotal * activeDiscount) / 100);
  const discountedSubtotal = subtotal - discountAmount;
  const total = discountedSubtotal + LIMPIEZA;

  return {
    ok: true as const,
    nights,
    subtotal,
    discountPercent: activeDiscount,
    discountAmount,
    cleaningFee: LIMPIEZA,
    total,
    totalCents: total * 100,
  };
}
