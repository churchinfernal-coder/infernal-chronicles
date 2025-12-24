import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useNavigate } from "react-router-dom";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { GlobalSearch } from "@/components/GlobalSearch";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { useLanguage } from "@/contexts/LanguageContext";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import NotificationPanel from "@/components/NotificationPanel";

export function AppHeader() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch unread count from Supabase
  useEffect(() => {
    const fetchUnreadCount = async () => {
      const { data: { user } } = await supabase. auth.getUser();
      if (!user) return;

      const { count } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        . eq("read", false);

      setUnreadCount(count || 0);
    };

    fetchUnreadCount();

    // Subscribe to realtime changes
    const channel = supabase
      .channel("notification-count")
      . on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
        },
        () => fetchUnreadCount()
      )
      .subscribe();

    return () => {
      supabase. removeChannel(channel);
    };
  }, []);

  return (
    <header className="sticky top-0 z-50 h-14 md:h-16 border-b border-border bg-card/95 backdrop-blur-sm">
      <div className="h-full flex items-center justify-between px-2 sm:px-3 md:px-4 gap-2 md:gap-4">
        {/* Left Section: Sidebar Trigger + Logo (optional) */}
        <div className="flex items-center gap-2 md:gap-3 shrink-0">
          <SidebarTrigger />
          {/* Optional: Add logo here for desktop */}
          <span className="hidden lg:block text-lg font-bold text-primary">
            Infernal
          </span>
        </div>

        {/* Center Section: Global Search */}
        <div className="flex-1 max-w-xl mx-auto">
          <GlobalSearch />
        </div>

        {/* Right Section: Actions */}
        <div className="flex items-center gap-1 md:gap-2 shrink-0">
          <ThemeSwitcher />
          <LanguageSwitcher />
          
          {/* Notifications Bell */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="relative h-8 w-8 md:h-10 md:w-10"
            onClick={() => setNotificationOpen(true)}
            aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ""}`}
          >
            <Bell className="h-4 w-4 md:h-5 md:w-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-0. 5 -right-0.5 md:top-0 md:right-0 h-4 w-4 md:h-5 md:w-5 bg-primary rounded-full flex items-center justify-center text-[10px] md:text-xs font-bold text-primary-foreground animate-pulse">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Button>

          {/* My Castle Button */}
          <Button
            variant="default"
            onClick={() => navigate("/profile")}
            className="bg-primary hover:bg-primary/90 text-xs md:text-sm px-2 py-1 md:px-4 md:py-2 h-8 md:h-10 whitespace-nowrap"
          >
            <span className="hidden sm:inline">{t("header.castle") || "My Castle"}</span>
            <span className="sm:hidden">Castle</span>
          </Button>
        </div>
      </div>

      {/* Notification Panel */}
      <NotificationPanel 
        open={notificationOpen} 
        onOpenChange={setNotificationOpen} 
      />
    </header>
  );
}