import { createClient } from "@supabase/supabase-js";
import { checkAvailability } from "@/lib/checkAvailability";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function isAdmin(req: Request) {
  return req.headers.get("x-admin-password") === process.env.ADMIN_PASSWORD;
}

export async function GET() {
  const { data, error } = await supabase
    .from("manual_blocks")
    .select("*")
    .eq("active", true)
    .order("start_date", { ascending: true });

  if (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }

  return Response.json({ ok: true, blocks: data || [] });
}

export async function POST(req: Request) {
  if (!isAdmin(req)) {
    return Response.json({ ok: false, error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json();

  const availability = await checkAvailability(
    body.start_date,
    body.end_date
  );

  if (!availability.available) {
    return Response.json(
      {
        ok: false,
        error: availability.reason,
      },
      { status: 409 }
    );
  }

  const { data, error } = await supabase
    .from("manual_blocks")
    .insert({
      start_date: body.start_date,
      end_date: body.end_date,
      reason: body.reason || "Bloqueo manual",
      active: true,
    })
    .select()
    .single();

  if (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }

  return Response.json({ ok: true, block: data });
}

export async function PUT(req: Request) {
  if (!isAdmin(req)) {
    return Response.json({ ok: false, error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json();

  // Al editar, ignoramos el propio bloqueo para que no choque consigo mismo.
  const availability = await checkAvailability(
    body.start_date,
    body.end_date,
    body.id
  );

  if (!availability.available) {
    return Response.json(
      {
        ok: false,
        error: availability.reason,
      },
      { status: 409 }
    );
  }

  const { data, error } = await supabase
    .from("manual_blocks")
    .update({
      start_date: body.start_date,
      end_date: body.end_date,
      reason: body.reason || "Bloqueo manual",
    })
    .eq("id", body.id)
    .select()
    .single();

  if (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }

  return Response.json({ ok: true, block: data });
}

export async function DELETE(req: Request) {
  if (!isAdmin(req)) {
    return Response.json({ ok: false, error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json();

  const { error } = await supabase
    .from("manual_blocks")
    .update({ active: false })
    .eq("id", body.id);

  if (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }

  return Response.json({ ok: true });
}
