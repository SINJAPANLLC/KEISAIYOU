import { Link, useLocation } from "wouter";
import {
  Home, Plus, Shield, Building2, Users, DollarSign, MessageSquare,
  Activity, Wrench, Settings, Menu, X, PanelLeftClose, PanelLeftOpen,
  Briefcase, Bell, Mail, CreditCard, Rss, LogOut, RefreshCw,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";

type MenuItem = {
  href: string;
  label: string;
  icon: React.ElementType;
};

const userMenuItems: MenuItem[] = [
  { href: "/home",         label: "ダッシュボード",   icon: Home },
  { href: "/jobs",         label: "求人管理",         icon: Briefcase },
  { href: "/applications", label: "応募者一覧",       icon: Users },
  { href: "/payment",      label: "請求・決済",       icon: CreditCard },
  { href: "/settings",     label: "アカウント設定",   icon: Settings },
];

const adminMenuItems: MenuItem[] = [
  { href: "/admin",                   label: "ダッシュボード",   icon: Shield },
  { href: "/admin/revenue",           label: "収益管理",         icon: DollarSign },
  { href: "/admin/indeed-feed",       label: "INDEED 運用",      icon: Rss },
  { href: "/admin/users",             label: "企業管理",         icon: Building2 },
  { href: "/admin/listings",          label: "求人管理",         icon: Briefcase },
  { href: "/admin/applications",      label: "応募者管理",       icon: Users },
  { href: "/admin/email-marketing",   label: "営業メール",       icon: Mail },
  { href: "/admin/notifications",     label: "通知管理",         icon: Bell },
  { href: "/admin/contact-inquiries", label: "お問い合わせ",     icon: MessageSquare },
  { href: "/admin/refund-requests",   label: "返金申請",         icon: RefreshCw },
  { href: "/admin/audit-logs",        label: "操作ログ",         icon: Activity },
  { href: "/admin/settings",          label: "システム設定",     icon: Wrench },
];

function SidebarMenu({ items, onNavigate }: { items: MenuItem[]; onNavigate?: () => void }) {
  const [location] = useLocation();

  return (
    <nav className="space-y-0.5" data-testid="nav-sidebar">
      {items.map((item) => {
        const isActive =
          location === item.href ||
          (item.href !== "/home" && item.href !== "/admin" && location.startsWith(item.href));
        return (
          <Link key={item.href} href={item.href}>
            <button
              onClick={onNavigate}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-md transition-colors ${
                isActive
                  ? "bg-primary text-primary-foreground font-medium"
                  : "text-foreground hover:bg-muted"
              }`}
              data-testid={`link-sidebar-${item.href.replace(/\//g, "-").slice(1)}`}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              <span className="truncate">{item.label}</span>
            </button>
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { user, isAdmin } = useAuth();

  const handleLogout = async () => {
    await apiRequest("POST", "/api/logout");
    window.location.href = "/";
  };

  return (
    <div className="flex flex-col h-full">
      {/* Navigation */}
      <div className="flex-1 overflow-y-auto p-2 space-y-4">
        {!isAdmin && (
          <div>
            <p className="px-3 py-1 text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-widest mb-1">
              企業メニュー
            </p>
            <SidebarMenu items={userMenuItems} onNavigate={onNavigate} />
          </div>
        )}

        {isAdmin && (
          <>
            <div>
              <p className="px-3 py-1 text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-widest mb-1">
                企業メニュー
              </p>
              <SidebarMenu items={userMenuItems} onNavigate={onNavigate} />
            </div>

            <div className="border-t border-border/60 pt-3">
              <p className="px-3 py-1 text-[10px] font-semibold text-primary/70 uppercase tracking-widest mb-1">
                管理者メニュー
              </p>
              <SidebarMenu items={adminMenuItems} onNavigate={onNavigate} />
            </div>
          </>
        )}
      </div>

      {/* Logout */}
      <div className="p-2 border-t border-border/60">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
          data-testid="button-logout"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span>ログアウト</span>
        </button>
      </div>
    </div>
  );
}

export default function DashboardLayout({
  children,
  noScroll,
}: {
  children: React.ReactNode;
  noScroll?: boolean;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    try {
      const saved = localStorage.getItem("keisaiyou_sidebar_open");
      return saved !== null ? saved === "true" : true;
    } catch {
      return true;
    }
  });
  const [location] = useLocation();

  useEffect(() => {
    setMobileOpen(false);
  }, [location]);

  useEffect(() => {
    try {
      localStorage.setItem("keisaiyou_sidebar_open", String(sidebarOpen));
    } catch {}
  }, [sidebarOpen]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  return (
    <div className="flex h-full overflow-hidden">
      {/* Desktop sidebar */}
      {sidebarOpen ? (
        <aside
          className="hidden lg:flex flex-col w-56 shrink-0 border-r border-border bg-muted/20"
          data-testid="panel-sidebar"
        >
          <div className="flex items-center justify-end px-2 pt-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              onClick={() => setSidebarOpen(false)}
              data-testid="button-sidebar-close"
            >
              <PanelLeftClose className="w-4 h-4" />
            </Button>
          </div>
          <SidebarContent />
        </aside>
      ) : (
        <div className="hidden lg:flex flex-col items-center pt-2 px-1 shrink-0 border-r border-border bg-muted/20">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            onClick={() => setSidebarOpen(true)}
            data-testid="button-sidebar-open"
          >
            <PanelLeftOpen className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Mobile FAB */}
      <div className="lg:hidden">
        {!mobileOpen && (
          <button
            className="fixed bottom-5 right-5 z-[60] w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg border-2 border-white/20"
            onClick={() => setMobileOpen(true)}
            data-testid="button-mobile-sidebar-open"
          >
            <Menu className="w-6 h-6" />
          </button>
        )}

        {mobileOpen && (
          <div className="fixed inset-0 z-[70]" data-testid="panel-mobile-sidebar">
            <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
            <aside className="absolute left-0 top-0 bottom-0 w-64 bg-background border-r border-border flex flex-col animate-in slide-in-from-left duration-200">
              <div className="flex items-center justify-end p-2 border-b border-border">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setMobileOpen(false)}
                  data-testid="button-mobile-sidebar-close"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex-1 overflow-hidden">
                <SidebarContent onNavigate={() => setMobileOpen(false)} />
              </div>
            </aside>
          </div>
        )}
      </div>

      {/* Main content */}
      <div className={`flex-1 min-w-0 h-full ${noScroll ? "overflow-hidden" : "overflow-y-auto"}`}>
        {children}
      </div>
    </div>
  );
}
