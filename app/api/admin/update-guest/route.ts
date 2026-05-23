import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function isAdmin(req: Request) {
  return req.headers.get("x-admin-password") === process.env.ADMIN_PASSWORD;
}

export async function POST(req: Request) {
  if (!isAdmin(req)) {
    return Response.json({ ok: false, error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json();

  const table =
    body.source === "external"
      ? "external_reservations"
      : body.source === "manual"
      ? "manual_blocks"
      : "reservas";

  const updateData =
    table === "external_reservations"
      ? {
          guest_name: body.guest_name || null,
          guest_phone: body.guest_phone || null,
          guest_email: body.guest_email || null,
        }
      : {
          customer_name: body.guest_name || null,
          customer_phone: body.guest_phone || null,
          customer_email: body.guest_email || null,
        };

  const { error } = await supabase
    .from(table)
    .update(updateData)
    .eq("id", body.id);

  if (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }

  return Response.json({ ok: true });
}
