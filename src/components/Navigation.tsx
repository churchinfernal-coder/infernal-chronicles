import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { 
  Home, 
  MessageSquare, 
  Users, 
  Video, 
  UsersRound,
  Menu,
  X,
  Sun,
  Moon,
  Globe
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useTheme } from "next-themes";

interface NavItem {
  name: string;
  path: string;
  icon: React.ReactNode;
}

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const [language, setLanguage] = useState<"en" | "es">("en");
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedLang = localStorage.getItem("language") as "en" | "es";
    if (savedLang) setLanguage(savedLang);
  }, []);

  const navItems: NavItem[] = [
    { name: language === "en" ? "My Castle" : "Mi Castillo", path: "/dashboard", icon: <Home className="h-5 w-5" /> },
    { name: language === "en" ? "Feed" : "Alimentar", path: "/feed", icon:  <Video className="h-5 w-5" /> },
    { name: language === "en" ? "Chat" : "Charlar", path: "/chat", icon: <MessageSquare className="h-5 w-5" /> },
    { name: language === "en" ? "Covens" : "Aquelarres", path: "/covens", icon: <Users className="h-5 w-5" /> },
    { name: language === "en" ? "Allies" : "Aliados", path: "/allies", icon: <UsersRound className="h-5 w-5" /> },
  ];

  const toggleLanguage = () => {
    const newLang = language === "en" ?  "es" : "en";
    setLanguage(newLang);
    localStorage.setItem("language", newLang);
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border">
        <div className="flex items-center justify-around h-16 px-2">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors",
                isActive(item.path)
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {item.icon}
              <span className="text-xs font-medium">{item.name}</span>
            </Link>
          ))}
        </div>
      </nav>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 h-screen w-64 lg:w-72 bg-background border-r border-border flex-col z-40">
        {/* Header */}
        <div className="p-6 border-b border-border">
          <Link to="/dashboard" className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xl">IS</span>
            </div>
            <div>
              <h1 className="font-bold text-lg">Infernal Social</h1>
              <p className="text-xs text-muted-foreground">
                {language === "en" ? "Dark Network" : "Red Oscura"}
              </p>
            </div>
          </Link>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto py-4">
          <div className="space-y-1 px-3">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium",
                  isActive(item. path)
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                {item.icon}
                <span>{item.name}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Controls */}
        <div className="p-4 border-t border-border space-y-2">
          {/* Theme Toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={toggleTheme}
            className="w-full justify-start gap-2"
          >
            {mounted && theme === "dark" ? (
              <>
                <Sun className="h-4 w-4" />
                <span>{language === "en" ? "Light Mode" : "Modo Claro"}</span>
              </>
            ) : (
              <>
                <Moon className="h-4 w-4" />
                <span>{language === "en" ? "Dark Mode" :  "Modo Oscuro"}</span>
              </>
            )}
          </Button>

          {/* Language Toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={toggleLanguage}
            className="w-full justify-start gap-2"
          >
            <Globe className="h-4 w-4" />
            <span>{language === "en" ? "Español" : "English"}</span>
          </Button>
        </div>
      </aside>

      {/* Mobile Top Bar */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-40 bg-background border-b border-border">
        <div className="flex items-center justify-between h-14 px-4">
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold">IS</span>
            </div>
            <span className="font-bold">Infernal Social</span>
          </Link>

          <div className="flex items-center gap-2">
            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="h-8 w-8"
            >
              {mounted && theme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>

            {/* Language Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleLanguage}
              className="h-8 w-8"
            >
              <Globe className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile Spacer */}
      <div className="md:hidden h-14" />
      <div className="md:hidden h-16" />
    </>
  );
}