import React, { Suspense, useState } from "react";
import { Toaster } from "./components/ui/toaster";
import { Toaster as Sonner } from "./components/ui/sonner";
import { TooltipProvider } from "./components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { LanguageProvider } from "./contexts/LanguageContext";
import Footer from "@/components/Footer";
import NotificationPanel from "@/components/NotificationPanel";
import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

const Index = React.lazy(() => import("./pages/Index"));
const PicturePalace = React.lazy(() => import("./pages/PicturePalace"));
const AboutUs = React.lazy(() => import("./pages/AboutUs"));
const JoinNow = React.lazy(() => import("./pages/JoinNow"));
const CommunityGuidelines = React.lazy(() => import("./pages/CommunityGuidelines"));
const PrivacyPolicy = React.lazy(() => import("./pages/PrivacyPolicy"));
const Terms = React.lazy(() => import("./pages/Terms"));
const Disclaimer = React.lazy(() => import("./pages/Disclaimer"));

import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Layout from "./pages/Layout";
import Feed from "./pages/Feed";
import Friends from "./pages/Friends";
import Covens from "./pages/Covens";
import CovenPage from "./pages/CovenPage";
import Chat from "./pages/Chat";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import Store from "./pages/Store";
import SolomonsChamber from "./pages/SolomonsChamber";
import RitualCalendar from "./pages/RitualCalendar";
import SatansSinagogue from "./pages/SatansSinagogue";
import SatansStudio from "./pages/SatansStudio";
import OuijaRoom from "./pages/OuijaRoom";
import TarotReading from "./pages/TarotReading";
import RuneCasting from "./pages/RuneCasting";
import SuperAdmin from "./pages/SuperAdmin";
import MyDungeon from "./pages/MyDungeon";
import DungeonAlbum from "./pages/DungeonAlbum";
import WickedWorks from "./pages/WickedWorks";
import OccultLibrary from "./pages/OccultLibrary";
import NotFound from "./pages/NotFound";

import { DesignEditor } from "./components/admin/DesignEditor";
import AIImageGenerator from "./components/admin/AIImageGenerator";

const queryClient = new QueryClient();

const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="text-center space-y-4">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
      <p className="text-lg font-gothic text-primary animate-pulse">Loading the darkness...</p>
    </div>
  </div>
);

const NotificationBell = () => {
  const [notifOpen, setNotifOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [user, setUser] = useState<any>(null);
  const location = useLocation();

  const protectedRoutes = [
    "/dashboard",
    "/feed",
    "/friends",
    "/covens",
    "/coven",
    "/chat",
    "/profile",
    "/settings",
    "/store"
  ];
  
  const shouldShow = protectedRoutes.some(route => location.pathname.startsWith(route)) && 
                     !location.pathname.startsWith("/superadmin");

  React.useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });
  }, []);

  React.useEffect(() => {
    if (!user || !shouldShow) return;

    const fetchUnreadCount = async () => {
      const { count } = await (supabase as any)
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("read", false);

      setUnreadCount(count || 0);
    };

    fetchUnreadCount();

    const channel = supabase
      .channel("notification_count")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`
        },
        () => {
          fetchUnreadCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, shouldShow]);

  if (!shouldShow || !user) return null;

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 right-20 z-50 h-10 w-10"
        onClick={() => setNotifOpen(true)}
        aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ""}`}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-1 -right-1 h-5 min-w-5 px-1 text-xs flex items-center justify-center"
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </Badge>
        )}
      </Button>

      <NotificationPanel open={notifOpen} onOpenChange={setNotifOpen} />
    </>
  );
};

const FooterConditional = () => {
  const location = useLocation();
  const hideFooterRoutes = ['/chat', '/auth', '/superadmin'];
  const hideFooterPaths = hideFooterRoutes.some(route => location.pathname.startsWith(route)) || 
                          location.pathname.startsWith('/coven/');
  
  if (hideFooterPaths) {
    return null;
  }
  
  return <Footer />;
};

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <TooltipProvider>
          <BrowserRouter>
            <Suspense fallback={<LoadingFallback />}>
              <NotificationBell />

              <Routes>
                <Route path="/auth" element={<Auth />} />
                <Route path="/chat" element={<Chat />} />
                {/* FIXED: Removed space in :covenId */}
                <Route path="/coven/:covenId" element={<CovenPage />} />
                <Route path="/superadmin" element={<SuperAdmin />} />
                
                <Route path="/" element={<Layout />}>
                  <Route index element={<Index />} />
                  <Route path="picture-palace" element={<PicturePalace />} />
                  <Route path="about" element={<AboutUs />} />
                  <Route path="join" element={<JoinNow />} />
                  <Route path="guidelines" element={<CommunityGuidelines />} />
                  <Route path="privacy" element={<PrivacyPolicy />} />
                  <Route path="terms" element={<Terms />} />
                  <Route path="disclaimer" element={<Disclaimer />} />
                  <Route path="dashboard" element={<Dashboard />} />
                  <Route path="feed" element={<Feed />} />
                  <Route path="friends" element={<Friends />} />
                  <Route path="covens" element={<Covens />} />
                  <Route path="profile" element={<Profile />} />
                  <Route path="profile/:username" element={<Profile />} />
                  <Route path="settings" element={<Settings />} />
                  <Route path="store" element={<Store />} />
                  <Route path="solomons-chamber" element={<SolomonsChamber />} />
                  <Route path="ritual-calendar" element={<RitualCalendar />} />
                  <Route path="satans-sinagogue" element={<SatansSinagogue />} />
                  <Route path="studio/:username" element={<SatansStudio />} />
                  <Route path="ouija-room" element={<OuijaRoom />} />
                  <Route path="tarot-reading" element={<TarotReading />} />
                  <Route path="rune-casting" element={<RuneCasting />} />
                  <Route path="my-dungeon" element={<MyDungeon />} />
                  <Route path="dungeon-album" element={<DungeonAlbum />} />
                  <Route path="wicked-works" element={<WickedWorks />} />
                  <Route path="occult-library" element={<OccultLibrary />} />
                  <Route path="design-editor" element={<DesignEditor />} />
                  <Route path="ai-image-generator" element={<AIImageGenerator />} />
                  <Route path="*" element={<NotFound />} />
                </Route>
              </Routes>
            </Suspense>

            <FooterConditional />
          </BrowserRouter>

          <Toaster />
          <Sonner />
        </TooltipProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}