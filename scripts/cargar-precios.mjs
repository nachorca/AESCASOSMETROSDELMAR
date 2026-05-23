// scripts/cargar-precios.mjs
// ============================================================
// Carga de precios por temporada en la tabla daily_prices
// ============================================================
// Recorre un rango de fechas, decide la temporada de cada día
// y guarda el precio en Supabase (tabla daily_prices) mediante
// upsert: si se vuelve a ejecutar, actualiza, no duplica.
//
// Ejecutar:  node scripts/cargar-precios.mjs
// Modo prueba (no escribe nada, solo muestra): añade --dry
// ============================================================

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

// --- Lee las variables de .env.local ---
const env = {};
for (const line of readFileSync(".env.local", "utf8").split("\n")) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].trim();
}

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);

// --- TARIFAS POR TEMPORADA (edita aquí cuando quieras) ---
const PRECIOS = {
  alta:       200,  // julio, agosto
  mediaAlta:  150,  // junio, septiembre
  media:      125,  // abril, mayo, octubre
  baja:        95,  // nov-marzo, entre semana
  bajaFinde:  115,  // nov-marzo, viernes y sábado
};

// --- RANGO A CARGAR ---
const DESDE = "2026-06-01";
const HASTA = "2027-12-31";

// Decide el precio de un día concreto
function precioDelDia(fecha) {
  const mes = fecha.getMonth() + 1;       // 1-12
  const diaSemana = fecha.getDay();        // 0=domingo ... 6=sábado
  const esFinde = diaSemana === 5 || diaSemana === 6; // viernes o sábado

  if (mes === 7 || mes === 8) return PRECIOS.alta;
  if (mes === 6 || mes === 9) return PRECIOS.mediaAlta;
  if (mes === 4 || mes === 5 || mes === 10) return PRECIOS.media;
  // resto = temporada baja (nov, dic, ene, feb, mar)
  return esFinde ? PRECIOS.bajaFinde : PRECIOS.baja;
}

function toKey(d) {
  return d.toISOString().slice(0, 10);
}

async function main() {
  const dry = process.argv.includes("--dry");
  const filas = [];

  let d = new Date(DESDE + "T12:00:00");
  const fin = new Date(HASTA + "T12:00:00");

  while (d <= fin) {
    filas.push({ date: toKey(d), price: precioDelDia(d) });
    d.setDate(d.getDate() + 1);
  }

  // Resumen por temporada
  const resumen = {};
  for (const f of filas) resumen[f.price] = (resumen[f.price] || 0) + 1;
  console.log(`\n📅 ${filas.length} días, de ${DESDE} a ${HASTA}`);
  console.log("Precios y nº de noches:");
  for (const [precio, n] of Object.entries(resumen)) {
    console.log(`   ${precio} € → ${n} noches`);
  }

  if (dry) {
    console.log("\n🔍 Modo prueba (--dry): NO se ha escrito nada.");
    console.log("Primeros 10 días de ejemplo:");
    console.table(filas.slice(0, 10));
    return;
  }

  console.log("\n⏳ Guardando en Supabase...");
  const { error } = await supabase
    .from("daily_prices")
    .upsert(filas, { onConflict: "date" });

  if (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
  console.log(`✅ ${filas.length} precios cargados correctamente en daily_prices.`);
}

main();
