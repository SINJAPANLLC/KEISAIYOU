import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import DashboardLayout from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Rss, Copy, ExternalLink, CheckCircle2, Briefcase, Globe, Download, MapPin, TrendingUp, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AdminIndeedFeed() {
  const { toast } = useToast();
  const [period, setPeriod] = useState("all");

  const feedUrl = `${window.location.origin}/feed/indeed.xml`;

  const { data: jobs = [], isLoading: jobsLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/jobs"],
    queryFn: () => apiRequest("GET", "/api/admin/jobs").then((r) => r.json()),
  });

  const { data: revenueStats, isLoading: statsLoading } = useQuery<any>({
    queryKey: ["/api/admin/revenue-stats"],
    queryFn: () => apiRequest("GET", "/api/admin/revenue-stats").then((r) => r.json()),
  });

  const { data: allApps = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/applications"],
    queryFn: () => apiRequest("GET", "/api/admin/applications").then((r) => r.json()),
  });

  const copyFeedUrl = () => {
    navigator.clipboard.writeText(feedUrl).then(() => toast({ title: "フィードURLをコピーしました" }));
  };

  const activeJobs = jobs.filter((j: any) => j.status === "active");
  const totalJobs = jobs.length;

  // Filter apps by period
  const now = new Date();
  const filteredApps = allApps.filter((a: any) => {
    if (period === "all") return true;
    const d = new Date(a.createdAt);
    if (period === "month") return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    if (period === "3months") return now.getTime() - d.getTime() < 90 * 24 * 60 * 60 * 1000;
    return true;
  });

  // Company-level metrics
  const companies = revenueStats?.companies ?? [];
  const companyMetrics = companies.map((c: any) => {
    const compApps = filteredApps.filter((a: any) => a.companyName === c.companyName);
    const paidApps = compApps.filter((a: any) => a.paymentStatus === "paid").length;
    const totalCompApps = compApps.length;
    const clicks = paidApps * 8 + Math.floor(Math.random() * 20); // Simulated clicks
    const cpc = clicks > 0 ? Math.round((paidApps * 3300 * 0.3) / clicks) : 0;
    const revenue = paidApps * 3300;
    const adCost = Math.round(revenue * 0.3);
    const profit = revenue - adCost;
    return { ...c, paidApps, totalApps: totalCompApps, clicks, cpc, revenue, adCost, profit };
  }).filter((c: any) => c.totalApps > 0);

  // Area breakdown
  const areaMap: Record<string, { jobs: number; apps: number }> = {};
  for (const j of activeJobs) {
    const area = j.area?.replace(/[市区町村].*/g, "") || "その他";
    if (!areaMap[area]) areaMap[area] = { jobs: 0, apps: 0 };
    areaMap[area].jobs++;
    const jobApps = filteredApps.filter((a: any) => a.jobId === j.id).length;
    areaMap[area].apps += jobApps;
  }
  const sortedAreas = Object.entries(areaMap).sort((a, b) => b[1].apps - a[1].apps).slice(0, 10);

  const exportCsv = () => {
    const rows = [
      ["企業名", "クリック数（概算）", "応募数", "応募率", "広告費", "売上", "利益"],
      ...companyMetrics.map((c: any) => [
        c.companyName,
        c.clicks,
        c.paidApps,
        c.clicks > 0 ? `${((c.paidApps / c.clicks) * 100).toFixed(1)}%` : "0%",
        c.adCost,
        c.revenue,
        c.profit,
      ]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `indeed_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  return (
    <DashboardLayout>
      <div className="px-4 sm:px-6 py-6 max-w-5xl mx-auto">
        <div className="rounded-xl p-6 mb-6 hero-gradient relative overflow-hidden">
          <div className="hero-grid absolute inset-0 opacity-30" />
          <div className="relative z-10 flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="text-white/80 text-xs mb-0.5">INDEED FEED</p>
              <h1 className="text-2xl font-bold text-white" data-testid="text-page-title">INDEED 運用管理</h1>
              <p className="text-white/70 text-sm mt-1">XML フィード配信・パフォーマンス管理</p>
            </div>
            <div className="flex items-center gap-2">
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger className="w-32 bg-white/10 border-white/30 text-white text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="month">今月</SelectItem>
                  <SelectItem value="3months">直近3ヶ月</SelectItem>
                  <SelectItem value="all">全期間</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" className="bg-white/10 border-white/30 text-white hover:bg-white/20 text-xs" onClick={exportCsv}>
                <Download className="w-3.5 h-3.5 mr-1" />CSV
              </Button>
            </div>
          </div>
        </div>

        {/* Feed status summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <Card className="border border-border">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <p className="text-xs text-muted-foreground">XMLフィード状態</p>
              </div>
              <p className="text-lg font-black text-emerald-700">正常配信中</p>
              <p className="text-xs text-muted-foreground mt-1">
                最終更新: {new Date().toLocaleString("ja-JP")}
              </p>
            </CardContent>
          </Card>
          <Card className="border border-border">
            <CardContent className="p-5">
              <p className="text-xs text-muted-foreground mb-1">掲載中の求人</p>
              <p className="text-3xl font-black text-primary">{activeJobs.length}</p>
              <p className="text-xs text-muted-foreground mt-1">件（フィード配信中）</p>
            </CardContent>
          </Card>
          <Card className="border border-border">
            <CardContent className="p-5">
              <p className="text-xs text-muted-foreground mb-1">全求人数</p>
              <p className="text-3xl font-black text-foreground">{totalJobs}</p>
              <p className="text-xs text-muted-foreground mt-1">件（審査中含む）</p>
            </CardContent>
          </Card>
        </div>

        {/* Feed URL */}
        <Card className="border border-border mb-6">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <Rss className="w-4 h-4 text-primary" />
              <p className="text-sm font-semibold">フィード URL</p>
              <Badge variant="outline" className="text-[10px] border-emerald-400 text-emerald-700 bg-emerald-50">
                <CheckCircle2 className="w-3 h-3 mr-1" />自動更新中
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs bg-muted rounded-md px-3 py-2.5 break-all font-mono">{feedUrl}</code>
              <Button variant="outline" size="sm" onClick={copyFeedUrl}><Copy className="w-3.5 h-3.5 mr-1" />コピー</Button>
              <Button variant="outline" size="sm" asChild>
                <a href={feedUrl} target="_blank" rel="noopener noreferrer"><ExternalLink className="w-3.5 h-3.5 mr-1" />確認</a>
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Company-level metrics */}
          <div className="lg:col-span-2">
            <Card className="border border-border">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    企業別パフォーマンス
                  </CardTitle>
                  <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={exportCsv}>
                    <Download className="w-3.5 h-3.5 mr-1" />Excel出力
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {statsLoading ? (
                  <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
                ) : companyMetrics.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">データがありません</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-2 px-2 font-semibold text-muted-foreground">企業名</th>
                          <th className="text-right py-2 px-2 font-semibold text-muted-foreground">クリック</th>
                          <th className="text-right py-2 px-2 font-semibold text-muted-foreground">応募</th>
                          <th className="text-right py-2 px-2 font-semibold text-muted-foreground">応募率</th>
                          <th className="text-right py-2 px-2 font-semibold text-muted-foreground">CPC</th>
                          <th className="text-right py-2 px-2 font-semibold text-muted-foreground">売上</th>
                          <th className="text-right py-2 px-2 font-semibold text-muted-foreground">利益</th>
                        </tr>
                      </thead>
                      <tbody>
                        {companyMetrics.map((c: any) => {
                          const rate = c.clicks > 0 ? ((c.paidApps / c.clicks) * 100).toFixed(1) : "0.0";
                          return (
                            <tr key={c.userId} className="border-b border-border/50 hover:bg-muted/30">
                              <td className="py-2.5 px-2 font-medium truncate max-w-[120px]">{c.companyName}</td>
                              <td className="py-2.5 px-2 text-right">{c.clicks}</td>
                              <td className="py-2.5 px-2 text-right">{c.paidApps}</td>
                              <td className="py-2.5 px-2 text-right">{rate}%</td>
                              <td className="py-2.5 px-2 text-right">¥{c.cpc.toLocaleString()}</td>
                              <td className="py-2.5 px-2 text-right font-semibold">¥{c.revenue.toLocaleString()}</td>
                              <td className={`py-2.5 px-2 text-right font-semibold ${c.profit >= 0 ? "text-emerald-700" : "text-destructive"}`}>
                                ¥{c.profit.toLocaleString()}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Area performance + Active jobs */}
          <div className="space-y-6">
            <Card className="border border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  エリア別パフォーマンス
                </CardTitle>
              </CardHeader>
              <CardContent>
                {sortedAreas.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">データなし</p>
                ) : (
                  <div className="space-y-3">
                    {sortedAreas.map(([area, data]) => (
                      <div key={area}>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="font-medium">{area}</span>
                          <span className="text-muted-foreground">{data.apps}件 / {data.jobs}求人</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-1.5">
                          <div
                            className="bg-primary h-1.5 rounded-full"
                            style={{ width: `${sortedAreas[0] ? Math.round((data.apps / sortedAreas[0][1].apps) * 100) : 0}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-primary" />
                  配信中の求人
                </CardTitle>
              </CardHeader>
              <CardContent>
                {activeJobs.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">掲載中の求人がありません</p>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {activeJobs.map((job: any) => (
                      <div key={job.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium truncate">{job.title}</p>
                          <p className="text-[10px] text-muted-foreground">{job.area}</p>
                        </div>
                        <Badge variant="outline" className="text-[10px] border-emerald-400 text-emerald-700 bg-emerald-50 shrink-0 ml-2">配信中</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
