import { useState, useEffect } from "react";
import { Home, Users, Flame, Settings, Store, Skull, Moon, Video, Castle, Sparkles, CircleDot, Swords, Library, Image } from "lucide-react";
import { NavLink } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarHeader,
} from "@/components/ui/sidebar";

const PitchforkIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#DC143C" strokeWidth="2">
    <line x1="7" y1="3" x2="7" y2="10" />
    <line x1="12" y1="3" x2="12" y2="10" />
    <line x1="17" y1="3" x2="17" y2="10" />
    <line x1="12" y1="10" x2="12" y2="21" />
    <line x1="7" y1="10" x2="17" y2="10" />
  </svg>
);

export function AppSidebar() {
  const [profile, setProfile] = useState<{ username: string | null; avatar_url: string | null } | null>(null);

  const freeItems = [
    { title: "Devil's Diary", url: "/feed", icon: Home },
    { title: "Satan's Sinagogue", url: "/satans-sinagogue", icon: Video },
    { title: "Picture Palace", url: "/picture-palace", icon: Image },
    { title: "Allies", url: "/friends", icon: Users },
    { title: "Covens", url: "/covens", icon: Flame },
    { title: "Infernal Chat", url: "/chat", icon: PitchforkIcon },
  ];

  const premiumItems = [
    { title: "Ouija Chamber", url: "/ouija-room", icon: Moon },
    { title: "Tarot Reading", url: "/tarot-reading", icon: Sparkles },
    { title: "Rune Casting", url: "/rune-casting", icon: Swords },
    { title: "Solomon's Chamber", url: "/solomons-chamber", icon: Skull },
    { title: "Ritual Calendar", url: "/ritual-calendar", icon: CircleDot },
    { title: "Occult Library", url: "/occult-library", icon: Library },
    { title: "Wicked Works", url: "/wicked-works", icon: Sparkles },
    { title: "Prime Store", url: "/store", icon: Store },
  ];

  const bottomItems = [
    { title: "My Castle", url: "/my-dungeon", icon: Castle },
    { title: "Settings", url: "/settings", icon: Settings },
  ];

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (! user) return;

    const { data } = await (supabase as any)
      .from("profiles")
      .select("username, avatar_url")
      .eq("user_id", user.id)
      .single();

    if (data) setProfile(data);
  };

  return (
    <Sidebar className="border-r border-sidebar-border bg-linear-to-b from-background to-background/95">
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <NavLink to="/profile" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <Avatar className="h-10 w-10 border-[#DC143C]/30">
            <AvatarImage src={profile?.avatar_url || ""} />
            <AvatarFallback className="bg-[#DC143C]/20 text-[#DC143C] font-semibold">
              {profile?.username ?  profile.username.charAt(0). toUpperCase() : "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col min-w-0">
            <span className="font-semibold text-sm text-[#DC143C] truncate">
              {profile?.username || "Loading..."}
            </span>
            <span className="text-xs text-muted-foreground">View Castle</span>
          </div>
        </NavLink>
      </SidebarHeader>

      <SidebarContent className="overflow-y-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        <style>{`
          [data-sidebar-content]::-webkit-scrollbar { display: none; }
        `}</style>
        
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {freeItems. map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className={({ isActive }) =>
                        isActive
                          ? "bg-sidebar-accent text-[#DC143C] font-semibold text-xs py-2"
                          : "hover:bg-sidebar-accent/50 text-[#DC143C]/80 hover:text-[#DC143C] text-xs py-2"
                      }
                    >
                      <item.icon className="h-4 w-4" />
                      <span className="font-medium">{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <div className="px-2 py-2 text-xs font-semibold text-[#DC143C] uppercase border-t border-sidebar-border">
            PREMIUM SERVICES
          </div>
          <SidebarGroupContent>
            <SidebarMenu>
              {premiumItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className={({ isActive }) =>
                        isActive
                          ? "bg-sidebar-accent text-[#DC143C] font-semibold text-xs py-2"
                          : "hover:bg-sidebar-accent/50 text-[#DC143C]/80 hover:text-[#DC143C] text-xs py-2"
                      }
                    >
                      <item.icon className="h-4 w-4" />
                      <span className="font-medium">{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {bottomItems. map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className={({ isActive }) =>
                        isActive
                          ? "bg-sidebar-accent text-[#DC143C] font-semibold text-xs py-2"
                          : "hover:bg-sidebar-accent/50 text-[#DC143C]/80 hover:text-[#DC143C] text-xs py-2"
                      }
                    >
                      <item.icon className="h-4 w-4" />
                      <span className="font-medium">{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}