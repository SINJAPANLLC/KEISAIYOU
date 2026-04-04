import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users, Activity, UserCheck, AlertCircle, ArrowRight, CalendarDays, Briefcase,
  DollarSign, TrendingUp, MapPin, MessageSquare, BarChart2,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import DashboardLayout from "@/components/dashboard-layout";

export default function AdminDashboard() {
  const [, navigate] = useLocation();

  const { data: stats, isLoading } = useQuery<any>({
    queryKey: ["/api/admin/stats"],
  });

  const statCards = [
    {
      label: "今月の売上",
      value: stats ? `¥${(stats.monthlyRevenue || 0).toLocaleString()}` : "—",
      sub: `累計 ¥${(stats?.totalRevenue || 0).toLocaleString()}`,
      icon: DollarSign,
      bgClass: "bg-emerald-50",
      iconClass: "text-emerald-600",
      link: "/admin/revenue",
    },
    {
      label: "今月の応募数",
      value: stats?.monthlyApps ?? "—",
      sub: `累計 ${stats?.totalApps ?? 0}件`,
      icon: Users,
      bgClass: "bg-blue-50",
      iconClass: "text-blue-600",
      link: "/admin/applications",
    },
    {
      label: "掲載企業数",
      value: stats?.activeCompanies ?? "—",
      sub: `総登録 ${stats?.totalCompanies ?? 0}社`,
      icon: Briefcase,
      bgClass: "bg-violet-50",
      iconClass: "text-violet-600",
      link: "/admin/users",
    },
    {
      label: "求人審査待ち",
      value: stats?.pendingJobs ?? "—",
      sub: "承認待ち求人",
      icon: Activity,
      bgClass: "bg-amber-50",
      iconClass: "text-amber-600",
      link: "/admin/listings",
      highlight: (stats?.pendingJobs ?? 0) > 0,
    },
    {
      label: "未払い企業",
      value: stats?.unpaidCompanies ?? "—",
      sub: "決済失敗あり",
      icon: AlertCircle,
      bgClass: "bg-red-50",
      iconClass: "text-red-500",
      link: "/admin/applications",
      highlight: (stats?.unpaidCompanies ?? 0) > 0,
    },
    {
      label: "掲載中求人",
      value: stats?.activeJobs ?? "—",
      sub: "Indeed掲載対象",
      icon: TrendingUp,
      bgClass: "bg-sky-50",
      iconClass: "text-sky-600",
      link: "/admin/listings",
    },
  ];

  const areaMap: Record<string, number> = stats?.areaMap ?? {};
  const sortedAreas = Object.entries(areaMap).sort((a, b) => b[1] - a[1]).slice(0, 10);

  return (
    <DashboardLayout>
      <div className="px-4 sm:px-6 py-6 max-w-6xl mx-auto">
        <div className="rounded-xl p-6 mb-6 hero-gradient relative overflow-hidden">
          <div className="hero-grid absolute inset-0 opacity-30" />
          <div className="relative z-10 flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="text-white/80 text-xs mb-0.5">KEI SAIYOU</p>
              <h1 className="text-2xl font-bold text-white" data-testid="text-page-title">管理ダッシュボード</h1>
              <p className="text-white/70 text-sm mt-1">システム全体の概要と収益状況</p>
            </div>
            <div className="flex items-center gap-2 text-white/70 text-sm">
              <CalendarDays className="w-4 h-4" />
              <span>{new Date().toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric", weekday: "short" })}</span>
            </div>
          </div>
        </div>

        {/* KPI Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => (
                <Card key={i}><CardContent className="p-5"><Skeleton className="h-4 w-20 mb-3" /><Skeleton className="h-8 w-12" /></CardContent></Card>
              ))
            : statCards.map((stat) => (
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
                    <p className="text-[10px] text-muted-foreground/70 mt-0.5">{stat.sub}</p>
                  </CardContent>
                </Card>
              ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent applications */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border border-border">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Users className="w-4 h-4 text-primary" />
                    直近の応募
                  </CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => navigate("/admin/applications")}>
                    すべて見る <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
                ) : (stats?.recentApps ?? []).length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">まだ応募がありません</p>
                ) : (
                  <div className="divide-y divide-border">
                    {(stats?.recentApps ?? []).slice(0, 8).map((a: any) => (
                      <div key={a.id} className="py-2.5 flex items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">{a.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{a.companyName} — {a.jobTitle}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge
                            variant="outline"
                            className={`text-[10px] ${a.paymentStatus === "paid" ? "border-emerald-400 text-emerald-700 bg-emerald-50" : a.paymentStatus === "failed" ? "border-destructive text-destructive bg-destructive/5" : "border-amber-400 text-amber-700 bg-amber-50"}`}
                          >
                            {a.paymentStatus === "paid" ? "課金済" : a.paymentStatus === "failed" ? "決済失敗" : "未課金"}
                          </Badge>
                          <p className="text-xs text-muted-foreground whitespace-nowrap">
                            {new Date(a.createdAt).toLocaleDateString("ja-JP")}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent companies */}
            <Card className="border border-border">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-primary" />
                    直近の登録企業
                  </CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => navigate("/admin/users")}>
                    すべて見る <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
                ) : (stats?.recentCompanies ?? []).length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">まだ企業が登録されていません</p>
                ) : (
                  <div className="divide-y divide-border">
                    {(stats?.recentCompanies ?? []).map((u: any) => (
                      <div key={u.id} className="py-2.5 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                          <span className="text-xs font-bold text-muted-foreground">{u.companyName?.[0] ?? "?"}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">{u.companyName}</p>
                          <p className="text-xs text-muted-foreground">{u.prefecture || "—"} / 今月 {u.monthlyApps}件</p>
                        </div>
                        <Badge
                          variant="outline"
                          className={`text-[10px] shrink-0 ${u.approved ? "border-emerald-400 text-emerald-700 bg-emerald-50" : "border-amber-300 text-amber-700 bg-amber-50"}`}
                        >
                          {u.approved ? "承認済" : "審査中"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right column */}
          <div className="space-y-6">
            {/* Area map */}
            <Card className="border border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  エリア別掲載状況
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-6 w-full" />)}</div>
                ) : sortedAreas.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">データなし</p>
                ) : (
                  <div className="space-y-2">
                    {sortedAreas.map(([area, count]) => {
                      const max = sortedAreas[0]?.[1] || 1;
                      const pct = Math.round((count / max) * 100);
                      return (
                        <div key={area}>
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-foreground font-medium">{area}</span>
                            <span className="text-muted-foreground">{count}件</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-1.5">
                            <div className="bg-primary h-1.5 rounded-full transition-all" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick navigation */}
            <Card className="border border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">クイックナビ</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {[
                  { label: "収益管理", href: "/admin/revenue", icon: BarChart2 },
                  { label: "INDEED運用", href: "/admin/indeed-feed", icon: TrendingUp },
                  { label: "企業管理", href: "/admin/users", icon: Briefcase },
                  { label: "お問い合わせ", href: "/admin/contact-inquiries", icon: MessageSquare },
                ].map((item) => (
                  <Button
                    key={item.href}
                    variant="outline"
                    className="w-full justify-start gap-2 text-sm"
                    onClick={() => navigate(item.href)}
                  >
                    <item.icon className="w-4 h-4 text-primary" />
                    {item.label}
                    <ArrowRight className="w-3.5 h-3.5 ml-auto text-muted-foreground" />
                  </Button>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
