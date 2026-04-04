import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Activity, UserCheck, UserX, ArrowRight, CalendarDays, Briefcase, MessageSquare, DollarSign } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import DashboardLayout from "@/components/dashboard-layout";

type SafeUser = {
  id: string;
  companyName: string;
  email: string;
  approved: boolean;
  role: string;
  registrationDate?: string | null;
  createdAt?: string | null;
};

export default function AdminDashboard() {
  const [, navigate] = useLocation();

  const { data: users, isLoading: usersLoading } = useQuery<SafeUser[]>({
    queryKey: ["/api/admin/users"],
  });

  const pendingUsers = users?.filter((u) => !u.approved && u.role !== "admin") ?? [];
  const approvedUsers = users?.filter((u) => u.approved && u.role !== "admin") ?? [];
  const totalUsers = users?.filter((u) => u.role !== "admin") ?? [];

  const stats = [
    {
      label: "総会員数",
      value: totalUsers.length,
      icon: Users,
      bgClass: "bg-blue-50",
      iconClass: "text-blue-600",
      link: "/admin/users",
    },
    {
      label: "承認済み",
      value: approvedUsers.length,
      icon: UserCheck,
      bgClass: "bg-emerald-50",
      iconClass: "text-emerald-600",
      link: "/admin/users",
    },
    {
      label: "承認待ち",
      value: pendingUsers.length,
      icon: Activity,
      bgClass: "bg-amber-50",
      iconClass: "text-amber-600",
      link: "/admin/applications",
      highlight: pendingUsers.length > 0,
    },
    {
      label: "今月の応募収益",
      value: "¥0",
      icon: DollarSign,
      bgClass: "bg-violet-50",
      iconClass: "text-violet-600",
      link: "/admin/revenue",
    },
  ];

  const recentUsers = users
    ?.filter((u) => u.role !== "admin")
    .slice(-8)
    .reverse() ?? [];

  return (
    <DashboardLayout>
      <div className="px-4 sm:px-6 py-6 max-w-5xl mx-auto">
        <div className="rounded-xl p-6 mb-6 hero-gradient relative overflow-hidden">
          <div className="hero-grid absolute inset-0 opacity-30" />
          <div className="relative z-10 flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="text-white/80 text-xs mb-0.5">KEI SAIYOU</p>
              <h1 className="text-2xl font-bold text-white" data-testid="text-page-title">管理ダッシュボード</h1>
              <p className="text-white/70 text-sm mt-1">システム全体の概要と会員管理</p>
            </div>
            <div className="flex items-center gap-2 text-white/70 text-sm">
              <CalendarDays className="w-4 h-4" />
              <span>{new Date().toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric", weekday: "short" })}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {usersLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-5">
                    <Skeleton className="h-4 w-20 mb-3" />
                    <Skeleton className="h-8 w-12" />
                  </CardContent>
                </Card>
              ))
            : stats.map((stat) => (
                <Card
                  key={stat.label}
                  className={`border cursor-pointer hover:shadow-md transition-shadow ${stat.highlight ? "border-amber-300 bg-amber-50/50" : "border-border"}`}
                  onClick={() => navigate(stat.link)}
                >
                  <CardContent className="p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <div className={`w-8 h-8 rounded-lg ${stat.bgClass} flex items-center justify-center`}>
                        <stat.icon className={`w-4 h-4 ${stat.iconClass}`} />
                      </div>
                      {stat.highlight && (
                        <Badge variant="destructive" className="text-[10px] px-1.5 py-0">要対応</Badge>
                      )}
                    </div>
                    <p className="text-2xl font-black text-foreground">{stat.value}</p>
                    <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
                  </CardContent>
                </Card>
              ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-foreground flex items-center gap-2">
                <Activity className="w-4 h-4 text-amber-500" />
                承認待ち会員
                {pendingUsers.length > 0 && (
                  <Badge className="bg-amber-500 text-white text-[10px]">{pendingUsers.length}</Badge>
                )}
              </h2>
              <Button variant="ghost" size="sm" onClick={() => navigate("/admin/applications")}>
                すべて見る <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>
            <div className="space-y-2">
              {usersLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <Card key={i}><CardContent className="p-4"><Skeleton className="h-4 w-full" /></CardContent></Card>
                ))
              ) : pendingUsers.length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-center">
                    <UserCheck className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">承認待ちの会員はいません</p>
                  </CardContent>
                </Card>
              ) : (
                pendingUsers.slice(0, 5).map((user) => (
                  <Card key={user.id} className="border border-amber-200 bg-amber-50/30">
                    <CardContent className="p-4 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{user.companyName}</p>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                        {user.createdAt && (
                          <p className="text-[10px] text-muted-foreground/70 mt-0.5">
                            登録：{new Date(user.createdAt).toLocaleDateString("ja-JP")}
                          </p>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="shrink-0 border-amber-400 text-amber-700 hover:bg-amber-100"
                        onClick={() => navigate("/admin/applications")}
                      >
                        確認
                      </Button>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-foreground flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-500" />
                最近の登録会員
              </h2>
              <Button variant="ghost" size="sm" onClick={() => navigate("/admin/users")}>
                すべて見る <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>
            <div className="space-y-2">
              {usersLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <Card key={i}><CardContent className="p-4"><Skeleton className="h-4 w-full" /></CardContent></Card>
                ))
              ) : recentUsers.length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-center">
                    <Users className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">まだ会員が登録されていません</p>
                  </CardContent>
                </Card>
              ) : (
                recentUsers.map((user) => (
                  <Card key={user.id} className="border border-border">
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-muted-foreground">
                          {user.companyName?.[0] ?? "?"}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{user.companyName}</p>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                      </div>
                      <Badge
                        variant={user.approved ? "outline" : "secondary"}
                        className={`text-[10px] shrink-0 ${user.approved ? "border-emerald-400 text-emerald-700" : "border-amber-300 text-amber-700 bg-amber-50"}`}
                      >
                        {user.approved ? "承認済" : "未承認"}
                      </Badge>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "求人管理", href: "/admin/listings", icon: Briefcase },
            { label: "お問い合わせ", href: "/admin/contact-inquiries", icon: MessageSquare },
            { label: "収益管理", href: "/admin/revenue", icon: DollarSign },
            { label: "操作ログ", href: "/admin/audit-logs", icon: Activity },
          ].map((item) => (
            <Card
              key={item.href}
              className="border border-border hover:border-primary/40 hover:bg-primary/5 transition-colors cursor-pointer"
              onClick={() => navigate(item.href)}
            >
              <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                <item.icon className="w-5 h-5 text-primary" />
                <p className="text-xs font-semibold text-foreground">{item.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
