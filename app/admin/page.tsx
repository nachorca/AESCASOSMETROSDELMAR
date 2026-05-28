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
  const [filtroReservas, setFiltroReservas] = useState("todas");
  const [showCalendar, setShowCalendar] = useState(false);
  const [rangeStart, setRangeStart] = useState("");
  const [rangeEnd, setRangeEnd] = useState("");
  const [rangePrice, setRangePrice] = useState("");
  const [rangeSaving, setRangeSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Devuelve una fecha ISO (yyyy-mm-dd) en formato dd/mm/yyyy para lectura.
  function formatearFecha(iso: string) {
    if (!iso) return "—";
    const partes = String(iso).slice(0, 10).split("-");
    if (partes.length !== 3) return iso;
    const [y, m, d] = partes;
    return `${d}/${m}/${y}`;
  }

  // Clasifica una reserva por fechas (no por la columna operativa):
  //  - "pendiente":  la entrada es posterior a hoy
  //  - "en_curso":   hoy esta entre la entrada (incluida) y la salida (excluida)
  //  - "completada": la salida es hoy o anterior
  // El dia de check-out NO cuenta como en casa.
  function estadoPorFechas(entrada: string, salida: string) {
    const hoy = new Date();
    const hoyKey = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(
      2,
      "0"
    )}-${String(hoy.getDate()).padStart(2, "0")}`;
    const ent = String(entrada).slice(0, 10);
    const sal = String(salida).slice(0, 10);
    if (!ent || !sal) return "pendiente";
    if (hoyKey < ent) return "pendiente";
    if (hoyKey >= sal) return "completada";
    return "en_curso";
  }

  // Guarda una fila segun su tipo, llamando a las funciones que ya existen.
  async function guardarFila(r: any) {
    if (r.external) {
      await actualizarDatosHuesped(r);
      await actualizarEstadoOperativo(r);
    } else if (r.manual) {
      await actualizarBloqueoManual(r);
      await actualizarDatosHuesped(r);
      await actualizarEstadoOperativo(r);
    } else {
      await actualizarDatosHuesped(r);
      await actualizarEstadoOperativo(r);
    }
    setEditingId(null);
  }

  async function aplicarPrecioRango() {
    setError("");
    if (!rangeStart || !rangeEnd || !rangePrice) {
      setError("Completa las 3 casillas: Desde, Hasta y Precio");
      return;
    }
    const precio = Number(rangePrice);
    if (!Number.isFinite(precio) || precio < 0) {
      setError("El precio no es valido");
      return;
    }
    setRangeSaving(true);
    const res = await fetch("/api/prices/bulk", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-password": password,
      },
      body: JSON.stringify({
        start: rangeStart,
        end: rangeEnd,
        price: precio,
      }),
    });
    const data = await res.json();
    setRangeSaving(false);
    if (!data.ok) {
      setError(data.error || "No se pudo aplicar el precio al rango");
      return;
    }
    alert("Precio " + precio + " EUR aplicado a " + data.updated + " dias");
    setRangeStart("");
    setRangeEnd("");
    setRangePrice("");
  }

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

    // El email vive en guest_email para externas y en customer_email para
    // stripe/manual. Elegimos el que corresponda para no mandar uno vacio.
    const emailAEnviar = row.external
      ? row.guest_email
      : row.customer_email ?? row.guest_email;

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
        guest_email: emailAEnviar,
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

  async function borrarReservaStripe(id: string) {
    const res = await fetch("/api/admin/reservas", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "x-admin-password": password,
      },
      body: JSON.stringify({ id }),
    });
    const data = await res.json();
    if (!data.ok) {
      setError(data.error || "Error borrando la reserva");
      return;
    }
    await cargarDatos();
  }

  function buildWhatsappUrl(row: any) {
    // Limpiamos el telefono: dejamos solo digitos (quita +, espacios, guiones,
    // parentesis). Se asume que el numero incluye el prefijo de pais.
    const telefono = String(row.guest_phone || "").replace(/\D/g, "");

    // Abre el chat con el huesped sin texto precargado. Si no hay numero,
    // abre WhatsApp sin destinatario.
    return telefono ? `https://wa.me/${telefono}` : `https://wa.me/`;
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
      customer_email: r.customer_email || "",
      guest_email: "",
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
      guest_email: e.guest_email || "",
      customer_email: "",
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
      customer_email: b.customer_email || "",
      guest_email: "",
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

  // Filtro de la tabla de reservas operativas.
  const filteredRows = unifiedRows.filter((r) => {
    switch (filtroReservas) {
      case "completadas":
        return estadoPorFechas(r.entrada, r.salida) === "completada";
      case "pendientes":
        return estadoPorFechas(r.entrada, r.salida) === "pendiente";
      case "en_curso":
        return estadoPorFechas(r.entrada, r.salida) === "en_curso";
      case "booking":
        return r.tipo === "Reserva Booking";
      case "airbnb":
        return r.tipo === "Reserva Airbnb";
      case "manual":
        return r.tipo === "Reserva manual";
      case "stripe":
        return r.tipo === "Reserva Stripe";
      default:
        return true; // "todas"
    }
  });

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

        <div className="mb-8 rounded-2xl bg-white border border-slate-200 p-6">
          <h2 className="text-2xl font-semibold mb-2">
            Precio por rango de fechas
          </h2>
          <p className="text-sm text-slate-500 mb-4">
            Aplica un mismo precio a todas las noches del rango.
            Sobrescribe los precios existentes en ese rango sin previo aviso.
          </p>
          <div className="grid md:grid-cols-4 gap-3 items-end">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Desde</label>
              <input
                type="date"
                value={rangeStart}
                onChange={(e) => setRangeStart(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Hasta</label>
              <input
                type="date"
                value={rangeEnd}
                onChange={(e) => setRangeEnd(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Precio EUR</label>
              <input
                type="number"
                inputMode="numeric"
                value={rangePrice}
                onChange={(e) => setRangePrice(e.target.value)}
                placeholder="p. ej. 150"
                className="w-full rounded-xl border border-slate-300 px-3 py-2"
              />
            </div>
            <button
              onClick={aplicarPrecioRango}
              disabled={rangeSaving}
              className={"rounded-xl px-5 py-3 text-sm text-white " + (rangeSaving ? "bg-slate-400 cursor-not-allowed" : "bg-slate-900")}
            >
              {rangeSaving ? "Aplicando..." : "Aplicar precio al rango"}
            </button>
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl bg-white border border-slate-200">
          <div className="flex items-center justify-between p-5">
            <h2 className="text-xl font-semibold">Reservas operativas</h2>

            <div className="flex items-center gap-2">
              <select
                value={filtroReservas}
                onChange={(e) => setFiltroReservas(e.target.value)}
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm"
              >
                <option value="todas">Todas las reservas</option>
                <option value="en_curso">Reservas en curso (en casa)</option>
                <option value="completadas">Reservas completadas</option>
                <option value="pendientes">Reservas pendientes</option>
                <option value="booking">Reservas de Booking</option>
                <option value="airbnb">Reservas de Airbnb</option>
                <option value="manual">Reservas manuales</option>
                <option value="stripe">Reservas Stripe</option>
              </select>

              <button
                onClick={() =>
                  setSortDirection(sortDirection === "asc" ? "desc" : "asc")
                }
                className="rounded-xl bg-slate-900 text-white px-5 py-2 text-sm"
              >
                Ordenar por fecha {sortDirection === "asc" ? "↑" : "↓"}
              </button>
            </div>
          </div>

          <table className="w-full text-sm table-fixed">
            <thead className="bg-slate-100 text-left">
              <tr>
                <th className="p-3 w-[14%]">Reserva</th>
                <th className="p-3 w-[12%]">Fechas</th>
                <th className="p-3 w-[14%]">Estado</th>
                <th className="p-3 w-[16%]">Operativa</th>
                <th className="p-3 w-[14%]">Check-in Scan</th>
                <th className="p-3 w-[18%]">Contacto</th>
                <th className="p-3 w-[12%]">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((r) => {
                const editando = editingId === r.id;
                const enCurso =
                  estadoPorFechas(r.entrada, r.salida) === "en_curso";
                return (
                <tr
                  key={`${r.tipo}-${r.id}`}
                  className={`border-t border-slate-200 align-top ${
                    enCurso ? "border-l-4 border-l-emerald-500" : ""
                  } ${
                    r.estado === "conflict"
                      ? "bg-red-50"
                      : r.tipo === "Reserva Booking"
                      ? "bg-blue-100"
                      : r.tipo === "Reserva Airbnb"
                      ? "bg-pink-100"
                      : r.tipo === "Reserva Stripe"
                      ? "bg-green-100"
                      : r.tipo === "Reserva manual"
                      ? "bg-orange-100"
                      : ""
                  }`}
                >
                  {/* RESERVA: tipo + huesped */}
                  <td className="p-3">
                    <div className="font-medium">{r.tipo}</div>
                    {editando ? (
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
                        className="mt-1 rounded-lg border border-slate-300 px-2 py-1 text-sm w-full"
                        placeholder="Nombre"
                      />
                    ) : (
                      <div className="text-slate-600 mt-1">
                        {r.guest_name || "—"}
                      </div>
                    )}
                  </td>

                  {/* FECHAS: entrada + salida */}
                  <td className="p-3">
                    {editando && r.manual ? (
                      <>
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
                          className="rounded-lg border border-slate-300 px-2 py-1 text-sm w-full"
                        />
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
                          className="mt-1 rounded-lg border border-slate-300 px-2 py-1 text-sm w-full"
                        />
                      </>
                    ) : (
                      <>
                        <div>{formatearFecha(r.entrada)}</div>
                        <div className="text-slate-500">
                          {formatearFecha(r.salida)}
                        </div>
                      </>
                    )}
                  </td>

                  {/* ESTADO: estado + pago + importe */}
                  <td className="p-3">
                    {enCurso && (
                      <span className="inline-block rounded-lg bg-emerald-500 text-white px-2 py-1 text-xs font-semibold mb-1">
                        🟢 En casa ahora
                      </span>
                    )}
                    {r.estado === "conflict" ? (
                      <span className="rounded-lg bg-red-600 text-white px-2 py-1 text-xs font-semibold">
                        CONFLICTO
                      </span>
                    ) : (
                      <div className="font-medium">{r.estado}</div>
                    )}
                    <div className="text-slate-500 text-xs mt-1">
                      {r.pago || "—"}{r.importe && r.importe !== "-" ? ` · ${r.importe}` : ""}
                    </div>
                  </td>

                  {/* OPERATIVA: check-in */}
                  <td className="p-3">
                    {editando ? (
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
                        className="rounded-lg border border-slate-300 px-2 py-1 text-sm w-full"
                      >
                        <option value="pending">Check-in: Pendiente</option>
                        <option value="checkin_done">Check-in realizado</option>
                        <option value="checkout_done">Check-out realizado</option>
                      </select>
                    ) : (
                      <div className="text-slate-600">
                        {r.checkin_status === "checkin_done"
                          ? "Check-in realizado"
                          : r.checkin_status === "checkout_done"
                          ? "Check-out realizado"
                          : "Check-in: Pendiente"}
                      </div>
                    )}
                  </td>

                  {/* CHECK-IN SCAN (siempre visible) */}
                  <td className="p-3">
                    <div className="flex flex-col gap-2">
                      {r.checkinscan_status === "not_sent" ? (
                        <>
                          <button className="rounded-lg bg-red-600 text-white px-3 py-2 text-sm">
                            Enviar
                          </button>
                          <a
                            href={buildWhatsappUrl(r)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-lg bg-red-600 text-white px-3 py-2 text-sm text-center"
                          >
                            Enviar WhatsApp
                          </a>
                        </>
                      ) : r.checkinscan_status === "sent" ? (
                        <span className="rounded-lg bg-amber-100 text-amber-700 px-3 py-2 text-sm text-center">
                          Enviado
                        </span>
                      ) : (
                        <span className="rounded-lg bg-emerald-100 text-emerald-700 px-3 py-2 text-sm text-center">
                          Completado
                        </span>
                      )}
                    </div>
                  </td>

                  {/* CONTACTO: telefono + email + motivo */}
                  <td className="p-3">
                    {editando ? (
                      <>
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
                          className="rounded-lg border border-slate-300 px-2 py-1 text-sm w-full"
                          placeholder="+34..."
                        />
                        <input
                          type="email"
                          value={
                            r.external
                              ? r.guest_email ?? (r.email === "-" ? "" : r.email)
                              : r.customer_email ?? (r.email === "-" ? "" : r.email)
                          }
                          onChange={(e) => {
                            const value = e.target.value;
                            if (r.external) {
                              setExternalReservations((prev) =>
                                prev.map((x) =>
                                  x.id === r.id ? { ...x, guest_email: value } : x
                                )
                              );
                            } else if (r.manual) {
                              setBlocks((prev) =>
                                prev.map((x) =>
                                  x.id === r.id ? { ...x, customer_email: value } : x
                                )
                              );
                            } else {
                              setReservas((prev) =>
                                prev.map((x) =>
                                  x.id === r.id ? { ...x, customer_email: value } : x
                                )
                              );
                            }
                          }}
                          className="mt-1 rounded-lg border border-slate-300 px-2 py-1 text-sm w-full"
                          placeholder="Email"
                        />
                        {r.manual && (
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
                            className="mt-1 rounded-lg border border-slate-300 px-2 py-1 text-sm w-full"
                            placeholder="Motivo"
                          />
                        )}
                      </>
                    ) : (
                      <>
                        <div className="text-slate-600">
                          {r.guest_phone || "—"}
                        </div>
                        <div className="text-slate-500 text-xs mt-1">
                          {(r.external ? r.guest_email : r.customer_email) ||
                            (r.email === "-" ? "" : r.email) ||
                            "—"}
                        </div>
                        {r.manual && (
                          <div className="text-slate-400 text-xs mt-1">
                            {r.motivo}
                          </div>
                        )}
                      </>
                    )}
                  </td>

                  {/* ACCIONES: Editar/Borrar  o  Guardar/Cancelar */}
                  <td className="p-3">
                    {editando ? (
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => guardarFila(r)}
                          className="rounded-lg bg-emerald-600 text-white px-3 py-2 text-sm"
                        >
                          Guardar
                        </button>
                        <button
                          onClick={() => {
                            setEditingId(null);
                            cargarDatos();
                          }}
                          className="rounded-lg bg-slate-200 text-slate-700 px-3 py-2 text-sm"
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => setEditingId(r.id)}
                          className="rounded-lg bg-slate-900 text-white px-3 py-2 text-sm"
                        >
                          Editar
                        </button>
                        {!r.external && (
                          <button
                            onClick={() => {
                              if (r.manual) {
                                borrarBloqueo(r.id);
                              } else if (
                                confirm(
                                  "¿Seguro que quieres borrar esta reserva? Esta acción no se puede deshacer y liberará las fechas en el calendario."
                                )
                              ) {
                                borrarReservaStripe(r.id);
                              }
                            }}
                            className="rounded-lg bg-red-600 text-white px-3 py-2 text-sm"
                          >
                            Borrar
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
                );
              })}

              {!filteredRows.length && (
                <tr>
                  <td className="p-6 text-slate-500" colSpan={7}>
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
