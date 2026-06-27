import { Link, useLocation } from "react-router-dom";
import { Home, Video, Image, MessageSquare, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  BookOpen,
  UsersRound,
  Flame,
  Moon,
  Wand2,
  Sparkles,
  Crown,
  Calendar,
  Library,
  Palette,
  Settings,
  LogOut,
  X,
  User
} from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function MobileNavBar() {
  const location = useLocation();
  const { language } = useLanguage();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const mainNavItems = [
    { 
      name: language === "en" ? "Home" : "Inicio", 
      path: "/dashboard", 
      icon: Home 
    },
    { 
      name: language === "en" ? "Videos" : "Videos", 
      path: "/satans-sinagogue", 
      icon: Video 
    },
    { 
      name:  language === "en" ? "Images" : "Imágenes", 
      path: "/picture-palace", 
      icon: Image 
    },
    { 
      name: language === "en" ? "Chat" : "Chat", 
      path: "/chat", 
      icon: MessageSquare 
    },
  ];

  const allFeatures = [
    {
      category: language === "en" ? "Main" : "Principal",
      items: [
        { name: language === "en" ? "Devil's Diary" : "Diario del Diablo", path: "/dashboard", icon: BookOpen },
        { name: language === "en" ? "Allies" : "Aliados", path: "/allies", icon: UsersRound },
        { name:  language === "en" ? "Covens" : "Aquelarres", path: "/covens", icon: Flame },
        { name: language === "en" ? "Chat" : "Chat", path: "/chat", icon: MessageSquare },
      ]
    },
    {
      category: language === "en" ? "Premium Services" : "Servicios Premium",
      items: [
        { name: language === "en" ? "Ouija Chamber" : "Cámara Ouija", path: "/ouija-room", icon: Moon },
        { name: language === "en" ? "Tarot Reading" : "Lectura de Tarot", path: "/tarot-reading", icon: Wand2 },
        { name: language === "en" ? "Rune Casting" : "Lanzamiento de Runas", path: "/rune-casting", icon: Sparkles },
        { name: language === "en" ? "Solomon's Chamber" : "Cámara de Salomón", path: "/solomons-chamber", icon: Crown },
        { name: language === "en" ? "Ritual Calendar" : "Calendario Ritual", path: "/ritual-calendar", icon: Calendar },
        { name:  language === "en" ? "Occult Library" : "Biblioteca Oculta", path: "/occult-library", icon: Library },
        { name: language === "en" ? "Wicked Works" : "Obras Malvadas", path: "/wicked-works", icon: Palette },
      ]
    }
  ];

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = async () => {
    await supabase. auth.signOut();
    navigate("/auth");
    setOpen(false);
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-[100] bg-[#0a0a0a] border-t border-border/50">
      <div className="grid grid-cols-5 h-16">
        {mainNavItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center gap-1 transition-colors border-r border-border/30 last:border-r-0",
                isActive(item.path)
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground active:bg-accent"
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span className="text-[10px] font-medium leading-none">{item.name}</span>
            </Link>
          );
        })}

        {/* MENU BUTTON */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button
              className="flex flex-col items-center justify-center gap-1 transition-colors text-muted-foreground active:bg-accent"
            >
              <Menu className="h-5 w-5 shrink-0" />
              <span className="text-[10px] font-medium leading-none">
                {language === "en" ?  "Menu" : "Menú"}
              </span>
            </button>
          </SheetTrigger>
          
          <SheetContent side="right" className="w-[85vw] max-w-sm p-0 bg-background">
            <ScrollArea className="h-full">
              <div className="flex flex-col h-full">
                {/* Header */}
                <div className="p-6 border-b bg-card">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold">Menu</h2>
                    <button 
                      onClick={() => setOpen(false)}
                      className="hover:bg-accent rounded-lg p-2 transition-colors"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => {
                      navigate("/profile");
                      setOpen(false);
                    }}
                  >
                    <User className="h-4 w-4 mr-2" />
                    {language === "en" ? "My Profile" : "Mi Perfil"}
                  </Button>
                </div>

                {/* Navigation */}
                <div className="flex-1 p-4 bg-background">
                  {allFeatures.map((section) => (
                    <div key={section.category} className="mb-6">
                      <h3 className="text-xs font-semibold text-primary uppercase tracking-wider mb-3 px-3">
                        {section.category}
                      </h3>
                      <div className="space-y-1">
                        {section.items.map((item) => {
                          const Icon = item. icon;
                          return (
                            <Link
                              key={item.path}
                              to={item.path}
                              onClick={() => setOpen(false)}
                              className={cn(
                                "flex items-center gap-3 px-3 py-3 rounded-lg transition-colors",
                                isActive(item. path)
                                  ? "bg-primary/10 text-primary font-medium"
                                  :  "hover:bg-accent"
                              )}
                            >
                              <Icon className="h-5 w-5 shrink-0" />
                              <span className="text-sm">{item.name}</span>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer */}
                <div className="p-4 border-t space-y-2 bg-card">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => {
                      navigate("/settings");
                      setOpen(false);
                    }}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    {language === "en" ? "Settings" : "Configuración"}
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={handleLogout}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    {language === "en" ? "Logout" :  "Cerrar Sesión"}
                  </Button>
                </div>
              </div>
            </ScrollArea>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}