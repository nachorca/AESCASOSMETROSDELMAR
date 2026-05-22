// app/api/create-checkout-session/route.ts
// ============================================================
// Crea la sesión de pago de Stripe para una reserva directa
// ============================================================
// Antes de crear la sesión de pago, valida la disponibilidad
// con checkAvailability (que ahora comprueba reservas directas,
// bloqueos manuales y reservas externas de Airbnb/Booking).
// La revalidación definitiva se hace en el webhook de Stripe.
// ============================================================

import Stripe from "stripe";
import { checkAvailability } from "@/lib/checkAvailability";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const availability = await checkAvailability(body.checkIn, body.checkOut);

    if (!availability.available) {
      return Response.json(
        {
          ok: false,
          error: availability.reason,
        },
        { status: 409 }
      );
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: "Reserva - Los Roques",
              description:
                "Reserva del apartamento turístico Los Roques en El Campello",
            },
            unit_amount: body.amount || 10000,
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

    return Response.json({
      ok: true,
      url: session.url,
    });
  } catch {
    return Response.json(
      {
        ok: false,
        error: "No se pudo crear la sesión de pago",
      },
      { status: 500 }
    );
  }
}
