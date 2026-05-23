"use client";

import AdminCalendar from "@/components/AdminCalendar";
import AdminRateRules from "@/components/AdminRateRules";

import { useState } from "react";

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [reservas, setReservas] = useState<any[]>([]);
  const [blocks, setBlocks] = useState<any[]>([]);
  const [externalReservations, setExternalReservations] = useState<any[]>([]);
  const [error, setError] = useState("");

  const [blockStart, setBlockStart] = useState("");
  const [blockEnd, setBlockEnd] = useState("");
  const [blockReason, setBlockReason] = useState("");
  const [weeklyDiscount, setWeeklyDiscount] = useState(0);
  const [monthlyDiscount, setMonthlyDiscount] = useState(0);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [showCalendar, setShowCalendar] = useState(false);

  async function actualizarEstadoOperativo(row: any) {
    setError("");

    const source = row.external ? "external" : row.manual ? "manual" : "stripe";

    const res = await fetch("/api/admin/update-status", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-password": password,
      },
      body: JSON.stringify({
        id: row.id,
        source,
        checkin_status: row.checkin_status,
        cleaning_status: row.cleaning_status,
      }),
    });

    const data = await res.json();

    if (!data.ok) {
      setError(data.error || "Error actualizando estado operativo");
      return;
    }

    await cargarDatos();
  }

  async function actualizarDatosHuesped(row: any) {
    setError("");

    const source = row.external ? "external" : row.manual ? "manual" : "stripe";

    const res = await fetch("/api/admin/update-guest", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-password": password,
      },
      body: JSON.stringify({
        id: row.id,
        source,
        guest_name: row.guest_name,
        guest_phone: row.guest_phone,
      }),
    });

    const data = await res.json();

    if (!data.ok) {
      setError(data.error || "Error guardando datos del huésped");
      return;
    }

    await cargarDatos();
  }

  async function importarReservasExternas() {
    setError("");

    const res = await fetch("/api/admin/import-external", {
      method: "POST",
      headers: {
        "x-admin-password": password,
      },
    });

    const data = await res.json();

    if (!data.ok) {
      setError(data.error || "Error importando reservas externas");
      return;
    }

    alert(`Importación completada. Reservas procesadas: ${data.imported}`);
    await cargarDatos();
  }

  async function cargarDatos() {
    setError("");

    const reservasRes = await fetch("/api/admin/reservas", {
      headers: { "x-admin-password": password },
    });

    const reservasData = await reservasRes.json();

    if (!reservasData.ok) {
      setError("Contraseña incorrecta");
      setIsAdmin(false);
      return;
    }

    const pricingRulesRes = await fetch("/api/pricing-rules");

    const blocksRes = await fetch("/api/manual-blocks");
    const pricingRulesData = await pricingRulesRes.json();
    const blocksData = await blocksRes.json();

    const externalRes = await fetch("/api/admin/external-reservations", {
      headers: { "x-admin-password": password },
    });
    const externalData = await externalRes.json();

    setReservas(reservasData.reservas || []);
    setBlocks(blocksData.blocks || []);

    if (pricingRulesData.ok) {
      setWeeklyDiscount(pricingRulesData.rules.weekly_discount || 0);
      setMonthlyDiscount(pricingRulesData.rules.monthly_discount || 0);
    }
    setExternalReservations(externalData.ok ? externalData.reservas || [] : []);
    setIsAdmin(true);
  }

  async function crearBloqueoManual() {
    const res = await fetch("/api/manual-blocks", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-password": password,
      },
      body: JSON.stringify({
        start_date: blockStart,
        end_date: blockEnd,
        reason: blockReason,
      }),
    });

    const data = await res.json();

    if (!data.ok) {
      setError(
        data.error?.includes("ocupadas") || data.error?.includes("bloqueadas")
          ? "⚠️ Overbooking detectado: las fechas seleccionadas se solapan con una reserva o bloqueo existente."
          : data.error || "Error creando reserva manual"
      );
      return;
    }

    setBlockStart("");
    setBlockEnd("");
    setBlockReason("");
    await cargarDatos();
  }

  async function actualizarBloqueoManual(row: any) {
    const res = await fetch("/api/manual-blocks", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-admin-password": password,
      },
      body: JSON.stringify({
        id: row.id,
        start_date: row.entrada,
        end_date: row.salida,
        reason: row.motivo,
      }),
    });

    const data = await res.json();

    if (!data.ok) {
      setError(
        data.error?.includes("ocupadas") || data.error?.includes("bloqueadas")
          ? "⚠️ Overbooking detectado: las fechas seleccionadas se solapan con una reserva o bloqueo existente."
          : data.error || "Error modificando reserva manual"
      );
      return;
    }

    await cargarDatos();
  }

  async function borrarBloqueo(id: string) {
    if (!confirm("¿Seguro que quieres borrar este bloqueo manual?")) return;

    const res = await fetch("/api/manual-blocks", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "x-admin-password": password,
      },
      body: JSON.stringify({ id }),
    });

    const data = await res.json();

    if (!data.ok) {
      setError(data.error || "Error borrando bloqueo");
      return;
    }

    await cargarDatos();
  }

  function buildWhatsappUrl(row: any) {
    const message = `Hola, para completar el registro obligatorio de viajeros de tu reserva en A escasos metros del mar, por favor accede al siguiente enlace de Check-in Scan: ${row.checkinscan_url || "ENLACE_CHECKIN_SCAN_PENDIENTE"}`;

    return `https://wa.me/?text=${encodeURIComponent(message)}`;
  }

  const unifiedRows = [
    ...reservas.map((r) => ({
      id: r.id,
      tipo: "Reserva Stripe",
      entrada: r.check_in,
      salida: r.check_out,
      huespedes: r.guests,
      pago: r.payment_status,
      estado: r.status,
      checkin_status: r.checkin_status || "pending",
      cleaning_status: r.cleaning_status || "pending",
      checkinscan_status: r.checkinscan_status || "not_sent",
      original_checkin_status: r.checkin_status || "pending",
      original_cleaning_status: r.cleaning_status || "pending",
      importe: r.amount_total ? `${r.amount_total / 100} €` : "-",
      email: r.customer_email || "-",
      guest_name: r.customer_name || "",
      guest_phone: r.customer_phone || "",
      stripe: r.stripe_session_id || "-",
      motivo: "-",
      manual: false,
      external: false,
    })),
    ...externalReservations.map((e) => ({
      id: e.id,
      tipo:
        e.source === "airbnb"
          ? "Reserva Airbnb"
          : e.source === "booking"
          ? "Reserva Booking"
          : "Reserva externa",
      entrada: e.check_in,
      salida: e.check_out,
      huespedes: e.guests || "-",
      pago: "-",
      estado: e.status || "confirmed",
      checkin_status: e.checkin_status || "pending",
      cleaning_status: e.cleaning_status || "pending",
      checkinscan_status: e.checkinscan_status || "not_sent",
      original_checkin_status: e.checkin_status || "pending",
      original_cleaning_status: e.cleaning_status || "pending",
      importe: e.amount_total ? `${e.amount_total / 100} €` : "-",
      email: e.guest_email || "-",
      guest_name: e.guest_name || "",
      guest_phone: e.guest_phone || "",
      stripe: "-",
      motivo: e.summary || e.notes || "Reserva externa",
      manual: false,
      external: true,
    })),
    ...blocks.map((b) => ({
      id: b.id,
      tipo: "Reserva manual",
      entrada: b.start_date,
      salida: b.end_date,
      huespedes: "-",
      pago: "-",
      estado: "confirmed",
      checkin_status: b.checkin_status || "pending",
      cleaning_status: b.cleaning_status || "pending",
      checkinscan_status: b.checkinscan_status || "not_sent",
      original_checkin_status: b.checkin_status || "pending",
      original_cleaning_status: b.cleaning_status || "pending",
      importe: "-",
      email: "-",
      guest_name: b.customer_name || "",
      guest_phone: b.customer_phone || "",
      stripe: "-",
      motivo: b.reason || "Bloqueo manual",
      manual: true,
      external: false,
    })),
  ].sort((a, b) =>
    sortDirection === "asc"
      ? String(a.entrada).localeCompare(String(b.entrada))
      : String(b.entrada).localeCompare(String(a.entrada))
  );

  if (!isAdmin) {
    return (
      <main className="min-h-screen bg-[#f7f4ee] px-6 py-10">
        <div className="mx-auto max-w-xl rounded-2xl bg-white p-6 border border-slate-200">
          <h1 className="text-3xl font-semibold mb-2">Panel administración</h1>
          <p className="text-slate-600 mb-6">Acceso privado</p>

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-xl border border-slate-300 px-4 py-3 w-full mb-4"
            placeholder="Contraseña admin"
          />

          <button
            onClick={cargarDatos}
            className="rounded-xl bg-slate-900 text-white px-6 py-3 w-full"
          >
            Entrar
          </button>

          {error && <p className="text-red-600 mt-3">{error}</p>}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f4ee] px-6 py-10">
      <div className="mx-auto max-w-7xl">
        <h1 className="text-3xl font-semibold mb-2">Panel administración</h1>
        <p className="text-slate-600 mb-8">
          Reservas confirmadas y reservas manuales
        </p>

        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-100 px-5 py-4 text-red-700 font-medium">
            {error}
          </div>
        )}

        <div className="rounded-2xl bg-white p-5 border border-slate-200 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
            <h2 className="text-xl font-semibold">Importar reservas externas</h2>

            <button
              onClick={importarReservasExternas}
              className="rounded-xl bg-blue-600 text-white px-6 py-3"
            >
              Importar Airbnb / Booking
            </button>
          </div>

          <p className="text-sm text-slate-600">
            Importa las reservas detectadas en los calendarios iCal de Airbnb y Booking para poder gestionarlas desde el panel.
          </p>
        </div>

        <div className="rounded-2xl bg-white p-5 border border-slate-200 mb-8">
          <h2 className="text-xl font-semibold mb-4">Descuentos por estancia</h2>

          <div className="grid md:grid-cols-3 gap-4 items-end">
            <div>
              <label className="block text-sm text-slate-600 mb-1">
                Descuento 7 noches o más (%)
              </label>
              <input
                type="number"
                value={weeklyDiscount}
                onChange={(e) => setWeeklyDiscount(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-300 px-4 py-3"
              />
            </div>

            <div>
              <label className="block text-sm text-slate-600 mb-1">
                Descuento 28 noches o más (%)
              </label>
              <input
                type="number"
                value={monthlyDiscount}
                onChange={(e) => setMonthlyDiscount(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-300 px-4 py-3"
              />
            </div>

            <button
              onClick={async () => {
                const res = await fetch("/api/pricing-rules", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    "x-admin-password": password,
                  },
                  body: JSON.stringify({
                    weekly_discount: weeklyDiscount,
                    monthly_discount: monthlyDiscount,
                  }),
                });

                const data = await res.json();

                if (!data.ok) {
                  setError(data.error || "Error guardando descuentos");
                  return;
                }

                await cargarDatos();
              }}
              className="rounded-xl bg-slate-900 text-white px-6 py-3"
            >
              Guardar descuentos
            </button>
          </div>
        </div>

        <AdminRateRules password={password} />

        <div className="rounded-2xl bg-white p-5 border border-slate-200 mb-8">
          <h2 className="text-xl font-semibold mb-4">Crear reserva manual</h2>

          <div className="grid md:grid-cols-4 gap-3">
            <input
              type="date"
              value={blockStart}
              onChange={(e) => setBlockStart(e.target.value)}
              className="rounded-xl border border-slate-300 px-4 py-3"
            />

            <input
              type="date"
              value={blockEnd}
              onChange={(e) => setBlockEnd(e.target.value)}
              className="rounded-xl border border-slate-300 px-4 py-3"
            />

            <input
              type="text"
              value={blockReason}
              onChange={(e) => setBlockReason(e.target.value)}
              className="rounded-xl border border-slate-300 px-4 py-3"
              placeholder="Motivo / cliente / mantenimiento"
            />

            <button
              onClick={crearBloqueoManual}
              className="rounded-xl bg-slate-900 text-white px-6 py-3"
            >
              Crear reserva manual
            </button>
          </div>
        </div>

        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold">
              Calendario visual
            </h2>

            <button
              onClick={() => setShowCalendar(!showCalendar)}
              className="rounded-xl bg-slate-900 text-white px-5 py-3 text-sm"
            >
              {showCalendar ? "Ocultar calendario" : "Mostrar calendario"}
            </button>
          </div>

          {showCalendar && (
            <AdminCalendar reservations={unifiedRows} adminPassword={password} />
          )}
        </div>

        <div className="overflow-x-auto rounded-2xl bg-white border border-slate-200">
          <div className="flex items-center justify-between p-5">
            <h2 className="text-xl font-semibold">Reservas operativas</h2>

            <button
              onClick={() =>
                setSortDirection(sortDirection === "asc" ? "desc" : "asc")
              }
              className="rounded-xl bg-slate-900 text-white px-5 py-2 text-sm"
            >
              Ordenar por fecha {sortDirection === "asc" ? "↑" : "↓"}
            </button>
          </div>

          <table className="w-full text-sm">
            <thead className="bg-slate-100 text-left">
              <tr>
                <th className="p-3">Tipo</th>
                <th className="p-3">Entrada</th>
                <th className="p-3">Salida</th>
                <th className="p-3">Huéspedes</th>
                <th className="p-3">Pago</th>
                <th className="p-3">Estado</th>
                <th className="p-3">Check-in</th>
                <th className="p-3">Limpieza</th>
                <th className="p-3">Check-in Scan</th>
                <th className="p-3">Importe</th>
                <th className="p-3">Email</th>
                <th className="p-3">Huésped</th>
                <th className="p-3">Teléfono</th>
                <th className="p-3">Motivo</th>
                <th className="p-3">Acciones</th>
              </tr>
            </thead>

            <tbody>
              {unifiedRows.map((r) => (
                <tr
                  key={`${r.tipo}-${r.id}`}
                  className={`border-t border-slate-200 ${
                    r.estado === "conflict" ? "bg-red-50" : ""
                  }`}
                >
                <td className="p-3">{r.tipo}</td>
                  <td className="p-3">
                    {r.manual ? (
                      <input
                        type="date"
                        value={r.entrada}
                        onChange={(e) => {
                          const value = e.target.value;
                          setBlocks((prev) =>
                            prev.map((b) =>
                              b.id === r.id ? { ...b, start_date: value } : b
                            )
                          );
                        }}
                        className="rounded-lg border border-slate-300 px-3 py-2"
                      />
                    ) : (
                      r.entrada
                    )}
                  </td>

                  <td className="p-3">
                    {r.manual ? (
                      <input
                        type="date"
                        value={r.salida}
                        onChange={(e) => {
                          const value = e.target.value;
                          setBlocks((prev) =>
                            prev.map((b) =>
                              b.id === r.id ? { ...b, end_date: value } : b
                            )
                          );
                        }}
                        className="rounded-lg border border-slate-300 px-3 py-2"
                      />
                    ) : (
                      r.salida
                    )}
                  </td>
                  <td className="p-3">{r.huespedes}</td>
                  <td className="p-3">{r.pago}</td>
                  <td className="p-3">
                    {r.estado === "conflict" ? (
                      <span className="rounded-lg bg-red-600 text-white px-2 py-1 text-xs font-semibold">
                        ⚠️ CONFLICTO — revisar
                      </span>
                    ) : (
                      r.estado
                    )}
                  </td>

                  <td className="p-3">
                    <select
                      value={r.checkin_status}
                      onChange={(e) => {
                        const value = e.target.value;

                        if (r.external) {
                          setExternalReservations((prev) =>
                            prev.map((x) =>
                              x.id === r.id ? { ...x, checkin_status: value } : x
                            )
                          );
                        } else if (r.manual) {
                          setBlocks((prev) =>
                            prev.map((x) =>
                              x.id === r.id ? { ...x, checkin_status: value } : x
                            )
                          );
                        } else {
                          setReservas((prev) =>
                            prev.map((x) =>
                              x.id === r.id ? { ...x, checkin_status: value } : x
                            )
                          );
                        }
                      }}
                      className="rounded-lg border border-slate-300 px-2 py-1 text-sm"
                    >
                      <option value="pending">Pendiente</option>
                      <option value="checkin_done">Check-in realizado</option>
                      <option value="checkout_done">Check-out realizado</option>
                    </select>
                  </td>

                  <td className="p-3">
                    <select
                      value={r.cleaning_status}
                      onChange={(e) => {
                        const value = e.target.value;

                        if (r.external) {
                          setExternalReservations((prev) =>
                            prev.map((x) =>
                              x.id === r.id ? { ...x, cleaning_status: value } : x
                            )
                          );
                        } else if (r.manual) {
                          setBlocks((prev) =>
                            prev.map((x) =>
                              x.id === r.id ? { ...x, cleaning_status: value } : x
                            )
                          );
                        } else {
                          setReservas((prev) =>
                            prev.map((x) =>
                              x.id === r.id ? { ...x, cleaning_status: value } : x
                            )
                          );
                        }
                      }}
                      className="rounded-lg border border-slate-300 px-2 py-1 text-sm"
                    >
                      <option value="pending">Pendiente</option>
                      <option value="cleaning">Limpiando</option>
                      <option value="ready">Listo</option>
                    </select>
                  </td>

                  <td className="p-3">
                    <div className="flex flex-col gap-2">
                      {r.checkinscan_status === "not_sent" ? (
                        <>
                          <button
                            className="rounded-xl bg-blue-600 text-white px-3 py-2 text-sm"
                          >
                            Enviar
                          </button>

                          <a
                            href={buildWhatsappUrl(r)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-xl bg-green-600 text-white px-3 py-2 text-sm text-center"
                          >
                            Enviar WhatsApp
                          </a>
                        </>
                      ) : r.checkinscan_status === "sent" ? (
                        <span className="rounded-lg bg-amber-100 text-amber-700 px-3 py-2 text-sm">
                          Enviado
                        </span>
                      ) : (
                        <span className="rounded-lg bg-emerald-100 text-emerald-700 px-3 py-2 text-sm">
                          Completado
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="p-3">
                    <button
                      onClick={() =>
                        actualizarEstadoOperativo(r)
                      }
                      className="rounded-xl bg-slate-900 text-white px-4 py-2 text-sm"
                    >
                      Guardar estado
                    </button>
                  </td>

                  <td className="p-3">{r.importe}</td>
                  <td className="p-3">{r.email}</td>

                  <td className="p-3">
                    <input
                      type="text"
                      value={r.guest_name}
                      onChange={(e) => {
                        const value = e.target.value;

                        if (r.external) {
                          setExternalReservations((prev) =>
                            prev.map((x) =>
                              x.id === r.id ? { ...x, guest_name: value } : x
                            )
                          );
                        } else if (r.manual) {
                          setBlocks((prev) =>
                            prev.map((x) =>
                              x.id === r.id ? { ...x, customer_name: value } : x
                            )
                          );
                        } else {
                          setReservas((prev) =>
                            prev.map((x) =>
                              x.id === r.id ? { ...x, customer_name: value } : x
                            )
                          );
                        }
                      }}
                      className="rounded-lg border border-slate-300 px-3 py-2 min-w-[160px]"
                      placeholder="Nombre"
                    />
                  </td>

                  <td className="p-3">
                    <div className="flex gap-2">
                      <input
                        type="tel"
                        value={r.guest_phone}
                        onChange={(e) => {
                          const value = e.target.value;

                          if (r.external) {
                            setExternalReservations((prev) =>
                              prev.map((x) =>
                                x.id === r.id ? { ...x, guest_phone: value } : x
                              )
                            );
                          } else if (r.manual) {
                            setBlocks((prev) =>
                              prev.map((x) =>
                                x.id === r.id ? { ...x, customer_phone: value } : x
                              )
                            );
                          } else {
                            setReservas((prev) =>
                              prev.map((x) =>
                                x.id === r.id ? { ...x, customer_phone: value } : x
                              )
                            );
                          }
                        }}
                        className="rounded-lg border border-slate-300 px-3 py-2 min-w-[150px]"
                        placeholder="+34..."
                      />

                      <button
                        onClick={() => actualizarDatosHuesped(r)}
                        className="rounded-lg bg-slate-900 text-white px-3 py-2 text-sm"
                      >
                        Guardar
                      </button>
                    </div>
                  </td>

                  <td className="p-3">
                    {r.manual ? (
                      <input
                        type="text"
                        value={r.motivo}
                        onChange={(e) => {
                          const value = e.target.value;
                          setBlocks((prev) =>
                            prev.map((b) =>
                              b.id === r.id ? { ...b, reason: value } : b
                            )
                          );
                        }}
                        className="rounded-lg border border-slate-300 px-3 py-2 w-full"
                      />
                    ) : (
                      r.motivo
                    )}
                  </td>
                  <td className="p-3">
                    {r.manual ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => actualizarBloqueoManual(r)}
                          className="rounded-lg bg-slate-900 text-white px-4 py-2"
                        >
                          Guardar
                        </button>

                        <button
                          onClick={() => borrarBloqueo(r.id)}
                          className="rounded-lg bg-red-600 text-white px-4 py-2"
                        >
                          Borrar
                        </button>
                      </div>
                    ) : r.external ? (
                      <span className="text-slate-400">Externa</span>
                    ) : (
                      <span className="text-slate-400">Stripe</span>
                    )}
                  </td>
                </tr>
              ))}

              {!unifiedRows.length && (
                <tr>
                  <td className="p-6 text-slate-500" colSpan={10}>
                    No hay reservas todavía.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
