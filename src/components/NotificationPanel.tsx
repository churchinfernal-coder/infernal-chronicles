import { useEffect, useState, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle,
  SheetDescription 
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Bell,
  Heart,
  MessageCircle,
  UserPlus,
  Users,
  Crown,
  CheckCheck,
  Trash2,
  Settings,
  Filter
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDistanceToNow } from "date-fns";

// Types matching YOUR actual schema
interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  read: boolean;
  created_at: string;
}

interface NotificationPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Notification Icon Mapper
const getNotificationIcon = (type: string) => {
  const iconMap = {
    like: <Heart className="h-4 w-4 text-rose-500" />,
    comment: <MessageCircle className="h-4 w-4 text-blue-500" />,
    friend_request: <UserPlus className="h-4 w-4 text-green-500" />,
    friend_accept: <Users className="h-4 w-4 text-green-500" />,
    coven_invite: <Users className="h-4 w-4 text-purple-500" />,
    mention: <Bell className="h-4 w-4 text-orange-500" />,
    prime_expiry: <Crown className="h-4 w-4 text-yellow-500" />,
    message: <MessageCircle className="h-4 w-4 text-primary" />
  };
  return (iconMap as any)[type] || <Bell className="h-4 w-4" />;
};

// Single Notification Item Component
const NotificationItem = ({ 
  notification, 
  onRead, 
  onDelete, 
  onClick 
}: { 
  notification: Notification;
  onRead: (id: string) => void;
  onDelete: (id: string) => void;
  onClick: (notification: Notification) => void;
}) => {
  return (
    <div
      className={cn(
        "group relative flex gap-3 p-4 border-b border-border/50 transition-all hover:bg-accent/50 cursor-pointer",
        ! notification.read && "bg-accent/20"
      )}
      onClick={() => onClick(notification)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick(notification);
        }
      }}
      aria-label={`${notification.title} - ${notification.read ? "Read" : "Unread"}`}
    >
      {! notification.read && (
        <div className="absolute left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-primary rounded-full" aria-hidden="true" />
      )}

      <div className="shrink-0">
        <div className="h-10 w-10 rounded-full bg-accent flex items-center justify-center">
          {getNotificationIcon(notification.type)}
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h4 className="text-sm font-semibold truncate">{notification.title}</h4>
          <time 
            className="text-xs text-muted-foreground shrink-0"
            dateTime={notification.created_at}
          >
            {formatDistanceToNow(new Date(notification. created_at), { addSuffix: true })}
          </time>
        </div>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
          {notification.message}
        </p>
        <Badge variant="outline" className="text-xs">
          {notification.type.replace("_", " ")}
        </Badge>
      </div>

      <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
        {! notification.read && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={(e) => {
              e.stopPropagation();
              onRead(notification.id);
            }}
            aria-label="Mark as read"
          >
            <CheckCheck className="h-4 w-4" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-destructive"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(notification.id);
          }}
          aria-label="Delete notification"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

const NotificationSkeleton = () => (
  <div className="flex gap-3 p-4 border-b border-border/50">
    <Skeleton className="h-10 w-10 rounded-full" />
    <div className="flex-1 space-y-2">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-5 w-20" />
    </div>
  </div>
);

const NotificationPanel = ({ open, onOpenChange }: NotificationPanelProps) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getUser(). then(({ data: { user } }) => {
      setUser(user);
    });
  }, []);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      let query = supabase
        . from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (filter === "unread") {
        query = query.eq("read", false);
      }

      const { data, error } = await query;

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console. error("Error fetching notifications:", error);
      toast.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }, [user, filter]);

  useEffect(() => {
    if (open && user) {
      fetchNotifications();
    }
  }, [open, user, fetchNotifications]);

  useEffect(() => {
    if (! user) return;

    const channel = supabase
      .channel("notifications")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          if (payload. eventType === "INSERT") {
            setNotifications((prev) => [payload.new as Notification, ...prev]);
            toast.info(
              (payload.new as Notification).title,
              { description: (payload.new as Notification).message }
            );
          } else if (payload.eventType === "UPDATE") {
            setNotifications((prev) =>
              prev.map((n) => (n.id === payload.new.id ? payload.new as Notification : n))
            );
          } else if (payload.eventType === "DELETE") {
            setNotifications((prev) => prev.filter((n) => n.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase. removeChannel(channel);
    };
  }, [user]);

  const markAsRead = useCallback(async (id: string) => {
    try {
      const { error } = await (supabase as any)
        .from("notifications")
        .update({ read: true })
        .eq("id", id);

      if (error) throw error;

      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } catch (error) {
      console.error("Error marking notification as read:", error);
      toast.error("Failed to mark as read");
    }
  }, []);

  const deleteNotification = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from("notifications")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setNotifications((prev) => prev.filter((n) => n.id !== id));
      toast.success("Notification deleted");
    } catch (error) {
      console.error("Error deleting notification:", error);
      toast.error("Failed to delete notification");
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    if (!user) return;

    try {
      const { error } = await (supabase as any)
        .from("notifications")
        .update({ read: true })
        .eq("user_id", user.id)
        .eq("read", false);

      if (error) throw error;

      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      toast.success("All notifications marked as read");
    } catch (error) {
      console. error("Error marking all as read:", error);
      toast. error("Failed to mark all as read");
    }
  }, [user]);

  const deleteAllRead = useCallback(async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("notifications")
        .delete()
        .eq("user_id", user.id)
        .eq("read", true);

      if (error) throw error;

      setNotifications((prev) => prev.filter((n) => !n.read));
      toast.success("All read notifications deleted");
    } catch (error) {
      console.error("Error deleting read notifications:", error);
      toast. error("Failed to delete notifications");
    }
  }, [user]);

  const handleNotificationClick = useCallback((notification: Notification) => {
    markAsRead(notification.id);
    
    if (notification.link) {
      onOpenChange(false);
      navigate(notification.link);
    }
  }, [markAsRead, navigate, onOpenChange]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read). length,
    [notifications]
  );

  const filteredNotifications = useMemo(
    () => filter === "unread" ? notifications. filter((n) => !n. read) : notifications,
    [notifications, filter]
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="right" 
        className="w-full sm:w-[400px] p-0 flex flex-col"
        aria-describedby="notification-description"
      >
        <SheetHeader className="border-b border-border px-4 py-3 space-y-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" aria-hidden="true" />
              <SheetTitle className="text-lg">Notifications</SheetTitle>
              {unreadCount > 0 && (
                <Badge variant="destructive" className="h-5 min-w-5 px-1 text-xs">
                  {unreadCount}
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-1">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Filter notifications">
                    <Filter className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Filter</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setFilter("all")}>
                    All Notifications
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilter("unread")}>
                    Unread Only
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Notification actions">
                    <Settings className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={markAllAsRead} disabled={unreadCount === 0}>
                    <CheckCheck className="mr-2 h-4 w-4" />
                    Mark All as Read
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={deleteAllRead}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete All Read
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate("/settings/notifications")}>
                    <Settings className="mr-2 h-4 w-4" />
                    Notification Settings
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <SheetDescription id="notification-description" className="sr-only">
            View and manage your notifications.  {unreadCount} unread notifications.
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1">
          {loading ? (
            <div aria-live="polite" aria-busy="true">
              {[...Array(5)].map((_, i) => (
                <NotificationSkeleton key={i} />
              ))}
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div 
              className="flex flex-col items-center justify-center h-full py-12 px-4 text-center"
              role="status"
              aria-live="polite"
            >
              <Bell className="h-12 w-12 text-muted-foreground/50 mb-4" aria-hidden="true" />
              <h3 className="text-lg font-semibold mb-2">No Notifications</h3>
              <p className="text-sm text-muted-foreground">
                {filter === "unread"
                  ? "You're all caught up! No unread notifications."
                  : "You don't have any notifications yet."}
              </p>
            </div>
          ) : (
            <div role="list" aria-label="Notifications">
              {filteredNotifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onRead={markAsRead}
                  onDelete={deleteNotification}
                  onClick={handleNotificationClick}
                />
              ))}
            </div>
          )}
        </ScrollArea>

        {! loading && filteredNotifications.length > 0 && (
          <div className="border-t border-border px-4 py-3">
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => {
                onOpenChange(false);
                navigate("/notifications");
              }}
            >
              View All Notifications
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default NotificationPanel;