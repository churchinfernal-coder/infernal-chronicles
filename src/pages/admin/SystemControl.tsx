import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Shield, UserCog, Database, Settings } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DatabaseInspector from "@/components/admin/DatabaseInspector";

export default function SystemControl() {
  const [userRoles, setUserRoles] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedRole, setSelectedRole] = useState("");

  useEffect(() => {
    fetchUserRoles();
  }, []);

   const fetchUserRoles = async () => {
    // Avoid broken implicit join (no FK). Fetch roles then hydrate profiles.
    const { data: roles, error } = await supabase
      .from("user_roles")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching user roles:", error);
      return;
    }

    const userIds = (roles || []).map((r: any) => r.user_id);
    let profilesMap: Record<string, any> = {};
    if (userIds.length) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("user_id, username, avatar_url")
        .in("user_id", userIds);
      profilesMap = Object.fromEntries((profs || []).map((p: any) => [p.user_id, p]));
    }

    const merged = (roles || []).map((r: any) => ({ ...r, profiles: profilesMap[r.user_id] }));
    setUserRoles(merged);
  };

  const logSystemAction = async (actionType: string, metadata: any) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("module_audit_logs" as any).insert({
      module_name: "system_control",
      action_type: actionType,
      admin_user_id: user.id,
      metadata: metadata
    });
  };

  const handleRoleChange = async () => {
    if (!selectedUserId || !selectedRole) {
      toast.error("Please select both user and role");
      return;
    }

    const { error } = await supabase
      .from("user_roles")
      .update({ role: selectedRole as any })
      .eq("user_id", selectedUserId);

    if (error) {
      toast.error("Failed to update role");
      return;
    }

    await logSystemAction("role_change", {
      user_id: selectedUserId,
      new_role: selectedRole
    });

    toast.success("Role updated successfully");
    fetchUserRoles();
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="roles" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="roles">
            <UserCog className="h-4 w-4 mr-2" />
            User Roles
          </TabsTrigger>
          <TabsTrigger value="permissions">
            <Shield className="h-4 w-4 mr-2" />
            Permissions
          </TabsTrigger>
          <TabsTrigger value="database">
            <Database className="h-4 w-4 mr-2" />
            Database
          </TabsTrigger>
        </TabsList>

        <TabsContent value="roles" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Role Management</CardTitle>
              <CardDescription>
                Manage user roles and access hierarchy
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div>
                  <Label>User ID</Label>
                  <Input
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    placeholder="Enter user ID"
                  />
                </div>
                <div>
                  <Label>Role</Label>
                  <select
                    className="w-full p-2 border rounded"
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                  >
                    <option value="">Select role</option>
                    <option value="admin">Admin</option>
                    <option value="moderator">Moderator</option>
                    <option value="user">User</option>
                  </select>
                </div>
                <Button onClick={handleRoleChange}>
                  Update Role
                </Button>
              </div>

              <div className="mt-6 space-y-2">
                <h3 className="font-semibold">Current Roles</h3>
                {userRoles.map((roleEntry) => (
                  <div key={roleEntry.id} className="flex items-center justify-between p-2 border rounded">
                    <span className="font-mono text-sm">
                      {(roleEntry.profiles as any)?.username || "Unknown"}
                    </span>
                    <span className="px-2 py-1 bg-primary/10 rounded text-xs">
                      {roleEntry.role}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="permissions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Permission Matrix</CardTitle>
              <CardDescription>
                View and manage granular permissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Permission matrix interface - inspect RLS policies and access controls
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="database" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Database Inspector</CardTitle>
              <CardDescription>
                Direct database access and inspection tools
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Interactive, secure inspector component */}
              <DatabaseInspector />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
