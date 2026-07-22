import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { requireAdmin, corsHeaders, jsonResponse } from "../_shared/adminAuth.ts";

const PRIVILEGED_ROLES = new Set(["admin", "superadmin"]);

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: corsHeaders });
  }

  const gate = await requireAdmin(req);
  if (gate instanceof Response) return gate;
  const { admin, user, isSuperadmin } = gate;

  // Route on the trailing path segment: /admin-users/create | /ban | /{id}
  const segment = new URL(req.url).pathname.split("/").filter(Boolean).pop() ?? "";

  try {
    // ---- Create user -----------------------------------------------------
    if (req.method === "POST" && segment === "create") {
      const { email, password, role = "user" } = await req.json();
      if (!email || !password) {
        return jsonResponse({ error: "email and password are required" }, 400);
      }
      // Only superadmins may mint privileged accounts.
      if (PRIVILEGED_ROLES.has(role) && !isSuperadmin) {
        return jsonResponse({ error: "Only a superadmin can grant admin roles" }, 403);
      }

      const { data: created, error: createError } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });
      if (createError || !created?.user) {
        return jsonResponse({ error: createError?.message ?? "Could not create user" }, 400);
      }

      if (role && role !== "user") {
        const { error: roleError } = await admin
          .from("user_roles")
          .insert({ user_id: created.user.id, role });
        if (roleError) {
          return jsonResponse({ error: `User created but role failed: ${roleError.message}` }, 207);
        }
      }
      return jsonResponse({ success: true, user_id: created.user.id }, 200);
    }

    // ---- Ban / unban -----------------------------------------------------
    if (req.method === "POST" && segment === "ban") {
      const { user_id, action } = await req.json();
      if (!user_id || !["ban", "unban"].includes(action)) {
        return jsonResponse({ error: "user_id and a valid action are required" }, 400);
      }
      if (user_id === user.id) {
        return jsonResponse({ error: "You cannot ban yourself" }, 400);
      }
      // Protect superadmins from non-superadmins.
      const { data: targetRoles } = await admin
        .from("user_roles").select("role").eq("user_id", user_id);
      const targetIsSuper = (targetRoles ?? []).some((r: { role: string }) => r.role === "superadmin");
      if (targetIsSuper && !isSuperadmin) {
        return jsonResponse({ error: "Cannot ban a superadmin" }, 403);
      }

      const { error } = await admin.auth.admin.updateUserById(user_id, {
        ban_duration: action === "ban" ? "876000h" : "none",
      });
      if (error) return jsonResponse({ error: error.message }, 400);
      return jsonResponse({ success: true }, 200);
    }

    // ---- Delete user -----------------------------------------------------
    if (req.method === "DELETE") {
      const user_id = segment;
      if (!user_id) return jsonResponse({ error: "user id required" }, 400);
      if (user_id === user.id) {
        return jsonResponse({ error: "You cannot delete yourself" }, 400);
      }
      const { data: targetRoles } = await admin
        .from("user_roles").select("role").eq("user_id", user_id);
      const targetIsSuper = (targetRoles ?? []).some((r: { role: string }) => r.role === "superadmin");
      if (targetIsSuper && !isSuperadmin) {
        return jsonResponse({ error: "Cannot delete a superadmin" }, 403);
      }

      const { error } = await admin.auth.admin.deleteUser(user_id);
      if (error) return jsonResponse({ error: error.message }, 400);
      return jsonResponse({ success: true }, 200);
    }

    return jsonResponse({ error: "Unsupported operation" }, 404);
  } catch (err: any) {
    return jsonResponse({ error: err.message ?? "admin-users failed" }, 500);
  }
});
