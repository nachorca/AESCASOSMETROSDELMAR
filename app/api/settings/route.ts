// app/api/settings/route.ts
// ============================================================
// Configuración general clave-valor de la web.
//   GET  -> público, devuelve todos los settings como objeto.
//   POST -> admin (x-admin-password), actualiza un setting.
// ============================================================

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function isAdmin(req: Request) {
  return req.headers.get("x-admin-password") === process.env.ADMIN_PASSWORD;
}

export async function GET() {
  const { data, error } = await supabase
    .from("settings")
    .select("key, value");

  if (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }

  // Convertimos a objeto { cleaning_fee: "75", ... } para uso cómodo.
  const out: Record<string, string> = {};
  for (const row of data || []) out[row.key] = row.value;

  return Response.json({ ok: true, settings: out });
}

export async function POST(req: Request) {
  if (!isAdmin(req)) {
    return Response.json({ ok: false, error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json();
  const key = String(body.key || "").trim();
  const value = String(body.value ?? "").trim();

  if (!key) {
    return Response.json({ ok: false, error: "Falta la clave" }, { status: 400 });
  }

  const { error } = await supabase
    .from("settings")
    .upsert(
      { key, value, updated_at: new Date().toISOString() },
      { onConflict: "key" }
    );

  if (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }

  return Response.json({ ok: true });
}
