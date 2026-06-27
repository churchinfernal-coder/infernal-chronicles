import { Link, useLocation } from "react-router-dom";
import { Home, Video, MessageSquare, Users, UsersRound, Sun, Moon, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";
import NotificationPanel from "@/components/NotificationPanel";

export function DesktopNavBar() {
  const location = useLocation();
  const { language, setLanguage } = useLanguage();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  const navItems = [
    { name:  language === "en" ? "My Castle" :  "Mi Castillo", path:  "/profile", icon:   Home },
    { name:  language === "en" ? "Feed" : "Alimentar", path:   "/feed", icon: Video },
    { name: language === "en" ? "Chat" : "Charlar", path: "/chat", icon: MessageSquare },
    { name: language === "en" ? "Covens" :  "Aquelarres", path:  "/covens", icon:  Users },
    { name:  language === "en" ? "Allies" :   "Aliados", path:  "/allies", icon:  UsersRound },
  ];

  const isActive = (path: string) => location.pathname === path;

  const toggleTheme = () => {
    setTheme(theme === "dark" ?  "light" :   "dark");
  };

  const toggleLanguage = () => {
    const newLang = language === "en" ? "es" : "en";
    setLanguage(newLang);
  };

  return (
    <>
      <nav className="flex sticky top-0 z-40 w-full h-14 bg-card/95 backdrop-blur-sm border-b border-border max-md:hidden">
        <div className="flex items-center justify-between w-full px-6">
          {/* Left side - Navigation items */}
          <div className="flex items-center gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item. path}
                  to={item.  path}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                    isActive(item.path)
                      ?   "bg-primary text-primary-foreground"
                      :  "text-muted-foreground hover: text-foreground hover: bg-accent"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>

          {/* Right side - Theme and Language toggles */}
          <div className="flex items-center gap-2 pr-4">
            {/* Theme Toggle */}
            <Button 
              variant="ghost" 
              size="icon"
              onClick={toggleTheme}
              className="h-9 w-9 shrink-0"
              title={language === "en" ?  (theme === "dark" ? "Light Mode" : "Dark Mode") : (theme === "dark" ?  "Modo Claro" :  "Modo Oscuro")}
            >
              {mounted && theme === "dark" ? (
                <Sun className="h-[18px] w-[18px]" />
              ) : (
                <Moon className="h-[18px] w-[18px]" />
              )}
            </Button>

            {/* Language Toggle */}
            <Button 
              variant="ghost" 
              size="icon"
              onClick={toggleLanguage}
              className="h-9 w-9 shrink-0"
              title={language === "en" ? "Switch to Spanish" : "Cambiar a Inglés"}
            >
              <Globe className="h-[18px] w-[18px]" />
            </Button>
          </div>
        </div>
      </nav>

      {/* Notification Panel */}
      <NotificationPanel 
        open={notificationOpen}
        onOpenChange={setNotificationOpen}
        onUnreadCountChange={setUnreadCount}
      />
    </>
  );
}