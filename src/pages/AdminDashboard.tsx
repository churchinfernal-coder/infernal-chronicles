import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, Database, Users, MessageSquare, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function AdminDashboard() {
  const navigate = useNavigate();

  const adminModules = [
    {
      title: "Backend Administration",
      description: "Access the complete SuperAdmin control panel",
      icon: Shield,
      path: "/system/backend/admin",
      color: "text-red-500",
      bgColor: "bg-red-950/20",
      borderColor: "border-red-900/30"
    },
    {
      title: "Database Management",
      description: "Manage database tables and records",
      icon: Database,
      path: "/system/backend/admin?tab=database",
      color: "text-blue-500",
      bgColor: "bg-blue-950/20",
      borderColor: "border-blue-900/30"
    },
    {
      title: "User Management",
      description: "Manage users, roles, and permissions",
      icon: Users,
      path: "/system/backend/admin?tab=users-list",
      color: "text-green-500",
      bgColor: "bg-green-950/20",
      borderColor: "border-green-900/30"
    },
    {
      title: "Content Moderation",
      description: "Review and moderate user content",
      icon: MessageSquare,
      path: "/system/backend/admin?tab=moderation",
      color: "text-purple-500",
      bgColor: "bg-purple-950/20",
      borderColor: "border-purple-900/30"
    },
    {
      title: "System Configuration",
      description: "Configure site settings and preferences",
      icon: Settings,
      path: "/system/backend/admin?tab=site-config",
      color: "text-yellow-500",
      bgColor: "bg-yellow-950/20",
      borderColor: "border-yellow-900/30"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-red-950/10 to-black p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-red-500 mb-2">Admin Dashboard</h1>
          <p className="text-red-300/70">Quick access to administrative functions</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {adminModules.map((module) => (
            <Card 
              key={module.path}
              className={`${module.bgColor} ${module.borderColor} border hover:border-red-600/50 transition-all cursor-pointer`}
              onClick={() => navigate(module.path)}
            >
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <module.icon className={`h-8 w-8 ${module.color}`} />
                  <CardTitle className={module.color}>{module.title}</CardTitle>
                </div>
                <CardDescription className="text-red-300/60">
                  {module.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  className="w-full bg-red-600 hover:bg-red-700 text-white"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(module.path);
                  }}
                >
                  Access Module
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
