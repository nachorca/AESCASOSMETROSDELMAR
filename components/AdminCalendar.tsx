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
    <div className="w-full rounded-3xl bg-white border border-slate-200 p-4 overflow-hidden">
      <div className="max-h-[720px] overflow-y-auto pr-1 space-y-10">
        {Array.from({ length: monthsToShow }, (_, offset) => {
          const monthData = getMonthData(baseMonth, offset);

          return (
            <div key={`${monthData.year}-${monthData.month}`} className="w-full">
              <h3 className="text-xl font-semibold capitalize mb-4 sticky top-0 bg-white z-20 py-3 border-b border-slate-100">
                {monthData.monthName}
              </h3>

              <div className="grid grid-cols-7 gap-0 text-sm text-center mb-0 text-slate-500 sticky top-[58px] bg-white z-10 border-b border-slate-200">
                {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((d) => (
                  <div key={d} className="py-3 border-r border-slate-200 last:border-r-0">
                    {d}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-0 text-sm border-l border-t border-slate-200">
                {Array.from({ length: monthData.startOffset }).map((_, i) => (
                  <div key={`empty-${i}`} className="min-h-[145px] border-r border-b border-slate-200 bg-slate-50" />
                ))}

                {Array.from({ length: monthData.daysInMonth }, (_, i) => i + 1).map((day) => {
                  const dateKey = toDateKey(
                    new Date(monthData.year, monthData.month, day)
                  );

                  const dayReservations = getReservationsForDate(dateKey);
                  const checkOutsToday = reservations.filter((r) => r.salida === dateKey);
                  const price = prices[dateKey] ?? 130;

                  return (
                    <div
                      key={dateKey}
                      className="relative min-h-[120px] border-r border-b border-slate-200 bg-white p-1.5 overflow-hidden"
                    >
                      <div className="font-semibold text-slate-900 mb-2">{day}</div>

                      <div className="space-y-1 min-h-[42px]">
                        {dayReservations.map((r) => {
                          const startsHere = isStart(dateKey, r.entrada);
                          const previousDate = addDays(dateKey, -1);
                          const continuesFromPrevious = isInside(previousDate, r.entrada, r.salida);

                          return (
                            <div
                              key={`${r.id}-${dateKey}`}
                              className={`${getColor(r.tipo)} h-7 text-white text-xs flex items-center px-2 ${
                                startsHere ? "rounded-l-full" : ""
                              } ${
                                !isInside(addDays(dateKey, 1), r.entrada, r.salida)
                                  ? "rounded-r-full"
                                  : ""
                              } ${continuesFromPrevious ? "-ml-3" : ""}`}
                            >
                              {startsHere ? r.tipo.replace("Reserva ", "") : ""}
                            </div>
                          );
                        })}
                      </div>

                      {checkOutsToday.length > 0 && (
                        <div className="mt-2 rounded-lg bg-slate-100 px-2 py-1 text-[11px] text-slate-600">
                          Salida 10:00
                        </div>
                      )}

                      <div className="mt-3">
                        <label className="block text-[11px] mb-1 text-slate-500">
                          Precio noche
                        </label>
                        <input
                          type="number"
                          value={price}
                          onChange={(e) =>
                            setPrices((prev) => ({
                              ...prev,
                              [dateKey]: Number(e.target.value),
                            }))
                          }
                          onBlur={(e) =>
                            savePrice(dateKey, Number(e.target.value))
                          }
                          className="w-full min-w-0 rounded-lg border border-slate-300 px-1.5 py-1 text-slate-900 text-xs"
                        />
                        {savingDate === dateKey && (
                          <p className="text-[11px] mt-1 text-slate-500">Guardando...</p>
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
  );
}
