import { createClient } from "@supabase/supabase-js";
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
function isAdmin(req: Request) {
  return req.headers.get("x-admin-password") === process.env.ADMIN_PASSWORD;
}
export async function GET() {
  // Supabase corta por defecto en 1000 filas: con precios de mas
  // de ~3 anos los calendarios dejarian de ver los dias lejanos.
  // Subimos el limite explicitamente (5000 dias ~ 13 anos).
  const { data, error } = await supabase
    .from("daily_prices")
    .select("*")
    .order("date", { ascending: true })
    .limit(5000);
  if (error) {
    return Response.json(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }
  return Response.json({
    ok: true,
    prices: data || [],
  });
}
export async function POST(req: Request) {
  if (!isAdmin(req)) {
    return Response.json(
      { ok: false, error: "No autorizado" },
      { status: 401 }
    );
  }
  const body = await req.json();
  const { data, error } = await supabase
    .from("daily_prices")
    .upsert(
      {
        date: body.date,
        price: body.price,
      },
      { onConflict: "date" }
    )
    .select()
    .single();
  if (error) {
    return Response.json(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }
  return Response.json({
    ok: true,
    price: data,
  });
}
