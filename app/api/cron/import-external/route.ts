// app/api/cron/import-external/route.ts
// ============================================================
// Cron automático de sincronización de iCal externos.
// Delega toda la lógica en lib/sincronizarExternal.ts para
// no duplicar código con /api/admin/import-external.
// ============================================================

import { sincronizarExternal } from "@/lib/sincronizarExternal";

function isCronAuthorized(req: Request) {
  const auth = req.headers.get("authorization");
  return auth === `Bearer ${process.env.CRON_SECRET}`;
}

export async function GET(req: Request) {
  if (!isCronAuthorized(req)) {
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
