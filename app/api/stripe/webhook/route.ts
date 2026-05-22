// app/api/stripe/webhook/route.ts
// ============================================================
// Webhook de Stripe — confirma reservas tras el pago
// ============================================================
// Cuando Stripe confirma un pago (checkout.session.completed):
//   1. Revalida la disponibilidad (por si se ocuparon las fechas
//      mientras el cliente estaba pagando).
//   2. Si siguen libres -> guarda la reserva con status confirmed.
//   3. Si NO siguen libres -> NO guarda, registra el incidente
//      para que el propietario gestione el reembolso.
// ============================================================

import Stripe from "stripe";
import { headers } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { checkAvailability } from "@/lib/checkAvailability";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  const body = await req.text();
  const signature = (await headers()).get("stripe-signature");

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature!,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch {
    return new Response("Webhook Error", { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    const checkIn = session.metadata?.checkIn || null;
    const checkOut = session.metadata?.checkOut || null;

    // --- Revalidación de disponibilidad antes de guardar ---
    // Cierra el hueco temporal entre el pago y la confirmación:
    // si otra reserva ocupó estas fechas mientras se pagaba,
    // NO creamos la reserva y dejamos constancia para reembolso.
    if (checkIn && checkOut) {
      const availability = await checkAvailability(checkIn, checkOut);

      if (!availability.available) {
        console.error(
          `CONFLICTO DE RESERVA: la sesión ${session.id} pagó unas fechas ` +
            `que ya no están disponibles (${checkIn} -> ${checkOut}). ` +
            `Motivo: ${availability.reason}. Requiere reembolso manual.`
        );

        // Registramos el incidente como reserva en conflicto.
        // status "conflict" -> NO cuenta como ocupada (solo "confirmed" ocupa)
        // y aparece marcada en el panel admin para gestionarla.
        await supabase.from("reservas").insert({
          stripe_session_id: session.id,
          payment_status: session.payment_status,
          status: "conflict",
          source: "stripe",
          check_in: checkIn,
          check_out: checkOut,
          guests: Number(session.metadata?.guests || 2),
          amount_total: session.amount_total,
          currency: session.currency,
          customer_email: session.customer_details?.email,
          customer_name: session.customer_details?.name,
          internal_notes:
            "CONFLICTO: fechas ya ocupadas al confirmar el pago. " +
            "Revisar y reembolsar al cliente.",
        });

        // Respondemos 200 a Stripe igualmente: el evento se ha
        // procesado correctamente (otra cosa es que haya conflicto).
        return Response.json({ received: true, conflict: true });
      }
    }

    // --- Fechas libres: guardamos la reserva confirmada ---
    const { error } = await supabase.from("reservas").insert({
      stripe_session_id: session.id,
      payment_status: session.payment_status,
      status: "confirmed", // explícito (no dependemos del default de la BD)
      source: "stripe",
      check_in: checkIn,
      check_out: checkOut,
      guests: Number(session.metadata?.guests || 2),
      amount_total: session.amount_total,
      currency: session.currency,
      customer_email: session.customer_details?.email,
      customer_name: session.customer_details?.name,
    });

    if (error) {
      console.error("Error guardando reserva:", error);
    } else {
      console.log("Reserva guardada y confirmada:", session.id);
    }
  }

  return Response.json({ received: true });
}
