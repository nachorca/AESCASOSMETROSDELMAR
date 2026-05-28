// app/api/prices/bulk/route.ts
// ============================================================
// Aplica un mismo precio a un rango de fechas.
// Sobrescribe los precios existentes en ese rango sin avisar.
// Solo admin (cabecera x-admin-password).
// ============================================================
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function isAdmin(req: Request) {
  return req.headers.get("x-admin-password") === process.env.ADMIN_PASSWORD;
}

function toKey(d: Date) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export async function POST(req: Request) {
  if (!isAdmin(req)) {
    return Response.json(
      { ok: false, error: "No autorizado" },
      { status: 401 }
    );
  }

  const body = await req.json();
  const start: string = body.start || "";
  const end: string = body.end || "";
  const price = Number(body.price);

  if (!start || !end || !Number.isFinite(price) || price < 0) {
    return Response.json(
      { ok: false, error: "Datos no válidos" },
      { status: 400 }
    );
  }

  if (start > end) {
    return Response.json(
      { ok: false, error: "La fecha 'Desde' debe ser anterior o igual a 'Hasta'" },
      { status: 400 }
    );
  }

  // Construir la lista de fechas del rango (ambos extremos incluidos)
  const startDate = new Date(start + "T00:00:00");
  const endDate = new Date(end + "T00:00:00");
  const rows: { date: string; price: number }[] = [];

  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    rows.push({ date: toKey(d), price });
  }

  // Salvavidas: limite razonable de seguridad (3 años)
  if (rows.length > 1100) {
    return Response.json(
      { ok: false, error: "Rango demasiado grande (máx ~3 años)" },
      { status: 400 }
    );
  }

  const { error } = await supabase
    .from("daily_prices")
    .upsert(rows, { onConflict: "date" });

  if (error) {
    return Response.json(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }

  return Response.json({ ok: true, updated: rows.length });
}
