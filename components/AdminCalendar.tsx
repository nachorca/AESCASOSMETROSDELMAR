"use client";

import { useEffect, useState } from "react";

type Reservation = {
  id: string;
  tipo: string;
  entrada: string;
  salida: string;
};

type DailyPrice = {
  date: string;
  price: number;
};

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
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

function getColor(tipo: string) {
  if (tipo.includes("Airbnb")) return "bg-pink-500";
  if (tipo.includes("Booking")) return "bg-blue-500";
  if (tipo.includes("manual")) return "bg-amber-500";
  return "bg-emerald-600";
}

function isInside(date: string, start: string, end: string) {
  return date >= start && date < end;
}

function isStart(date: string, start: string) {
  return date === start;
}

function addDays(dateKey: string, days: number) {
  const d = new Date(dateKey + "T00:00:00");
  d.setDate(d.getDate() + days);
  return toDateKey(d);
}

export default function AdminCalendar({
  reservations,
  adminPassword,
}: {
  reservations: Reservation[];
  adminPassword: string;
}) {
  const today = new Date();
  const baseMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthsToShow = 18;

  const [prices, setPrices] = useState<Record<string, number>>({});
  const [savingDate, setSavingDate] = useState("");

  useEffect(() => {
    fetch("/api/prices")
      .then((res) => res.json())
      .then((data) => {
        if (!data.ok) return;

        const map: Record<string, number> = {};
        (data.prices || []).forEach((p: DailyPrice) => {
          map[p.date] = p.price;
        });

        setPrices(map);
      });
  }, []);

  function getReservationsForDate(dateKey: string) {
    return reservations.filter((r) => isInside(dateKey, r.entrada, r.salida));
  }

  async function savePrice(date: string, price: number) {
    setSavingDate(date);

    const res = await fetch("/api/prices", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-password": adminPassword,
      },
      body: JSON.stringify({ date, price }),
    });

    const data = await res.json();

    if (data.ok) {
      setPrices((prev) => ({ ...prev, [date]: price }));
    } else {
      alert(data.error || "No se pudo guardar el precio");
    }

    setSavingDate("");
  }

  return (
    <div className="w-full rounded-3xl bg-white border border-slate-200 p-4">
      {/* Oculta las flechitas del input numerico (Chrome, Safari y Firefox).
          El campo sigue siendo editable a mano con el teclado. */}
      <style jsx>{`
        input[type="number"].precio-noche::-webkit-outer-spin-button,
        input[type="number"].precio-noche::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        input[type="number"].precio-noche {
          -moz-appearance: textfield;
          appearance: textfield;
        }
      `}</style>

      {/* Scroll horizontal: los meses van en fila, se desplazan de izquierda a derecha */}
      <div className="overflow-x-auto pb-3">
        <div className="flex gap-6">
          {Array.from({ length: monthsToShow }, (_, offset) => {
            const monthData = getMonthData(baseMonth, offset);

            return (
              <div
                key={`${monthData.year}-${monthData.month}`}
                className="shrink-0 w-[320px]"
              >
                <h3 className="text-base font-semibold capitalize mb-2 py-2 border-b border-slate-100">
                  {monthData.monthName}
                </h3>

                <div className="grid grid-cols-7 gap-0 text-[10px] text-center text-slate-500 border-b border-slate-200">
                  {["L", "M", "X", "J", "V", "S", "D"].map((d, i) => (
                    <div
                      key={`${d}-${i}`}
                      className="py-1.5 border-r border-slate-200 last:border-r-0"
                    >
                      {d}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-0 text-sm border-l border-t border-slate-200">
                  {Array.from({ length: monthData.startOffset }).map((_, i) => (
                    <div
                      key={`empty-${i}`}
                      className="min-h-[78px] border-r border-b border-slate-200 bg-slate-50"
                    />
                  ))}

                  {Array.from(
                    { length: monthData.daysInMonth },
                    (_, i) => i + 1
                  ).map((day) => {
                    const dateKey = toDateKey(
                      new Date(monthData.year, monthData.month, day)
                    );

                    const dayReservations = getReservationsForDate(dateKey);
                    const checkOutsToday = reservations.filter(
                      (r) => r.salida === dateKey
                    );
                    const price = prices[dateKey] ?? 130;

                    return (
                      <div
                        key={dateKey}
                        className="relative min-h-[78px] border-r border-b border-slate-200 bg-white p-1 overflow-hidden"
                      >
                        <div className="font-semibold text-slate-900 text-[11px] leading-none mb-1">
                          {day}
                        </div>

                        <div className="space-y-0.5 min-h-[14px]">
                          {dayReservations.map((r) => {
                            const startsHere = isStart(dateKey, r.entrada);
                            const previousDate = addDays(dateKey, -1);
                            const continuesFromPrevious = isInside(
                              previousDate,
                              r.entrada,
                              r.salida
                            );

                            return (
                              <div
                                key={`${r.id}-${dateKey}`}
                                className={`${getColor(
                                  r.tipo
                                )} h-3.5 text-white text-[8px] flex items-center px-1 overflow-hidden ${
                                  startsHere ? "rounded-l-full" : ""
                                } ${
                                  !isInside(
                                    addDays(dateKey, 1),
                                    r.entrada,
                                    r.salida
                                  )
                                    ? "rounded-r-full"
                                    : ""
                                } ${continuesFromPrevious ? "-ml-2" : ""}`}
                              >
                                {startsHere
                                  ? r.tipo.replace("Reserva ", "")
                                  : ""}
                              </div>
                            );
                          })}
                        </div>

                        {checkOutsToday.length > 0 && (
                          <div className="mt-1 rounded bg-slate-100 px-1 py-0.5 text-[8px] text-slate-600 leading-none">
                            Salida 10:00
                          </div>
                        )}

                        <div className="mt-1">
                          <input
                            type="number"
                            inputMode="numeric"
                            value={price}
                            title="Precio noche"
                            onChange={(e) =>
                              setPrices((prev) => ({
                                ...prev,
                                [dateKey]: Number(e.target.value),
                              }))
                            }
                            onBlur={(e) =>
                              savePrice(dateKey, Number(e.target.value))
                            }
                            className="precio-noche w-full min-w-0 rounded border border-slate-300 px-0.5 py-0.5 text-center text-slate-900 text-[10px]"
                          />
                          {savingDate === dateKey && (
                            <p className="text-[8px] mt-0.5 text-slate-500 leading-none">
                              Guardando...
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <p className="text-[11px] text-slate-400 mt-1">
        Desliza el calendario de izquierda a derecha para ver los meses
        siguientes.
      </p>
    </div>
  );
}
