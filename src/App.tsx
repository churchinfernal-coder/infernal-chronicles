import React, { Suspense, useState } from "react";
import { Toaster } from "./components/ui/toaster";
import { Toaster as Sonner } from "./components/ui/sonner";
import { TooltipProvider } from "./components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { LanguageProvider } from "./contexts/LanguageContext";
import { AuthProvider } from "./contexts/AuthContext";
import Footer from "@/components/Footer";
import NotificationPanel from "@/components/NotificationPanel";
import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { DesktopNavBar } from "@/components/DesktopNavBar";
import { MobileNavBar } from "@/components/MobileNavBar";
import TarotRoute from '@/pages/tarot';
import Purchase from '@/pages/Purchase';
import AuthCallback from '@/pages/AuthCallback';
import NotificationSettings from "@/pages/NotificationSettings";
import TarotPurchase from "@/pages/TarotPurchase";
import OuijaPurchase from "@/pages/OuijaPurchase";
import RunePurchase from "@/pages/RunePurchase";
import Premium from '@/pages/Premium';
import CommercialLicense from '@/pages/CommercialLicense';

const Index = React.lazy(() => import("./pages/Index"));
const PicturePalace = React.lazy(() => import("./pages/PicturePalace"));
const AboutUs = React.lazy(() => import("./pages/AboutUs"));
const JoinNow = React.lazy(() => import("./pages/JoinNow"));
const CommunityGuidelines = React.lazy(() => import("./pages/CommunityGuidelines"));
const PrivacyPolicy = React.lazy(() => import("./pages/PrivacyPolicy"));
const Terms = React.lazy(() => import("./pages/Terms"));
const Disclaimer = React.lazy(() => import("./pages/Disclaimer"));
const Checkout = React.lazy(() => import("./pages/Checkout"));
const LandingPage = React.lazy(() => import("./pages/landing/LandingPage"));

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
import QuickTarotUpload from "./pages/admin/QuickTarotUpload";
import AlbumDetail from "@/pages/AlbumDetail";
import { DesignEditor } from "./components/admin/DesignEditor";
import AIImageGenerator from "./components/admin/AIImageGenerator";
import WickedWorksPurchase from '@/pages/WickedWorksPurchase';

const queryClient = new QueryClient();

const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="text-center space-y-4">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
      <p className="text-lg font-gothic text-primary animate-pulse">Loading the darkness...</p>
    </div>
  </div>
);

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = React.useState<boolean | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setIsAuthenticated(!!user);
      } catch (error) {
        console.error('Auth check error:', error);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session?.user);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  if (isLoading) {
    return <LoadingFallback />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
};

const NotificationBell = () => {
  const [notifOpen, setNotifOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [user, setUser] = useState<any>(null);
  const location = useLocation();

  const protectedRoutes = [
    "/dashboard", "/feed", "/friends", "/allies", "/covens", "/coven",
    "/chat", "/profile", "/settings", "/solomons-chamber", "/ritual-calendar",
    "/satans-sinagogue", "/studio", "/ouija-room", "/tarot-reading", "/tarot",
    "/rune-casting", "/my-dungeon", "/dungeon-album", "/wicked-works",
    "/occult-library", "/purchase", "/premium", "/picture-palace",
  ];

  const shouldShow =
    protectedRoutes.some((route) => location.pathname.startsWith(route)) &&
    !location.pathname.startsWith("/superadmin") &&
    !location.pathname.startsWith("/auth");

  React.useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    fetchUser();
  }, []);

  React.useEffect(() => {
    if (!user || !shouldShow) return;

    const fetchUnreadCount = async () => {
      try {
        const { count, error } = await (supabase as any)
          .from("notifications")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("read", false);

        if (error) {
          console.error("Error fetching unread count:", error);
          return;
        }

        setUnreadCount(count || 0);
      } catch (error) {
        console.error("Error fetching unread count:", error);
      }
    };

    fetchUnreadCount();

    try {
      const channel = supabase
        .channel("notification_count")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            fetchUnreadCount();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } catch (error) {
      console.error("Error subscribing to notifications:", error);
    }
  }, [user, shouldShow]);

  if (!shouldShow || !user) return null;

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-3 right-3 z-50 h-9 w-9 md:h-10 md:w-10 md:top-4 md:right-6"
        onClick={() => setNotifOpen(true)}
        aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ""}`}
      >
        <Bell className="h-4 w-4 md:h-5 md:w-5" />
        {unreadCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 text-[10px] md:h-5 md:min-w-5 md:text-xs flex items-center justify-center"
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
  const hideFooterRoutes = ["/chat", "/auth", "/superadmin"];
  const hideFooterPaths =
    hideFooterRoutes.some((route) => location.pathname === route || location.pathname.startsWith(route + "/")) ||
    location.pathname.startsWith("/coven/") ||
    location.pathname.startsWith("/landing/");

  if (hideFooterPaths) {
    return null;
  }

  return <Footer />;
};

const SidebarConditional = () => {
  const location = useLocation();

  const hideSidebarRoutes = ["/auth", "/superadmin", "/auth/callback"];
  const shouldHideSidebar =
    hideSidebarRoutes.some((route) => location.pathname === route || location.pathname.startsWith(route + "/")) ||
    location.pathname.startsWith("/landing/");

  const publicRoutes = ["/", "/about", "/join", "/guidelines", "/privacy", "/terms", "/disclaimer"];
  const isPublicRoute = publicRoutes.includes(location.pathname);

  if (shouldHideSidebar || isPublicRoute) {
    return null;
  }

  return <AppSidebar />;
};

const NavBarConditional = () => {
  const location = useLocation();

  const hideNavRoutes = ["/auth", "/superadmin", "/auth/callback"];
  const publicRoutes = ["/", "/picture-palace", "/about", "/join", "/guidelines", "/privacy", "/terms", "/disclaimer"];
  
  const shouldHideNav =
    hideNavRoutes.some((route) => location.pathname === route || location.pathname.startsWith(route + "/")) ||
    publicRoutes.includes(location.pathname) ||
    location.pathname.startsWith("/landing/");

  if (shouldHideNav) {
    return null;
  }

  return (
    <>
      <DesktopNavBar />
      <MobileNavBar />
    </>
  );
};

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
        <LanguageProvider>
          <AuthProvider>
            <TooltipProvider>
              <BrowserRouter>
                <SidebarProvider>
                  <div className="flex min-h-screen w-full">
                    <SidebarConditional />

                    <main className="flex-1 flex flex-col overflow-y-auto">
                      <NavBarConditional />
                      <Suspense fallback={<LoadingFallback />}>
                        <NotificationBell />
                        <div className="flex-1 w-full pb-20 md:pb-0">
                          <Routes>
                            <Route path="/auth" element={<Auth />} />
                            <Route path="/auth/callback" element={<AuthCallback />} />
                            <Route path="/superadmin" element={<SuperAdmin />} />

                            <Route path="/" element={<Layout />}>
                              <Route index element={<Index />} />
                              <Route path="about" element={<AboutUs />} />
                              <Route path="join" element={<JoinNow />} />
                              <Route path="guidelines" element={<CommunityGuidelines />} />
                              <Route path="privacy" element={<PrivacyPolicy />} />
                              <Route path="terms" element={<Terms />} />
                              <Route path="disclaimer" element={<Disclaimer />} />
                            </Route>

                            {/* Landing Pages Routes - PUBLIC ACCESS */}
                            <Route path="/landing/:country" element={
                              <Suspense fallback={<LoadingFallback />}>
                                <LandingPage />
                              </Suspense>
                            } />
                            <Route path="/landing/:country/:state" element={
                              <Suspense fallback={<LoadingFallback />}>
                                <LandingPage />
                              </Suspense>
                            } />
                            <Route path="/landing/:country/:state/:city" element={
                              <Suspense fallback={<LoadingFallback />}>
                                <LandingPage />
                              </Suspense>
                            } />

                            <Route path="/tarot-purchase" element={<TarotPurchase />} />
                            <Route path="/ouija-purchase" element={<OuijaPurchase />} />
                            <Route path="/rune-purchase" element={<RunePurchase />} />
                            
                            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                            <Route path="/feed" element={<ProtectedRoute><Feed /></ProtectedRoute>} />
                            <Route path="/friends" element={<ProtectedRoute><Friends /></ProtectedRoute>} />
                            <Route path="/allies" element={<ProtectedRoute><Friends /></ProtectedRoute>} />
                            <Route path="/covens" element={<ProtectedRoute><Covens /></ProtectedRoute>} />
                            <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
                            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                            <Route path="/profile/:username" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                            <Route path="/solomons-chamber" element={<ProtectedRoute><SolomonsChamber /></ProtectedRoute>} />
                            <Route path="/ritual-calendar" element={<ProtectedRoute><RitualCalendar /></ProtectedRoute>} />
                            <Route path="/satans-sinagogue" element={<ProtectedRoute><SatansSinagogue /></ProtectedRoute>} />
                            <Route path="/studio/:username" element={<ProtectedRoute><SatansStudio /></ProtectedRoute>} />
                            <Route path="/ouija-room" element={<ProtectedRoute><OuijaRoom /></ProtectedRoute>} />
                            <Route path="/tarot-reading" element={<ProtectedRoute><TarotReading /></ProtectedRoute>} />
                            <Route path="/rune-casting" element={<ProtectedRoute><RuneCasting /></ProtectedRoute>} />
                            <Route path="/my-dungeon" element={<ProtectedRoute><MyDungeon /></ProtectedRoute>} />
                            <Route path="/dungeon-album" element={<ProtectedRoute><DungeonAlbum /></ProtectedRoute>} />
                            <Route path="/wicked-works" element={<ProtectedRoute><WickedWorks /></ProtectedRoute>} />
                            <Route path="/occult-library" element={<ProtectedRoute><OccultLibrary /></ProtectedRoute>} />
                            <Route path="/design-editor" element={<ProtectedRoute><DesignEditor /></ProtectedRoute>} />
                            <Route path="/ai-image-generator" element={<ProtectedRoute><AIImageGenerator /></ProtectedRoute>} />
                            <Route path="/dungeon/album/:albumId" element={<AlbumDetail />} />
                            <Route path="/settings/notifications" element={<ProtectedRoute><NotificationSettings /></ProtectedRoute>} />
                            <Route path="/admin/quick-tarot-upload" element={<ProtectedRoute><QuickTarotUpload /></ProtectedRoute>} />
                            <Route path="/tarot" element={<ProtectedRoute><TarotRoute /></ProtectedRoute>} />
                            <Route path="/purchase" element={<ProtectedRoute><Purchase /></ProtectedRoute>} />
                            <Route path="/picture-palace" element={<ProtectedRoute><PicturePalace /></ProtectedRoute>} />
                            <Route path="/coven/:covenId" element={<ProtectedRoute><CovenPage /></ProtectedRoute>} />
                            <Route path="/checkout" element={<Checkout />} />
                            <Route path="/premium" element={<Premium />} />
                            <Route path="/wicked-works-purchase" element={<WickedWorksPurchase />} />
                            <Route path="/commercial-license" element={<CommercialLicense />} />
                            <Route path="*" element={<NotFound />} />
                          </Routes>
                        </div>
                        <FooterConditional />
                      </Suspense>
                    </main>
                  </div>
                  <Toaster />
                  <Sonner />
                </SidebarProvider>
              </BrowserRouter>
            </TooltipProvider>
          </AuthProvider>
        </LanguageProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}