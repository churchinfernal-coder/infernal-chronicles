import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupContent,
} from "@/components/ui/sidebar";
import {
  Home,
  Video,
  Image,
  Users,
  Flame,
  Wand2,
  Moon,
  Sparkles,
  Swords,
  Skull,
  Calendar,
  Library,
  Zap,
  Castle,
  Settings,
  LogOut,
} from "lucide-react";

interface SidebarItem {
  title: string;
  url: string;
  icon: React.ReactNode;
}

export function AppSidebar() {
  const location = useLocation();

  const hideSidebarOn = ["/auth", "/superadmin", "/chat"];
  const shouldHide = hideSidebarOn.some(
    (route) => location.pathname === route || location.pathname.startsWith(route + "/")
  ) || location.pathname.startsWith("/coven/");

  if (shouldHide) {
    return null;
  }

  const freeItems: SidebarItem[] = [
    { title: "Devil's Diary", url: "/feed", icon: <Home className="h-5 w-5 text-[#f50838]" /> },
    { title:  "Satan's Sinagogue", url: "/satans-sinagogue", icon: <Video className="h-5 w-5 text-[#DC143C]" /> },
    { title:  "Picture Palace", url: "/picture-palace", icon: <Image className="h-5 w-5 text-[#DC143C]" /> },
    { title: "Allies", url: "/friends", icon: <Users className="h-5 w-5 text-[#fd0909]" /> },
    { title:  "Covens", url: "/covens", icon: <Flame className="h-5 w-5 text-[#DC143C]" /> },
    { title: "Infernal Chat", url: "/chat", icon:  <Wand2 className="h-5 w-5 text-[#DC143C]" /> },
  ];

  const premiumItems:  SidebarItem[] = [
    { title: "Ouija Chamber", url: "/ouija-room", icon: <Moon className="h-5 w-5 text-[#DC143C]" /> },
    { title:  "Tarot Chamber", url: "/tarot", icon: <Sparkles className="h-5 w-5 text-[#DC143C]" /> }, // ← CHANGED from /tarot-reading to /tarot
    { title:  "Rune Casting", url: "/rune-casting", icon: <Swords className="h-5 w-5 text-[#DC143C]" /> },
    { title: "Solomon's Chamber", url: "/solomons-chamber", icon: <Skull className="h-5 w-5 text-[#DC143C]" /> },
    { title: "Ritual Calendar", url: "/ritual-calendar", icon: <Calendar className="h-5 w-5 text-[#DC143C]" /> },
    { title: "Occult Library", url: "/occult-library", icon: <Library className="h-5 w-5 text-[#DC143C]" /> },
    { title: "Wicked Works", url: "/wicked-works", icon: <Zap className="h-5 w-5 text-[#DC143C]" /> },
  ];

  const bottomItems: SidebarItem[] = [
    { title: "My Castle", url: "/profile", icon: <Castle className="h-5 w-5 text-[#DC143C]" /> },
    { title: "Settings", url: "/settings", icon: <Settings className="h-5 w-5 text-[#DC143C]" /> },
  ];

  const isActive = (url: string) => location.pathname === url;

  return (
    <Sidebar className="bg-slate-950 border-r border-slate-800">
      <SidebarHeader className="border-b border-slate-800 p-4">
        <div className="text-lg font-bold text-white">Infernal Social</div>
      </SidebarHeader>

      <SidebarContent className="overflow-y-auto">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {freeItems.map((item) => (
                <SidebarMenuItem key={item. url}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <Link
                      to={item.url}
                      className={`flex items-center gap-3 px-4 py-2 rounded cursor-pointer no-underline ${
                        isActive(item.url)
                          ? "bg-slate-900 text-white"
                          : "text-white hover: bg-slate-900"
                      }`}
                    >
                      {item.icon}
                      <span className="font-medium">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-4">
          <div className="px-4 py-2 text-xs font-bold text-[#DC143C] uppercase tracking-wider">
            Premium Services
          </div>
          <SidebarGroupContent>
            <SidebarMenu>
              {premiumItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <Link
                      to={item.url}
                      className={`flex items-center gap-3 px-4 py-2 rounded cursor-pointer no-underline ${
                        isActive(item.url)
                          ? "bg-slate-900 text-white"
                          : "text-white hover:bg-slate-900"
                      }`}
                    >
                      {item.icon}
                      <span className="font-medium">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-4">
          <SidebarGroupContent>
            <SidebarMenu>
              {bottomItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={isActive(item. url)}>
                    <Link
                      to={item.url}
                      className={`flex items-center gap-3 px-4 py-2 rounded cursor-pointer no-underline ${
                        isActive(item. url)
                          ? "bg-slate-900 text-white"
                          : "text-white hover:bg-slate-900"
                      }`}
                    >
                      {item.icon}
                      <span className="font-medium">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-slate-800 p-4">
        <Link
          to="/auth"
          className="w-full flex items-center gap-2 px-3 py-2 rounded text-white hover: bg-slate-900 transition-colors font-medium no-underline"
        >
          <LogOut className="h-5 w-5" />
          <span>Logout</span>
        </Link>
      </SidebarFooter>
    </Sidebar>
  );
}