import { useNavigate } from "react-router-dom";
import { 
  BookOpen, 
  Compass, 
  Castle, 
  Bell, 
  Settings, 
  LogOut,
  Shield,
  Users,
  Crown
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface CovenNavigationProps {
  currentUserRole?: string;
  isSuperAdmin?: boolean;
  covenId?: string;
  onNavigate?: () => void;
  className?: string;
}

export function CovenNavigation({ 
  currentUserRole, 
  isSuperAdmin, 
  covenId,
  onNavigate,
  className 
}: CovenNavigationProps) {
  const navigate = useNavigate();

  const handleNavigation = (path: string) => {
    navigate(path);
    onNavigate?.();
  };

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Failed to sign out");
      return;
    }
    toast.success("Signed out");
    navigate("/auth");
    onNavigate?.();
  };

  const isAdmin = currentUserRole === "admin" || isSuperAdmin;

  interface NavItem {
    icon: any;
    label: string;
    path: string;
    description: string;
    adminOnly?: boolean;
  }

  const baseNavItems: NavItem[] = [
    {
      icon: BookOpen,
      label: "Devil's Diary",
      path: "/feed",
      description: "Return to your chronicle"
    },
    {
      icon: Compass,
      label: "Explore Covens",
      path: "/covens",
      description: "Discover more chambers"
    },
    {
      icon: Castle,
      label: "My Castle",
      path: "/profile",
      description: "Your infernal sanctum"
    },
    {
      icon: Bell,
      label: "Notifications",
      path: "/dashboard",
      description: "Summoning alerts"
    },
    {
      icon: Settings,
      label: "Settings",
      path: "/settings",
      description: "Chamber preferences"
    }
  ];

  const adminNavItems: NavItem[] = [
    {
      icon: Shield,
      label: "Manage Coven",
      path: `/covens?manage=${covenId}`,
      description: "Administrative control",
      adminOnly: true
    },
    {
      icon: Crown,
      label: "Assign Roles",
      path: `/covens?roles=${covenId}`,
      description: "Hierarchy management",
      adminOnly: true
    }
  ];

  const allNavItems: NavItem[] = [
    ...baseNavItems,
    ...(isAdmin ? adminNavItems : [])
  ];

  return (
    <nav className={cn(
      "bg-gradient-to-b from-background to-card border-r border-border",
      className
    )}>
      <div className="p-4 border-b border-primary/20">
        <h3 className="text-lg font-bold text-primary flex items-center gap-2">
          <Users className="h-5 w-5" />
          Coven Navigation
        </h3>
      </div>

      <div className="flex flex-col p-2 space-y-1">
        {allNavItems.map((item) => (
          <button
            key={item.path}
            onClick={() => handleNavigation(item.path)}
            className={cn(
              "group flex items-start gap-3 p-3 rounded-lg transition-all duration-200",
              "hover:bg-primary/10 hover:border-l-4 hover:border-primary",
              "text-left relative overflow-hidden",
              item.adminOnly && "border-l-2 border-primary/30"
            )}
          >
            <item.icon className="h-5 w-5 mt-0.5 text-primary group-hover:scale-110 transition-transform" />
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-foreground group-hover:text-primary transition-colors flex items-center gap-2">
                {item.label}
                {item.adminOnly && (
                  <Shield className="h-3 w-3 text-primary" />
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 group-hover:text-foreground/80">
                {item.description}
              </p>
            </div>
          </button>
        ))}

        {/* Logout Button */}
        <div className="pt-2 mt-2 border-t border-border">
          <button
            onClick={handleSignOut}
            className={cn(
              "group flex items-start gap-3 p-3 rounded-lg transition-all duration-200 w-full",
              "hover:bg-destructive/10 hover:border-l-4 hover:border-destructive",
              "text-left"
            )}
          >
            <LogOut className="h-5 w-5 mt-0.5 text-destructive group-hover:scale-110 transition-transform" />
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-foreground group-hover:text-destructive transition-colors">
                Logout
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 group-hover:text-foreground/80">
                Exit this realm
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* Infernal Footer */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-primary/20 bg-gradient-to-t from-background to-transparent">
        <div className="text-center">
          <div className="text-xs text-primary font-mono tracking-wider">
            666
          </div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-widest">
            Infernal Navigation
          </div>
        </div>
      </div>
    </nav>
  );
}
