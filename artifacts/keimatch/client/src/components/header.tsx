import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Briefcase, Menu, X, LogIn, LogOut, UserPlus, Bell, User, Check, CheckCheck, Trash2, Settings, Building2, Phone, MapPin, Home } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import type { Notification } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { apiRequest, queryClient } from "@/lib/queryClient";
import logoImage from "@assets/logo-keisaiyou.png";
import logoWhite from "@assets/logo-white.png";

function BrandLogo({ size = "normal", variant = "colored" }: { size?: "small" | "normal", variant?: "colored" | "white" }) {
  return (
    <img
      src={variant === "white" ? logoWhite : logoImage}
      alt="KEI SAIYOU"
      className={size === "small" ? "h-6 w-auto object-contain" : "h-7 sm:h-8 w-auto object-contain"}
    />
  );
}

function NotificationDropdown() {
  const [open, setOpen] = useState(false);

  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    refetchInterval: 30000,
  });

  const { data: unreadData } = useQuery<{ count: number }>({
    queryKey: ["/api/notifications/unread-count"],
    refetchInterval: 15000,
  });

  const unreadCount = unreadData?.count ?? 0;

  const markAsRead = useMutation({
    mutationFn: (id: string) => apiRequest("PATCH", `/api/notifications/${id}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
    },
  });

  const markAllAsRead = useMutation({
    mutationFn: () => apiRequest("PATCH", "/api/notifications/read-all"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
    },
  });

  const deleteNotification = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/notifications/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
    },
  });

  const formatTime = (dateStr: string | Date) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "たった今";
    if (minutes < 60) return `${minutes}分前`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}時間前`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}日前`;
    return date.toLocaleDateString("ja-JP");
  };

  const typeIcon = (type: string) => {
    switch (type) {
      case "application_new": return <Briefcase className="w-4 h-4 text-blue-500" />;
      case "user_approved": return <Check className="w-4 h-4 text-emerald-500" />;
      case "user_registered": return <UserPlus className="w-4 h-4 text-purple-500" />;
      default: return <Bell className="w-4 h-4 text-muted-foreground" />;
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative hover:bg-black/5 rounded-none" data-testid="button-notifications">
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span
              className="absolute top-2 right-2 min-w-[6px] h-1.5 rounded-full bg-primary"
              data-testid="badge-notification-dot"
            />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0 rounded-none border-border" data-testid="dropdown-notifications">
        <div className="flex items-center justify-between gap-2 p-3 border-b border-border">
          <h3 className="text-sm font-medium" data-testid="text-notification-title">通知</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-7 rounded-none"
              onClick={() => markAllAsRead.mutate()}
              data-testid="button-mark-all-read"
            >
              <CheckCheck className="w-3.5 h-3.5 mr-1" />
              全て既読
            </Button>
          )}
        </div>
        <div className="max-h-80 overflow-y-auto" data-testid="list-notifications">
          {notifications.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground font-light" data-testid="text-no-notifications">
              通知はありません
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                className={`flex items-start gap-3 p-4 border-b border-border last:border-b-0 ${
                  !notif.isRead ? "bg-primary/[0.03]" : ""
                }`}
                data-testid={`notification-item-${notif.id}`}
              >
                <div className="mt-0.5 shrink-0">{typeIcon(notif.type)}</div>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs leading-relaxed ${!notif.isRead ? "font-medium text-foreground" : "text-foreground/70 font-light"}`}>
                    {notif.title}
                  </p>
                  <p className="text-xs text-foreground/50 mt-1 truncate font-light">{notif.message}</p>
                  <p className="text-[10px] text-foreground/40 mt-2 tracking-wide">{formatTime(notif.createdAt)}</p>
                </div>
                <div className="flex items-center gap-0.5 shrink-0">
                  {!notif.isRead && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 rounded-none"
                      onClick={(e) => { e.stopPropagation(); markAsRead.mutate(notif.id); }}
                      data-testid={`button-read-${notif.id}`}
                    >
                      <Check className="w-3 h-3" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 rounded-none"
                    onClick={(e) => { e.stopPropagation(); deleteNotification.mutate(notif.id); }}
                    data-testid={`button-delete-notification-${notif.id}`}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function ProfileDropdown() {
  const [open, setOpen] = useState(false);
  const { user, isAdmin, logout } = useAuth();
  const [, navigate] = useLocation();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className="flex items-center gap-2 px-3 py-1.5 hover:bg-black/5 transition-colors cursor-pointer"
          data-testid="button-profile"
        >
          <div className="w-6 h-6 bg-primary/10 flex items-center justify-center shrink-0">
            <User className="w-3 h-3 text-primary" />
          </div>
          <span className="hidden sm:inline text-foreground text-xs font-medium" data-testid="text-header-username">
            {user?.contactName || user?.companyName}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 p-0 rounded-none border-border" data-testid="dropdown-profile">
        <div className="p-4 border-b border-border">
          <p className="text-sm font-medium text-foreground" data-testid="text-profile-name">{user?.contactName || user?.companyName}</p>
          <p className="text-xs text-foreground/50 mt-1 font-light" data-testid="text-profile-email">{user?.email}</p>
          {isAdmin && (
            <Badge variant="outline" className="mt-2 text-[10px] rounded-none tracking-widest font-normal">管理者</Badge>
          )}
        </div>
        <div className="p-2">
          <div className="space-y-1">
            <div className="px-3 py-2 flex items-center gap-3 text-xs text-foreground/60 font-light">
              <Building2 className="w-3.5 h-3.5" />
              <span data-testid="text-profile-company">{user?.companyName}</span>
            </div>
            {user?.phone && (
              <div className="px-3 py-2 flex items-center gap-3 text-xs text-foreground/60 font-light">
                <Phone className="w-3.5 h-3.5" />
                <span data-testid="text-profile-phone">{user?.phone}</span>
              </div>
            )}
            {user?.address && (
              <div className="px-3 py-2 flex items-center gap-3 text-xs text-foreground/60 font-light">
                <MapPin className="w-3.5 h-3.5" />
                <span data-testid="text-profile-address">{user?.address}</span>
              </div>
            )}
          </div>
          <div className="border-t border-border mt-2 pt-2 space-y-1">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-xs rounded-none font-medium"
              onClick={() => { setOpen(false); navigate("/settings"); }}
              data-testid="button-profile-settings"
            >
              <Settings className="w-3.5 h-3.5 mr-3" />
              プロフィール設定
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-xs text-destructive rounded-none font-medium"
              onClick={() => { setOpen(false); logout.mutate(); }}
              data-testid="button-profile-logout"
            >
              <LogOut className="w-3.5 h-3.5 mr-3" />
              ログアウト
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default function Header() {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, isAuthenticated, isAdmin, logout } = useAuth();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isHome = location === "/";

  // Minimalist logged-in header
  if (isAuthenticated) {
    return (
      <header className="shrink-0 z-50 bg-white border-b border-border">
        <div className="px-4 sm:px-6">
          <div className="flex items-center justify-between gap-4 h-14">
            <div className="flex items-center gap-4">
              <Link href="/home" className="flex items-center shrink-0 hover:opacity-80 transition-opacity" data-testid="text-logo">
                <BrandLogo size="small" />
              </Link>
            </div>

            <div className="flex items-center gap-2">
              <NotificationDropdown />
              <div className="h-4 w-px bg-border hidden sm:block mx-1"></div>
              <ProfileDropdown />
            </div>
          </div>
        </div>
      </header>
    );
  }

  const headerVariant = isHome ? (scrolled ? "orange" : "transparent") : "white";

  // High-end editorial public header
  return (
    <header className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
      headerVariant === "transparent" ? "bg-transparent py-4 border-b border-transparent" :
      headerVariant === "orange" ? "bg-primary border-b border-white/10 py-2 shadow-sm" :
      "bg-white/95 backdrop-blur-md border-b border-border py-2 shadow-sm"
    }`}>
      <div className="max-w-[1440px] mx-auto px-6 lg:px-12">
        <div className="flex items-center justify-between gap-4 h-12">
          <Link href="/" className="flex items-center shrink-0 hover:opacity-80 transition-opacity" data-testid="text-logo">
            <BrandLogo variant={isHome ? "white" : "colored"} />
          </Link>

          <div className="hidden md:flex items-center gap-6">
            <Link href="/login">
              <Button variant="ghost" className={`text-sm font-medium tracking-wide hover:bg-black/5 rounded-none px-4 ${isHome ? "text-white hover:bg-white/10" : "text-foreground"}`} data-testid="button-header-login">
                ログイン
              </Button>
            </Link>
            <Link href="/register">
              <Button className={isHome ? "bg-white text-primary hover:bg-white/90 rounded-none text-sm font-bold tracking-wider px-6 h-10" : "bg-primary text-white hover:bg-primary/90 rounded-none text-sm font-bold tracking-wider px-6 h-10"} data-testid="button-header-register">
                無料で求人を掲載する
              </Button>
            </Link>
          </div>

          <Button
            size="icon"
            variant="ghost"
            className={`md:hidden rounded-none ${isHome ? "text-white hover:bg-white/10" : "text-foreground hover:bg-black/5"}`}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            data-testid="button-mobile-menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 w-full border-t border-border bg-white shadow-xl flex flex-col p-4 gap-2">
          <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
            <Button variant="ghost" className="w-full justify-start rounded-none h-12 text-sm font-medium text-foreground">
              <LogIn className="w-4 h-4 mr-3 text-foreground/50" />
              ログイン
            </Button>
          </Link>
          <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
            <Button className="w-full justify-start rounded-none h-12 text-sm font-bold bg-primary text-white hover:bg-primary/90">
              <UserPlus className="w-4 h-4 mr-3" />
              無料で求人を掲載する
            </Button>
          </Link>
        </div>
      )}
    </header>
  );
}
