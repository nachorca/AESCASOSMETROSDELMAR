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
    .from("daily_prices")
    .select("*");
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
