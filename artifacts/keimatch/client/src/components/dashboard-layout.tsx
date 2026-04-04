import { Link, useLocation } from "wouter";
import { Home, Plus, Shield, Building2, Users, DollarSign, MessageSquare, Activity, Wrench, Settings, Menu, X, PanelLeftClose, PanelLeftOpen, ChevronDown, ChevronRight, Briefcase, Bell, Mail, CreditCard, Rss } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

type MenuItem = {
  href: string;
  label: string;
  icon: React.ElementType;
};

const userMenuItems: MenuItem[] = [
  { href: "/home",         label: "ダッシュボード",   icon: Home },
  { href: "/jobs/new",     label: "求人作成",         icon: Plus },
  { href: "/jobs",         label: "求人一覧",         icon: Briefcase },
  { href: "/applications", label: "応募者一覧",       icon: Users },
  { href: "/payment",      label: "請求・決済",       icon: CreditCard },
  { href: "/settings",     label: "アカウント設定",   icon: Settings },
];

const adminMenuItems: MenuItem[] = [
  { href: "/admin",                  label: "ダッシュボード",    icon: Shield },
  { href: "/admin/revenue",          label: "収益管理",          icon: DollarSign },
  { href: "/admin/indeed-feed",      label: "INDEED 運用管理",  icon: Rss },
  { href: "/admin/users",            label: "企業管理",          icon: Building2 },
  { href: "/admin/listings",         label: "求人管理",          icon: Briefcase },
  { href: "/admin/applications",     label: "応募者管理",        icon: Users },
  { href: "/admin/email-marketing",  label: "営業メール",        icon: Mail },
  { href: "/admin/notifications",    label: "通知管理",          icon: Bell },
  { href: "/admin/contact-inquiries",label: "お問い合わせ",      icon: MessageSquare },
  { href: "/admin/audit-logs",       label: "ユーザーログ",      icon: Activity },
  { href: "/admin/settings",         label: "システム設定",      icon: Wrench },
];

function SidebarMenu({ items, onNavigate }: { items: MenuItem[]; onNavigate?: () => void }) {
  const [location] = useLocation();

  return (
    <nav className="space-y-1" data-testid="nav-sidebar">
      {items.map((item) => {
        const isActive = location === item.href || (item.href !== "/home" && item.href !== "/admin" && location.startsWith(item.href));
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
              <span>{item.label}</span>
            </button>
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { isAdmin } = useAuth();
  const [location] = useLocation();
  const isAdminPage = location.startsWith("/admin");
  const [adminMenuOpen, setAdminMenuOpen] = useState(isAdminPage);

  return (
    <div className="flex-1 overflow-y-auto p-2">
      <SidebarMenu items={userMenuItems} onNavigate={onNavigate} />
      {isAdmin && (
        <>
          <div className="my-3 mx-2 border-t border-border" />
          <button
            onClick={() => setAdminMenuOpen(!adminMenuOpen)}
            className="w-full flex items-center justify-between px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors rounded-md"
            data-testid="button-toggle-admin-menu"
          >
            <span>管理者メニュー</span>
            {adminMenuOpen ? (
              <ChevronDown className="w-3.5 h-3.5" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5" />
            )}
          </button>
          {adminMenuOpen && (
            <div className="mt-1">
              <SidebarMenu items={adminMenuItems} onNavigate={onNavigate} />
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function DashboardLayout({ children, noScroll }: { children: React.ReactNode; noScroll?: boolean }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    const saved = localStorage.getItem("keisaiyou_sidebar_open");
    return saved !== null ? saved === "true" : true;
  });
  const [location] = useLocation();

  useEffect(() => {
    setMobileOpen(false);
  }, [location]);

  useEffect(() => {
    localStorage.setItem("keisaiyou_sidebar_open", String(sidebarOpen));
  }, [sidebarOpen]);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  return (
    <div className="flex h-full overflow-hidden">
      {sidebarOpen && (
        <aside className="hidden lg:flex flex-col w-56 shrink-0 border-r bg-muted/30" data-testid="panel-sidebar">
          <div className="flex items-center justify-end p-2 border-b border-border">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(false)}
              data-testid="button-sidebar-close"
            >
              <PanelLeftClose className="w-4 h-4" />
            </Button>
          </div>
          <SidebarContent />
        </aside>
      )}
      {!sidebarOpen && (
        <div className="hidden lg:flex items-start pt-2 pl-1 shrink-0 border-r bg-muted/30">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(true)}
            data-testid="button-sidebar-open"
          >
            <PanelLeftOpen className="w-4 h-4" />
          </Button>
        </div>
      )}

      <div className="lg:hidden">
        <button
          className="fixed bottom-5 right-5 z-[60] w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-[0_4px_20px_rgba(0,0,0,0.3)] border-2 border-white/30"
          onClick={() => setMobileOpen(true)}
          style={{ display: mobileOpen ? "none" : "flex" }}
          data-testid="button-mobile-sidebar-open"
        >
          <Menu className="w-6 h-6" />
        </button>

        {mobileOpen && (
          <div className="fixed inset-0 z-[70]" data-testid="panel-mobile-sidebar">
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => setMobileOpen(false)}
            />
            <aside className="absolute left-0 top-0 bottom-0 w-64 bg-background border-r border-border flex flex-col animate-in slide-in-from-left duration-200">
              <div className="flex items-center justify-end p-3 border-b border-border">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setMobileOpen(false)}
                  data-testid="button-mobile-sidebar-close"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <SidebarContent onNavigate={() => setMobileOpen(false)} />
            </aside>
          </div>
        )}
      </div>

      <div className={`flex-1 min-w-0 h-full ${noScroll ? "overflow-hidden" : "overflow-y-auto"}`}>
        {children}
      </div>
    </div>
  );
}
