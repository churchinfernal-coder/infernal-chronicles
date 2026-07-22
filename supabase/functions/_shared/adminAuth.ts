import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

export function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

export interface AdminContext {
  user: { id: string; email?: string };
  admin: SupabaseClient;
  isSuperadmin: boolean;
}

/**
 * Verifies the caller is authenticated AND holds an admin/superadmin role.
 * Returns a ready-to-use service-role client for privileged work, or a Response
 * (401/403/500) that the caller should return immediately.
 *
 * Usage:
 *   const gate = await requireAdmin(req);
 *   if (gate instanceof Response) return gate;
 *   const { user, admin, isSuperadmin } = gate;
 */
export async function requireAdmin(
  req: Request,
  opts: { requireSuperadmin?: boolean } = {}
): Promise<AdminContext | Response> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

  if (!supabaseUrl || !serviceKey) {
    return jsonResponse({ error: "Server not configured" }, 500);
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return jsonResponse({ error: "Missing authorization header" }, 401);
  }
  const token = authHeader.replace("Bearer ", "");

  // Service-role client: used to validate the token and to run privileged work.
  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: { user }, error: userError } = await admin.auth.getUser(token);
  if (userError || !user) {
    return jsonResponse({ error: "Invalid or expired session" }, 401);
  }

  const { data: roles, error: rolesError } = await admin
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id);

  if (rolesError) {
    return jsonResponse({ error: "Could not verify permissions" }, 500);
  }

  const roleSet = new Set((roles ?? []).map((r: { role: string }) => r.role));
  const isSuperadmin = roleSet.has("superadmin");
  const isAdmin = isSuperadmin || roleSet.has("admin");

  if (!isAdmin) {
    return jsonResponse({ error: "Forbidden: admin role required" }, 403);
  }
  if (opts.requireSuperadmin && !isSuperadmin) {
    return jsonResponse({ error: "Forbidden: superadmin role required" }, 403);
  }

  return { user: { id: user.id, email: user.email ?? undefined }, admin, isSuperadmin };
}
