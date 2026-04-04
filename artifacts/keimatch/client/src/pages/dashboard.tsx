import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Users, CreditCard, ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import DashboardLayout from "@/components/dashboard-layout";


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

  const monthlyTotal = billing?.monthlyTotal ?? 0;

  const recentApps = applications.slice(0, 5);

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
              <p className="text-3xl font-black text-foreground" data-testid="stat-monthly-charge">¥{Math.round(monthlyTotal / 1.1).toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-1">（税別）</p>
            </CardContent>
          </Card>
          <Card className="border border-border">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">掲載中の求人</p>
              <p className="text-3xl font-black text-foreground" data-testid="stat-active-jobs">{activeJobs}</p>
              <p className="text-xs text-muted-foreground mt-1">件</p>
            </CardContent>
          </Card>
          <Card className="border border-border bg-primary/5">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                <CreditCard className="w-3 h-3 text-primary" />料金について
              </p>
              <p className="text-2xl font-black text-primary">¥3,000</p>
              <p className="text-xs text-muted-foreground mt-1">/ 1応募（税別）</p>
            </CardContent>
          </Card>
        </div>

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

          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
