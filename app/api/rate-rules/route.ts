// app/api/rate-rules/route.ts
// ============================================================
// Endpoint del motor de tarifas (tabla rate_rules)
// ============================================================
// GET  -> devuelve todas las reglas de tarifa
// POST -> crea o actualiza una regla (solo admin)
// DELETE -> elimina una regla (solo admin)
//
// Una regla define, para un rango de fechas:
//   - rate_type: "day" / "week" / "month"
//   - min_nights: noches mínimas para esa tarifa
//   - discount_percent: descuento aplicado
//   - active: si la tarifa está encendida
// ============================================================

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function isAdmin(req: Request) {
  return req.headers.get("x-admin-password") === process.env.ADMIN_PASSWORD;
}

// --- GET: todas las reglas ---
export async function GET() {
  const { data, error } = await supabase
    .from("rate_rules")
    .select("*")
    .order("start_date", { ascending: true });

  if (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
  return Response.json({ ok: true, rules: data || [] });
}

// --- POST: crear o actualizar una regla ---
export async function POST(req: Request) {
  if (!isAdmin(req)) {
    return Response.json({ ok: false, error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json();

  // Validación básica
  if (!["day", "week", "month"].includes(body.rate_type)) {
    return Response.json(
      { ok: false, error: "Tipo de tarifa no válido" },
      { status: 400 }
    );
  }
  if (!body.start_date || !body.end_date || body.start_date > body.end_date) {
    return Response.json(
      { ok: false, error: "Rango de fechas no válido" },
      { status: 400 }
    );
  }

  const fila = {
    rate_type: body.rate_type,
    start_date: body.start_date,
    end_date: body.end_date,
    min_nights: Number(body.min_nights) || 1,
    discount_percent: Number(body.discount_percent) || 0,
    active: body.active !== false,
    updated_at: new Date().toISOString(),
  };

  // Si trae id -> actualiza esa regla; si no -> crea una nueva
  if (body.id) {
    const { data, error } = await supabase
      .from("rate_rules")
      .update(fila)
      .eq("id", body.id)
      .select()
      .single();

    if (error) {
      return Response.json({ ok: false, error: error.message }, { status: 500 });
    }
    return Response.json({ ok: true, rule: data });
  } else {
    const { data, error } = await supabase
      .from("rate_rules")
      .insert(fila)
      .select()
      .single();

    if (error) {
      return Response.json({ ok: false, error: error.message }, { status: 500 });
    }
    return Response.json({ ok: true, rule: data });
  }
}

// --- DELETE: eliminar una regla ---
export async function DELETE(req: Request) {
  if (!isAdmin(req)) {
    return Response.json({ ok: false, error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json();
  if (!body.id) {
    return Response.json(
      { ok: false, error: "Falta el id de la regla" },
      { status: 400 }
    );
  }

  const { error } = await supabase
    .from("rate_rules")
    .delete()
    .eq("id", body.id);

  if (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
  return Response.json({ ok: true });
}
