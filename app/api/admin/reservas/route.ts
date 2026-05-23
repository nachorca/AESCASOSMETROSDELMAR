import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request) {
  const auth = req.headers.get("x-admin-password");

  if (!auth || auth !== process.env.ADMIN_PASSWORD) {
    return Response.json({ ok: false, error: "No autorizado" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("reservas")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }

  return Response.json({ ok: true, reservas: data || [] });
}


export async function DELETE(req: Request) {
  const auth = req.headers.get("x-admin-password");
  if (!auth || auth !== process.env.ADMIN_PASSWORD) {
    return Response.json({ ok: false, error: "No autorizado" }, { status: 401 });
  }

  let id: string | undefined;
  try {
    const body = await req.json();
    id = body.id;
  } catch {
    return Response.json({ ok: false, error: "Falta el id de la reserva" }, { status: 400 });
  }

  if (!id) {
    return Response.json({ ok: false, error: "Falta el id de la reserva" }, { status: 400 });
  }

  const { error } = await supabase.from("reservas").delete().eq("id", id);

  if (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }

  return Response.json({ ok: true });
}
