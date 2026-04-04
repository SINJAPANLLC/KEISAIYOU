import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Briefcase, Users, CreditCard, Bell, ArrowRight, Calendar, AlertCircle } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import DashboardLayout from "@/components/dashboard-layout";

const STATUS_LABELS: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  active: { label: "掲載中", variant: "default" },
  pending: { label: "審査中", variant: "secondary" },
  paused: { label: "停止中", variant: "outline" },
};

const REVIEW_STATUS_LABELS: Record<string, string> = {
  new: "新着",
  reviewed: "確認済み",
  rejected: "不採用",
};

export default function Dashboard() {
  const { user } = useAuth();

  const { data: jobs = [] } = useQuery<any[]>({
    queryKey: ["/api/jobs"],
    queryFn: () => apiRequest("GET", "/api/jobs").then((r) => r.json()),
  });

  const { data: applications = [] } = useQuery<any[]>({
    queryKey: ["/api/my/applications"],
    queryFn: () => apiRequest("GET", "/api/my/applications").then((r) => r.json()),
  });

  const { data: billing } = useQuery<any>({
    queryKey: ["/api/my/billing"],
    queryFn: () => apiRequest("GET", "/api/my/billing").then((r) => r.json()),
  });

  const now = new Date();
  const thisMonthApps = applications.filter((a: any) => {
    const d = new Date(a.createdAt);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  });

  const activeJobs = jobs.filter((j: any) => j.status === "active").length;
  const pendingJobs = jobs.filter((j: any) => j.status === "pending").length;
  const pausedJobs = jobs.filter((j: any) => j.status === "paused").length;

  const monthlyTotal = billing?.monthlyTotal ?? 0;
  const monthlyLimit = billing?.monthlyLimit ?? 30000;
  const remaining = Math.max(0, monthlyLimit - monthlyTotal);
  const usagePct = monthlyLimit > 0 ? Math.min(100, Math.round((monthlyTotal / monthlyLimit) * 100)) : 0;

  const recentApps = applications.slice(0, 5);

  const announcements = [
    { id: "1", title: "Indeed掲載が自動で開始されます", body: "求人が審査通過後、XMLフィード経由でIndeedに自動掲載されます。", date: "2025-01-01" },
    { id: "2", title: "応募通知はメール・LINEで届きます", body: "応募があった際、登録済みの連絡先にリアルタイム通知が届きます。", date: "2025-01-01" },
  ];

  return (
    <DashboardLayout>
      <div className="px-4 sm:px-6 py-6 max-w-5xl mx-auto">
        <div className="rounded-xl p-6 mb-6 hero-gradient relative overflow-hidden">
          <div className="hero-grid absolute inset-0 opacity-30" />
          <div className="relative z-10 flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="text-white/80 text-sm mb-1">ようこそ</p>
              <h1 className="text-2xl font-bold text-white mb-1" data-testid="text-page-title">
                {user?.companyName ?? "企業"} 様
              </h1>
              <p className="text-white/70 text-sm">KEI SAIYOUで軽貨物ドライバーの採用を進めましょう</p>
            </div>
            <Link href="/jobs/new">
              <Button className="bg-white text-primary hover:bg-white/90 font-semibold shrink-0">
                <Plus className="w-4 h-4 mr-1.5" />求人を作成
              </Button>
            </Link>
          </div>
        </div>

        {/* KPI stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <Card className="border border-border">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">今月の応募数</p>
              <p className="text-3xl font-black text-foreground" data-testid="stat-monthly-apps">{thisMonthApps.length}</p>
              <p className="text-xs text-muted-foreground mt-1">件</p>
            </CardContent>
          </Card>
          <Card className="border border-border">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">今月の課金額</p>
              <p className="text-3xl font-black text-foreground" data-testid="stat-monthly-charge">¥{monthlyTotal.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-1">（税込）</p>
            </CardContent>
          </Card>
          <Card className="border border-border">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">残り上限金額</p>
              <p className={`text-3xl font-black ${remaining < 10000 ? "text-destructive" : "text-foreground"}`} data-testid="stat-remaining">¥{remaining.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-1">/ ¥{monthlyLimit.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card className="border border-border">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">掲載中の求人</p>
              <p className="text-3xl font-black text-foreground" data-testid="stat-active-jobs">{activeJobs}</p>
              <p className="text-xs text-muted-foreground mt-1">件</p>
            </CardContent>
          </Card>
        </div>

        {/* Monthly limit usage bar */}
        {monthlyLimit > 0 && (
          <div className="mb-6 p-4 rounded-lg border border-border bg-muted/30">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-foreground">今月の利用状況</p>
              <p className="text-sm text-muted-foreground">{usagePct}%使用</p>
            </div>
            <div className="w-full bg-muted rounded-full h-2.5">
              <div
                className={`h-2.5 rounded-full transition-all duration-500 ${usagePct > 80 ? "bg-destructive" : "bg-primary"}`}
                style={{ width: `${usagePct}%` }}
              />
            </div>
            {usagePct > 80 && (
              <p className="text-xs text-destructive mt-2 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                上限に近づいています。上限到達で掲載が自動停止されます。
              </p>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Recent applicants */}
            <Card className="border border-border">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Users className="w-4 h-4 text-primary" />
                    直近の応募者
                  </CardTitle>
                  <Link href="/applications">
                    <Button variant="ghost" size="sm" className="text-xs text-muted-foreground">
                      すべて見る <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {recentApps.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">まだ応募がありません</p>
                ) : (
                  <div className="divide-y divide-border">
                    {recentApps.map((a: any) => (
                      <div key={a.id} className="py-3 flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">{a.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{a.jobTitle || "求人"}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 ml-2">
                          <Badge variant={a.reviewStatus === "new" ? "default" : "secondary"} className="text-xs">
                            {REVIEW_STATUS_LABELS[a.reviewStatus] || "新着"}
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

            {/* Job status summary */}
            <Card className="border border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-primary" />
                  求人のステータス
                </CardTitle>
              </CardHeader>
              <CardContent>
                {jobs.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-sm text-muted-foreground mb-4">求人がまだありません</p>
                    <Link href="/jobs/new">
                      <Button size="sm">
                        <Plus className="w-4 h-4 mr-1.5" />最初の求人を作成
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      <div className="rounded-lg bg-green-50 border border-green-100 p-3 text-center">
                        <p className="text-xl font-black text-green-700">{activeJobs}</p>
                        <p className="text-xs text-green-600 font-medium">掲載中</p>
                      </div>
                      <div className="rounded-lg bg-amber-50 border border-amber-100 p-3 text-center">
                        <p className="text-xl font-black text-amber-700">{pendingJobs}</p>
                        <p className="text-xs text-amber-600 font-medium">審査中</p>
                      </div>
                      <div className="rounded-lg bg-muted border border-border p-3 text-center">
                        <p className="text-xl font-black text-muted-foreground">{pausedJobs}</p>
                        <p className="text-xs text-muted-foreground font-medium">停止中</p>
                      </div>
                    </div>
                    <div className="divide-y divide-border">
                      {jobs.slice(0, 4).map((j: any) => (
                        <div key={j.id} className="py-2.5 flex items-center justify-between">
                          <p className="text-sm font-medium text-foreground truncate flex-1 min-w-0">{j.title}</p>
                          <Badge variant={STATUS_LABELS[j.status]?.variant || "secondary"} className="shrink-0 ml-2 text-xs">
                            {STATUS_LABELS[j.status]?.label || j.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                    {jobs.length > 4 && (
                      <Link href="/jobs">
                        <Button variant="ghost" size="sm" className="w-full mt-2 text-xs text-muted-foreground">
                          すべての求人を見る <ArrowRight className="w-3 h-3 ml-1" />
                        </Button>
                      </Link>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right column */}
          <div className="space-y-6">
            {/* Quick actions */}
            <Card className="border border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">クイックアクション</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link href="/jobs/new">
                  <Button variant="outline" className="w-full justify-start gap-2 text-sm">
                    <Plus className="w-4 h-4 text-primary" />求人を作成する
                  </Button>
                </Link>
                <Link href="/applications">
                  <Button variant="outline" className="w-full justify-start gap-2 text-sm">
                    <Users className="w-4 h-4 text-primary" />応募者を確認する
                  </Button>
                </Link>
                <Link href="/payment">
                  <Button variant="outline" className="w-full justify-start gap-2 text-sm">
                    <CreditCard className="w-4 h-4 text-primary" />請求・決済を確認する
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Billing info */}
            <div className="rounded-xl border border-border bg-muted/30 p-4">
              <p className="text-sm font-semibold text-foreground mb-1 flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-primary" />料金について
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                掲載は無料です。<br />
                応募が届いた時点で <strong>¥3,000（税込）/ 1応募</strong> が発生します。<br />
                月の上限に達すると掲載が自動停止されます。
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
