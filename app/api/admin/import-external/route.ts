// app/api/admin/import-external/route.ts
// ============================================================
// Botón "Importar Airbnb / Booking" del panel admin.
// Delega toda la lógica en lib/sincronizarExternal.ts para
// no duplicar código con /api/cron/import-external.
// ============================================================

import { sincronizarExternal } from "@/lib/sincronizarExternal";

function isAdmin(req: Request) {
  return req.headers.get("x-admin-password") === process.env.ADMIN_PASSWORD;
}

export async function POST(req: Request) {
  if (!isAdmin(req)) {
    return Response.json({ ok: false, error: "No autorizado" }, { status: 401 });
  }

  const result = await sincronizarExternal();

  if (!result.ok) {
    return Response.json({ ok: false, error: result.error }, { status: 500 });
  }

  return Response.json({
    ok: true,
    imported: result.imported,
    cancelacionesBorradas: result.cancelacionesBorradas,
  });
}
