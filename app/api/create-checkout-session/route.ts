// app/api/create-checkout-session/route.ts
// ============================================================
// Crea la sesión de pago de Stripe para una reserva directa
// ============================================================
// SEGURIDAD: el precio se calcula SIEMPRE en el servidor con
// calcularPrecio(). NUNCA se usa el importe que manda el
// navegador — así nadie puede manipular el precio a pagar.
// ============================================================

import Stripe from "stripe";
import { checkAvailability } from "@/lib/checkAvailability";
import { calcularPrecio } from "@/lib/calcularPrecio";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // 1. Disponibilidad
    const availability = await checkAvailability(body.checkIn, body.checkOut);
    if (!availability.available) {
      return Response.json(
        { ok: false, error: availability.reason },
        { status: 409 }
      );
    }

    // 2. Precio REAL calculado en el servidor (ignora body.amount)
    const precio = await calcularPrecio(body.checkIn, body.checkOut);
    if (!precio.ok) {
      return Response.json(
        { ok: false, error: precio.error },
        { status: 400 }
      );
    }

    // 3. Sesión de pago de Stripe con el importe seguro
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: "Reserva - A escasos metros del mar",
              description:
                "Reserva del apartamento turístico en El Campello",
            },
            unit_amount: precio.totalCents,
          },
          quantity: 1,
        },
      ],
      success_url: `${
        process.env.NEXT_PUBLIC_SITE_URL || "https://aescasosmetrosdelmar.com"
      }/pago/correcto?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${
        process.env.NEXT_PUBLIC_SITE_URL || "https://aescasosmetrosdelmar.com"
      }/pago/cancelado`,
      metadata: {
        checkIn: body.checkIn || "",
        checkOut: body.checkOut || "",
        guests: String(body.guests || ""),
      },
    });

    return Response.json({ ok: true, url: session.url });
  } catch {
    return Response.json(
      { ok: false, error: "No se pudo crear la sesión de pago" },
      { status: 500 }
    );
  }
}
