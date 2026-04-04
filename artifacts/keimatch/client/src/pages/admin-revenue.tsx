import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import DashboardLayout from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart3, TrendingUp, Download, DollarSign, Minus, Percent,
  ArrowUpDown, ChevronDown, ChevronUp,
} from "lucide-react";

function SimpleBarChart({ data }: { data: { month: string; revenue: number }[] }) {
  const max = Math.max(...data.map((d) => d.revenue), 1);
  return (
    <div className="flex items-end gap-2 h-32">
      {data.map((d) => (
        <div key={d.month} className="flex-1 flex flex-col items-center gap-1">
          <div className="text-[9px] text-muted-foreground">¥{(d.revenue / 1000).toFixed(0)}k</div>
          <div
            className="w-full bg-primary/80 rounded-t transition-all"
            style={{ height: `${Math.max(4, (d.revenue / max) * 100)}px` }}
          />
          <div className="text-[9px] text-muted-foreground whitespace-nowrap">{d.month.slice(5)}</div>
        </div>
      ))}
    </div>
  );
}

export default function AdminRevenue() {
  const [sortField, setSortField] = useState<"revenue" | "paidApps">("revenue");
  const [sortDir, setSortDir] = useState<"desc" | "asc">("desc");

  const { data: stats } = useQuery<any>({
    queryKey: ["/api/admin/stats"],
  });

  const { data: revenueStats, isLoading } = useQuery<any>({
    queryKey: ["/api/admin/revenue-stats"],
    queryFn: () => apiRequest("GET", "/api/admin/revenue-stats").then((r) => r.json()),
  });

  const totalRevenue = stats?.totalRevenue ?? 0;
  const monthlyRevenue = stats?.monthlyRevenue ?? 0;
  // Assume ad cost is 30% of revenue (CPC estimate)
  const adCost = Math.round(totalRevenue * 0.3);
  const profit = totalRevenue - adCost;
  const profitRate = totalRevenue > 0 ? Math.round((profit / totalRevenue) * 100) : 0;

  // Build last 6 months chart data
  const now = new Date();
  const chartData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const entry = revenueStats?.monthly?.[key];
    return {
      month: key,
      revenue: entry?.revenue ?? 0,
      apps: entry?.apps ?? 0,
    };
  });

  const companies: any[] = (revenueStats?.companies ?? []).slice().sort((a: any, b: any) => {
    const mul = sortDir === "desc" ? -1 : 1;
    return (a[sortField] - b[sortField]) * mul;
  });

  const toggleSort = (field: "revenue" | "paidApps") => {
    if (sortField === field) {
      setSortDir((d) => d === "desc" ? "asc" : "desc");
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  const exportCsv = () => {
    const rows = [
      ["企業名", "売上（円）", "成功応募数", "失敗応募数"],
      ...companies.map((c: any) => [c.companyName, c.revenue, c.paidApps, c.failedApps]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `revenue_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  return (
    <DashboardLayout>
      <div className="px-4 sm:px-6 py-6 max-w-5xl mx-auto">
        <div className="rounded-xl p-6 mb-6 hero-gradient relative overflow-hidden">
          <div className="hero-grid absolute inset-0 opacity-30" />
          <div className="relative z-10 flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="text-white/80 text-xs mb-0.5">REVENUE</p>
              <h1 className="text-2xl font-bold text-white" data-testid="text-page-title">収益管理</h1>
              <p className="text-white/70 text-sm mt-1">売上・広告費・利益の管理</p>
            </div>
            <Button
              variant="outline"
              className="bg-white/10 border-white/30 text-white hover:bg-white/20"
              onClick={exportCsv}
            >
              <Download className="w-4 h-4 mr-1.5" />CSVエクスポート
            </Button>
          </div>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            { label: "累計売上", value: `¥${totalRevenue.toLocaleString()}`, sub: `今月 ¥${monthlyRevenue.toLocaleString()}`, icon: DollarSign, color: "text-emerald-600", bg: "bg-emerald-50" },
            { label: "広告費（CPC概算）", value: `¥${adCost.toLocaleString()}`, sub: "売上の約30%", icon: TrendingUp, color: "text-blue-600", bg: "bg-blue-50" },
            { label: "利益", value: `¥${profit.toLocaleString()}`, sub: "売上－広告費", icon: Minus, color: "text-violet-600", bg: "bg-violet-50" },
            { label: "利益率", value: `${profitRate}%`, sub: "利益÷売上", icon: Percent, color: "text-amber-600", bg: "bg-amber-50" },
          ].map((s) => (
            <Card key={s.label} className="border border-border">
              <CardContent className="p-5">
                <div className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center mb-3`}>
                  <s.icon className={`w-4 h-4 ${s.color}`} />
                </div>
                <p className="text-2xl font-black text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
                <p className="text-[10px] text-muted-foreground/70">{s.sub}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Monthly bar chart */}
        <Card className="border border-border mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" />
              月別売上グラフ（直近6ヶ月）
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-32 w-full" />
            ) : (
              <SimpleBarChart data={chartData} />
            )}
            <div className="grid grid-cols-6 gap-1 mt-2">
              {chartData.map((d) => (
                <div key={d.month} className="text-center text-[9px] text-muted-foreground">
                  {d.apps}件
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Company breakdown */}
        <Card className="border border-border">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">企業別売上一覧</CardTitle>
              <Button variant="ghost" size="sm" onClick={exportCsv} className="text-xs text-muted-foreground">
                <Download className="w-3.5 h-3.5 mr-1" />CSV
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
            ) : companies.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">データがありません</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground">企業名</th>
                      <th
                        className="text-right py-2 px-3 text-xs font-semibold text-muted-foreground cursor-pointer hover:text-foreground"
                        onClick={() => toggleSort("revenue")}
                      >
                        <span className="flex items-center gap-1 justify-end">
                          売上
                          {sortField === "revenue" ? (sortDir === "desc" ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3" />}
                        </span>
                      </th>
                      <th
                        className="text-right py-2 px-3 text-xs font-semibold text-muted-foreground cursor-pointer hover:text-foreground"
                        onClick={() => toggleSort("paidApps")}
                      >
                        <span className="flex items-center gap-1 justify-end">
                          成功応募
                          {sortField === "paidApps" ? (sortDir === "desc" ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3" />}
                        </span>
                      </th>
                      <th className="text-right py-2 px-3 text-xs font-semibold text-muted-foreground">失敗</th>
                      <th className="text-right py-2 px-3 text-xs font-semibold text-muted-foreground">広告費概算</th>
                      <th className="text-right py-2 px-3 text-xs font-semibold text-muted-foreground">利益</th>
                    </tr>
                  </thead>
                  <tbody>
                    {companies.map((c: any) => {
                      const ad = Math.round(c.revenue * 0.3);
                      const prof = c.revenue - ad;
                      return (
                        <tr key={c.userId} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                          <td className="py-2.5 px-3 font-medium truncate max-w-[160px]">{c.companyName}</td>
                          <td className="py-2.5 px-3 text-right font-semibold">¥{c.revenue.toLocaleString()}</td>
                          <td className="py-2.5 px-3 text-right">
                            <Badge className="text-[10px] bg-emerald-100 text-emerald-800 border-emerald-300 border">{c.paidApps}件</Badge>
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            {c.failedApps > 0 ? (
                              <Badge className="text-[10px] bg-destructive/10 text-destructive border-destructive/30 border">{c.failedApps}件</Badge>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-right text-xs text-muted-foreground">¥{ad.toLocaleString()}</td>
                          <td className="py-2.5 px-3 text-right text-xs font-medium text-emerald-700">¥{prof.toLocaleString()}</td>
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
    </DashboardLayout>
  );
}
