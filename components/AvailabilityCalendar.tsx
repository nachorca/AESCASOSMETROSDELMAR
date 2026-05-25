"use client";

import { useEffect, useMemo, useState } from "react";

type BlockedDate = {
  source: string;
  summary: string;
  start: string;
  end: string;
};

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function expandBlockedDates(blocked: BlockedDate[]) {
  const set = new Set<string>();

  blocked.forEach((item) => {
    const start = new Date(item.start + "T00:00:00");
    const end = new Date(item.end + "T00:00:00");

    for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
      set.add(toDateKey(d));
    }
  });

  return set;
}

function nightsBetween(start: string, end: string) {
  const a = new Date(start + "T00:00:00");
  const b = new Date(end + "T00:00:00");
  return Math.max(0, Math.round((b.getTime() - a.getTime()) / 86400000));
}

function getMonthData(base: Date, offset: number) {
  const date = new Date(base.getFullYear(), base.getMonth() + offset, 1);
  const year = date.getFullYear();
  const month = date.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const startOffset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  return {
    year,
    month,
    daysInMonth,
    startOffset,
    monthName: date.toLocaleDateString("es-ES", {
      month: "long",
      year: "numeric",
    }),
  };
}

type FormText = {
  phoneLabel: string;
  phoneRequired: string;
  emailLabel: string;
  emailOptional: string;
  phoneBanner: string;
};

export default function AvailabilityCalendar({
  minStayText,
  formText,
}: {
  minStayText?: string;
  formText?: FormText;
}) {
  const [blocked, setBlocked] = useState<BlockedDate[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkIn, setCheckIn] = useState<string | null>(null);
  const [checkOut, setCheckOut] = useState<string | null>(null);
  const [guests, setGuests] = useState(2);
  const [bookingError, setBookingError] = useState("");
  const [estanciaPermitida, setEstanciaPermitida] = useState(true);
  const [guestPhone, setGuestPhone] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [minNochesRegla, setMinNochesRegla] = useState(0);
  const [dailyPrices, setDailyPrices] = useState<Record<string, number>>({});
  const [weeklyDiscount, setWeeklyDiscount] = useState(0);
  const [monthlyDiscount, setMonthlyDiscount] = useState(0);

  const today = new Date();
  const baseMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthsToShow = 24;

  const blockedSet = useMemo(() => expandBlockedDates(blocked), [blocked]);

  useEffect(() => {
    async function loadAvailability() {
      try {
        const [availabilityRes, reservasRes, manualBlocksRes, pricesRes, pricingRulesRes] = await Promise.all([
          fetch("/api/availability"),
          fetch("/api/reservas"),
          fetch("/api/manual-blocks"),
          fetch("/api/prices"),
          fetch("/api/pricing-rules"),
        ]);

        const availabilityData = await availabilityRes.json();
        const reservasData = await reservasRes.json();
        const manualBlocksData = await manualBlocksRes.json();
        const pricesData = await pricesRes.json();
        const pricingRulesData = await pricingRulesRes.json();

        const icalBlocked = availabilityData.ok
          ? availabilityData.blocked || []
          : [];

        const reservasBlocked = reservasData.ok
          ? (reservasData.reservas || []).map((r: any) => ({
              source: "stripe",
              summary: "Reserva confirmada",
              start: r.check_in,
              end: r.check_out,
            }))
          : [];

        const manualBlocked = manualBlocksData.ok
          ? (manualBlocksData.blocks || []).map((b: any) => ({
              source: "manual",
              summary: b.reason || "Bloqueo manual",
              start: b.start_date,
              end: b.end_date,
            }))
          : [];

        setBlocked([...icalBlocked, ...reservasBlocked, ...manualBlocked]);

        if (pricesData.ok) {
          const map: Record<string, number> = {};
          (pricesData.prices || []).forEach((p: any) => {
            map[p.date] = p.price;
          });
          setDailyPrices(map);
        }

        if (pricingRulesData.ok) {
          setWeeklyDiscount(pricingRulesData.rules.weekly_discount || 0);
          setMonthlyDiscount(pricingRulesData.rules.monthly_discount || 0);
        }
      } catch (error) {
        console.error("Error cargando disponibilidad:", error);
      } finally {
        setLoading(false);
      }
    }

    loadAvailability();
  }, []);

  // Consulta al motor de tarifas si la estancia elegida es válida
  useEffect(() => {
    if (!checkIn || !checkOut) {
      setEstanciaPermitida(true);
      setMinNochesRegla(0);
      return;
    }
    const n = nightsBetween(checkIn, checkOut);
    fetch(`/api/check-estancia?checkIn=${checkIn}&nights=${n}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.ok && data.permitida === false) {
          setEstanciaPermitida(false);
          setMinNochesRegla(data.minNights || 0);
        } else {
          setEstanciaPermitida(true);
          setMinNochesRegla(0);
        }
      })
      .catch(() => {
        // Si falla la consulta, no bloqueamos: el servidor valida igual al pagar
        setEstanciaPermitida(true);
        setMinNochesRegla(0);
      });
  }, [checkIn, checkOut]);

  function rangeHasBlocked(start: string, end: string) {
    const a = new Date(start + "T00:00:00");
    const b = new Date(end + "T00:00:00");

    for (let d = new Date(a); d < b; d.setDate(d.getDate() + 1)) {
      if (blockedSet.has(toDateKey(d))) return true;
    }

    return false;
  }

  function handleSelect(dateKey: string, isBlocked: boolean) {
    if (isBlocked) return;

    if (!checkIn || (checkIn && checkOut)) {
      setCheckIn(dateKey);
      setCheckOut(null);
      return;
    }

    if (dateKey <= checkIn) {
      setCheckIn(dateKey);
      setCheckOut(null);
      return;
    }

    if (rangeHasBlocked(checkIn, dateKey)) {
      alert("La estancia seleccionada incluye fechas ocupadas. Elige otro rango.");
      setCheckIn(dateKey);
      setCheckOut(null);
      return;
    }

    setCheckOut(dateKey);
  }

  const nights = checkIn && checkOut ? nightsBetween(checkIn, checkOut) : 0;

  const pricePerNight = 130;
  const cleaningFee = 75;

  function getNightPrice(dateKey: string) {
    return dailyPrices[dateKey] ?? pricePerNight;
  }

  function calculateSubtotal() {
    if (!checkIn || !checkOut) return 0;

    let total = 0;
    const start = new Date(checkIn + "T00:00:00");
    const end = new Date(checkOut + "T00:00:00");

    for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
      total += getNightPrice(toDateKey(d));
    }

    return total;
  }

  const subtotal = calculateSubtotal();

  const activeDiscount =
    nights >= 28 && monthlyDiscount > 0
      ? monthlyDiscount
      : nights >= 7 && weeklyDiscount > 0
      ? weeklyDiscount
      : 0;

  const discountAmount = Math.round((subtotal * activeDiscount) / 100);
  const discountedSubtotal = subtotal - discountAmount;
  const total = nights ? discountedSubtotal + cleaningFee : 0;

  async function handlePayment() {
    if (!checkIn || !checkOut || !total) return;

    setBookingError("");

    const res = await fetch("/api/create-checkout-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        checkIn,
        checkOut,
        guests,
        guestPhone,
        guestEmail,
        amount: total * 100,
      }),
    });

    const data = await res.json();

    if (!data.ok) {
      setBookingError(data.error || "No disponible");
      return;
    }

    if (data.ok && data.url) {
      window.location.href = data.url;
    }
  }

  const whatsappText = encodeURIComponent(
    `Hola, quiero consultar disponibilidad para el apartamento A escasos metros del mar.\n\nEntrada: ${checkIn || "-"}\nSalida: ${checkOut || "-"}\nNoches: ${nights || "-"}`
  );

  return (
    <div className="rounded-2xl border border-slate-200 p-6 mb-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold">Disponibilidad real</h3>
          <p className="text-sm text-slate-500">
            Calendario completo con disponibilidad actualizada
          </p>
        </div>

        <span className="text-sm text-slate-500">
          {loading ? "Cargando..." : "12 meses visibles"}
        </span>
      </div>

      <div className="max-h-[620px] overflow-y-auto pr-2 space-y-8">
        {Array.from({ length: monthsToShow }, (_, offset) => {
          const monthData = getMonthData(baseMonth, offset);

          return (
            <div key={`${monthData.year}-${monthData.month}`}>
              <h4 className="mb-3 font-semibold capitalize text-slate-800">
                {monthData.monthName}
              </h4>

              <div className="grid grid-cols-7 gap-2 text-sm text-center mb-3 text-slate-500">
                {["L", "M", "X", "J", "V", "S", "D"].map((d) => (
                  <div key={d}>{d}</div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-2 text-sm">
                {Array.from({ length: monthData.startOffset }).map((_, i) => (
                  <div key={`empty-${i}`} className="p-3 rounded-xl invisible">
                    0
                  </div>
                ))}

                {Array.from({ length: monthData.daysInMonth }, (_, i) => i + 1).map((day) => {
                  const dateKey = toDateKey(
                    new Date(monthData.year, monthData.month, day)
                  );

                  const isPast = dateKey < toDateKey(today);
                  const isBlocked = blockedSet.has(dateKey) || isPast;
                  const selected = dateKey === checkIn || dateKey === checkOut;
                  const inRange =
                    checkIn && checkOut && dateKey > checkIn && dateKey < checkOut;

                  return (
                    <button
                      key={dateKey}
                      type="button"
                      disabled={isBlocked}
                      onClick={() => handleSelect(dateKey, isBlocked)}
                      className={`rounded-xl p-3 text-center transition ${
                        selected
                          ? "bg-slate-900 text-white font-semibold"
                          : inRange
                          ? "bg-slate-100 text-slate-900"
                          : isBlocked
                          ? "bg-slate-200 text-slate-400 line-through cursor-not-allowed"
                          : "bg-emerald-50 text-emerald-700 font-medium hover:bg-emerald-100"
                      }`}
                    >
                      <span className="block">{day}</span>
                      {!isBlocked && (
                        <span className="block text-[11px] mt-1 opacity-80">
                          {getNightPrice(dateKey)} €
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex gap-4 justify-center mt-6 text-sm">
        <span className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-emerald-100 border border-emerald-300"></span>
          Disponible
        </span>
        <span className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-slate-200 border border-slate-300"></span>
          Ocupado
        </span>
      </div>

      <div className="mt-8 rounded-2xl bg-[#f7f4ee] p-6 text-left">
        <h4 className="font-semibold mb-5 text-xl">Solicitud de reserva</h4>

        <div className="grid md:grid-cols-4 gap-4 text-sm text-slate-700 mb-6">
          <div>
            <p className="text-slate-500 mb-1">Entrada</p>
            <p className="font-medium">{checkIn || "Seleccionar"}</p>
          </div>

          <div>
            <p className="text-slate-500 mb-1">Salida</p>
            <p className="font-medium">{checkOut || "Seleccionar"}</p>
          </div>

          <div>
            <p className="text-slate-500 mb-1">Noches</p>
            <p className="font-medium">{nights || "-"}</p>
          </div>

          <div>
            <p className="text-slate-500 mb-1">Huéspedes</p>

            <select
              value={guests}
              onChange={(e) => setGuests(Number(e.target.value))}
              className="rounded-xl border border-slate-300 px-3 py-2 bg-white"
            >
              {[1, 2, 3, 4].map((g) => (
                <option key={g} value={g}>
                  {g} huésped{g > 1 ? "es" : ""}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <div>
            <p className="text-slate-500 mb-1 text-sm">
              {formText?.phoneLabel || "Teléfono / WhatsApp"}{" "}
              <span className="text-red-500">*</span>
            </p>
            <input
              type="tel"
              value={guestPhone}
              onChange={(e) => setGuestPhone(e.target.value)}
              placeholder="+34 600 000 000"
              className="w-full rounded-xl border border-slate-300 px-3 py-2 bg-white"
            />
          </div>
          <div>
            <p className="text-slate-500 mb-1 text-sm">
              {formText?.emailLabel || "Email"}{" "}
              <span className="text-slate-400">
                ({formText?.emailOptional || "opcional"})
              </span>
            </p>
            <input
              type="email"
              value={guestEmail}
              onChange={(e) => setGuestEmail(e.target.value)}
              placeholder="tucorreo@ejemplo.com"
              className="w-full rounded-xl border border-slate-300 px-3 py-2 bg-white"
            />
          </div>
        </div>

        <div className="rounded-2xl bg-white p-5 mb-6 border border-slate-200">
          <div className="flex justify-between mb-2">
            <span>Precio estancia × {nights} noches</span>
            <span>{subtotal} €</span>
          </div>

          {activeDiscount > 0 && (
            <div className="flex justify-between mb-2 text-emerald-700 font-medium">
              <span>
                Descuento estancia {nights >= 28 ? "mensual" : "semanal"} ({activeDiscount}%)
              </span>
              <span>-{discountAmount} €</span>
            </div>
          )}

          <div className="flex justify-between mb-2">
            <span>Limpieza</span>
            <span>{cleaningFee} €</span>
          </div>

          <div className="border-t border-slate-200 pt-3 mt-3 flex justify-between font-semibold text-lg">
            <span>Total estimado</span>
            <span>{total} €</span>
          </div>
        </div>

        {!estanciaPermitida && minNochesRegla > 0 && (
          <div className="mb-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-800 px-4 py-3 text-sm font-medium">
            {(minStayText || "Para las fechas seleccionadas, la estancia mínima es de {n} noches. Ajusta tu salida para poder reservar.").replace("{n}", String(minNochesRegla))}
          </div>
        )}

        {bookingError && (
          <div className="mb-4 rounded-2xl bg-red-100 border border-red-200 text-red-700 px-4 py-3 text-sm">
            {bookingError}
          </div>
        )}

        {checkIn && checkOut && estanciaPermitida && !guestPhone.trim() && (
          <div className="mb-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-800 px-4 py-3 text-sm font-medium">
            {formText?.phoneBanner ||
              "Introduce tu teléfono para continuar con la reserva."}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={handlePayment}
            disabled={
              !checkIn || !checkOut || !estanciaPermitida || !guestPhone.trim()
            }
            className={`inline-flex justify-center rounded-2xl px-6 py-3 font-medium ${
              checkIn && checkOut && estanciaPermitida && guestPhone.trim()
                ? "bg-slate-900 text-white"
                : "bg-slate-200 text-slate-400 cursor-not-allowed"
            }`}
          >
            Pagar reserva segura
          </button>

          <a
            href={`https://wa.me/34665691462?text=${whatsappText}`}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex justify-center rounded-2xl px-6 py-3 font-medium ${
              checkIn && checkOut
                ? "bg-green-600 text-white"
                : "bg-slate-200 text-slate-400 pointer-events-none"
            }`}
          >
            Consultar por WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}
