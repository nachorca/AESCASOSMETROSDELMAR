"use client";

import { useEffect, useState } from "react";

type RateRule = {
  id: string;
  rate_type: "day" | "week" | "month";
  start_date: string;
  end_date: string;
  min_nights: number;
  discount_percent: number;
  active: boolean;
};

const TIPO_LABEL: Record<string, string> = {
  day: "Día",
  week: "Semana",
  month: "Mes",
};

export default function AdminRateRules({ password }: { password: string }) {
  const [rules, setRules] = useState<RateRule[]>([]);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(true);

  // Id de la regla que se está editando (null = ninguna)
  const [editandoId, setEditandoId] = useState<string | null>(null);

  // Formulario de nueva regla
  const [rateType, setRateType] = useState<"day" | "week" | "month">("week");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [minNights, setMinNights] = useState(7);
  const [discount, setDiscount] = useState(0);

  async function cargarReglas() {
    setError("");
    const res = await fetch("/api/rate-rules");
    const data = await res.json();
    if (data.ok) {
      setRules(data.rules || []);
    } else {
      setError(data.error || "Error cargando reglas");
    }
    setCargando(false);
  }

  useEffect(() => {
    cargarReglas();
  }, []);

  async function guardarRegla(regla: Partial<RateRule>) {
    setError("");
    const res = await fetch("/api/rate-rules", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-password": password,
      },
      body: JSON.stringify(regla),
    });
    const data = await res.json();
    if (!data.ok) {
      setError(data.error || "Error guardando la regla");
      return false;
    }
    await cargarReglas();
    return true;
  }

  async function crearRegla() {
    if (!startDate || !endDate) {
      setError("Indica las fechas de inicio y fin de la regla");
      return;
    }
    if (startDate > endDate) {
      setError("La fecha de inicio no puede ser posterior a la de fin");
      return;
    }
    const ok = await guardarRegla({
      rate_type: rateType,
      start_date: startDate,
      end_date: endDate,
      min_nights: minNights,
      discount_percent: discount,
      active: true,
    });
    if (ok) {
      setStartDate("");
      setEndDate("");
      setMinNights(7);
      setDiscount(0);
    }
  }

  async function alternarActiva(regla: RateRule) {
    await guardarRegla({ ...regla, active: !regla.active });
  }

  // Guarda los cambios de la fila que se está editando
  async function guardarEdicion(regla: RateRule) {
    if (regla.start_date > regla.end_date) {
      setError("La fecha de inicio no puede ser posterior a la de fin");
      return;
    }
    const ok = await guardarRegla(regla);
    if (ok) setEditandoId(null);
  }

  // Modifica un campo de una regla en el estado local (mientras se edita)
  function editarCampo(id: string, campo: keyof RateRule, valor: any) {
    setRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [campo]: valor } : r))
    );
  }

  async function borrarRegla(id: string) {
    if (!confirm("¿Seguro que quieres borrar esta regla de tarifa?")) return;
    setError("");
    const res = await fetch("/api/rate-rules", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "x-admin-password": password,
      },
      body: JSON.stringify({ id }),
    });
    const data = await res.json();
    if (!data.ok) {
      setError(data.error || "Error borrando la regla");
      return;
    }
    await cargarReglas();
  }

  return (
    <div className="rounded-2xl bg-white p-5 border border-slate-200 mb-8">
      <h2 className="text-xl font-semibold mb-1">Reglas de tarifa</h2>
      <p className="text-sm text-slate-600 mb-4">
        Define estancias mínimas y descuentos por temporada. En las fechas con
        regla, manda esta tarifa; fuera de ellas se aplican los descuentos por
        estancia.
      </p>

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-100 px-4 py-3 text-red-700 text-sm font-medium">
          {error}
        </div>
      )}

      {/* Formulario crear regla */}
      <div className="grid md:grid-cols-6 gap-3 items-end mb-6">
        <div>
          <label className="block text-xs text-slate-600 mb-1">Tipo</label>
          <select
            value={rateType}
            onChange={(e) =>
              setRateType(e.target.value as "day" | "week" | "month")
            }
            className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm"
          >
            <option value="day">Día</option>
            <option value="week">Semana</option>
            <option value="month">Mes</option>
          </select>
        </div>

        <div>
          <label className="block text-xs text-slate-600 mb-1">Desde</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm"
          />
        </div>

        <div>
          <label className="block text-xs text-slate-600 mb-1">Hasta</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm"
          />
        </div>

        <div>
          <label className="block text-xs text-slate-600 mb-1">
            Noches mín.
          </label>
          <input
            type="number"
            min={1}
            value={minNights}
            onChange={(e) => setMinNights(Number(e.target.value))}
            className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm"
          />
        </div>

        <div>
          <label className="block text-xs text-slate-600 mb-1">
            Descuento %
          </label>
          <input
            type="number"
            min={0}
            max={100}
            value={discount}
            onChange={(e) => setDiscount(Number(e.target.value))}
            className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm"
          />
        </div>

        <button
          onClick={crearRegla}
          className="rounded-xl bg-slate-900 text-white px-4 py-2.5 text-sm"
        >
          Crear regla
        </button>
      </div>

      {/* Lista de reglas */}
      {cargando ? (
        <p className="text-sm text-slate-500">Cargando reglas…</p>
      ) : rules.length === 0 ? (
        <p className="text-sm text-slate-500">
          No hay reglas de tarifa todavía. Crea la primera arriba.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-100 text-left">
              <tr>
                <th className="p-3">Tipo</th>
                <th className="p-3">Desde</th>
                <th className="p-3">Hasta</th>
                <th className="p-3">Noches mín.</th>
                <th className="p-3">Descuento</th>
                <th className="p-3">Estado</th>
                <th className="p-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {rules.map((r) => {
                const enEdicion = editandoId === r.id;
                return (
                  <tr key={r.id} className="border-t border-slate-200">
                    {/* Tipo */}
                    <td className="p-3">
                      {enEdicion ? (
                        <select
                          value={r.rate_type}
                          onChange={(e) =>
                            editarCampo(r.id, "rate_type", e.target.value)
                          }
                          className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
                        >
                          <option value="day">Día</option>
                          <option value="week">Semana</option>
                          <option value="month">Mes</option>
                        </select>
                      ) : (
                        TIPO_LABEL[r.rate_type]
                      )}
                    </td>

                    {/* Desde */}
                    <td className="p-3">
                      {enEdicion ? (
                        <input
                          type="date"
                          value={r.start_date}
                          onChange={(e) =>
                            editarCampo(r.id, "start_date", e.target.value)
                          }
                          className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
                        />
                      ) : (
                        r.start_date
                      )}
                    </td>

                    {/* Hasta */}
                    <td className="p-3">
                      {enEdicion ? (
                        <input
                          type="date"
                          value={r.end_date}
                          onChange={(e) =>
                            editarCampo(r.id, "end_date", e.target.value)
                          }
                          className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
                        />
                      ) : (
                        r.end_date
                      )}
                    </td>

                    {/* Noches mínimas */}
                    <td className="p-3">
                      {enEdicion ? (
                        <input
                          type="number"
                          min={1}
                          value={r.min_nights}
                          onChange={(e) =>
                            editarCampo(
                              r.id,
                              "min_nights",
                              Number(e.target.value)
                            )
                          }
                          className="w-20 rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
                        />
                      ) : (
                        r.min_nights
                      )}
                    </td>

                    {/* Descuento */}
                    <td className="p-3">
                      {enEdicion ? (
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={r.discount_percent}
                          onChange={(e) =>
                            editarCampo(
                              r.id,
                              "discount_percent",
                              Number(e.target.value)
                            )
                          }
                          className="w-20 rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
                        />
                      ) : (
                        `${r.discount_percent}%`
                      )}
                    </td>

                    {/* Estado */}
                    <td className="p-3">
                      {r.active ? (
                        <span className="rounded-lg bg-emerald-100 text-emerald-700 px-2 py-1 text-xs font-semibold">
                          Activa
                        </span>
                      ) : (
                        <span className="rounded-lg bg-slate-200 text-slate-600 px-2 py-1 text-xs font-semibold">
                          Inactiva
                        </span>
                      )}
                    </td>

                    {/* Acciones */}
                    <td className="p-3">
                      <div className="flex gap-2">
                        {enEdicion ? (
                          <>
                            <button
                              onClick={() => guardarEdicion(r)}
                              className="rounded-lg bg-emerald-600 text-white px-3 py-2 text-xs"
                            >
                              Guardar
                            </button>
                            <button
                              onClick={() => {
                                setEditandoId(null);
                                cargarReglas();
                              }}
                              className="rounded-lg bg-slate-400 text-white px-3 py-2 text-xs"
                            >
                              Cancelar
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => setEditandoId(r.id)}
                              className="rounded-lg bg-blue-600 text-white px-3 py-2 text-xs"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => alternarActiva(r)}
                              className="rounded-lg bg-slate-900 text-white px-3 py-2 text-xs"
                            >
                              {r.active ? "Desactivar" : "Activar"}
                            </button>
                            <button
                              onClick={() => borrarRegla(r.id)}
                              className="rounded-lg bg-red-600 text-white px-3 py-2 text-xs"
                            >
                              Borrar
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
