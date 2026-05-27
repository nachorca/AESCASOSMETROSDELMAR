// app/api/check-estancia/route.ts
// ============================================================
// Endpoint ligero para el calendario público.
// Dada una fecha de entrada y un nº de noches, consulta el
// motor de tarifas y devuelve:
//   - permitida (boolean)
//   - discountPercent (cuando permitida = true)
//   - minNights (cuando permitida = false)
// Solo lectura — no crea reservas ni cobra nada.
// ============================================================
import { evaluarTarifa } from "@/lib/evaluarTarifa";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const checkIn = url.searchParams.get("checkIn") || "";
  const nights = Number(url.searchParams.get("nights") || "0");

  if (!checkIn || nights <= 0) {
    return Response.json({ ok: false, error: "Parámetros no válidos" });
  }

  const tarifa = await evaluarTarifa(checkIn, nights);

  if (tarifa.permitida) {
    return Response.json({
      ok: true,
      permitida: true,
      discountPercent: tarifa.discountPercent,
    });
  }

  return Response.json({
    ok: true,
    permitida: false,
    minNights: tarifa.minNights,
  });
}
