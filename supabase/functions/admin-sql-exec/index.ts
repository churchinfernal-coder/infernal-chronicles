import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { requireAdmin, corsHeaders, jsonResponse } from "../_shared/adminAuth.ts";

const ALLOWED_ACTIONS = new Set([
  "view_all_tables",
  "view_active_sessions",
  "view_recent_queries",
  "database_statistics",
]);

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: corsHeaders });
  }

  // Authenticate + authorize (admin/superadmin only).
  const gate = await requireAdmin(req);
  if (gate instanceof Response) return gate;
  const { admin } = gate;

  try {
    const { sql, quickAction } = await req.json().catch(() => ({}));

    // Free-form SQL is disabled by design to prevent data exfiltration.
    if (sql && !quickAction) {
      return jsonResponse(
        { error: "Free-form SQL is disabled. Use a predefined inspector action." },
        400
      );
    }

    if (!quickAction || !ALLOWED_ACTIONS.has(quickAction)) {
      return jsonResponse({ error: "Unknown or missing inspector action" }, 400);
    }

    const start = Date.now();
    const { data, error } = await admin.rpc("admin_db_inspect", { _action: quickAction });
    const durationMs = Date.now() - start;

    if (error) {
      return jsonResponse({ error: error.message, executedSql: quickAction }, 400);
    }

    const rows = Array.isArray(data) ? data : data ? [data] : [];
    return jsonResponse({ rows, rowCount: rows.length, durationMs, executedSql: quickAction }, 200);
  } catch (err: any) {
    return jsonResponse({ error: err.message ?? "Inspector failed" }, 500);
  }
});
