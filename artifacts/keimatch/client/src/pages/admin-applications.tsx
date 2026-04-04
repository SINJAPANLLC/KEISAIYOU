import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import DashboardLayout from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  ClipboardList, Search, Users, CheckCircle, AlertCircle, RefreshCw,
  Building2, Phone, Mail, MapPin, Briefcase, Calendar, CreditCard, Download,
} from "lucide-react";

export default function AdminApplications() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPayment, setFilterPayment] = useState("all");
  const [selectedApp, setSelectedApp] = useState<any | null>(null);

  const { data: apps = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/applications"],
    queryFn: () => apiRequest("GET", "/api/admin/applications").then((r) => r.json()),
  });

  const retryPayment = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("POST", `/api/admin/applications/${id}/retry-payment`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/applications"] });
      toast({ title: "決済を再試行しました" });
    },
    onError: () => toast({ title: "再試行に失敗しました", variant: "destructive" }),
  });

  const filtered = apps.filter((a: any) => {
    if (filterStatus !== "all" && a.reviewStatus !== filterStatus) return false;
    if (filterPayment !== "all" && a.paymentStatus !== filterPayment) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        (a.name || "").toLowerCase().includes(q) ||
        (a.email || "").toLowerCase().includes(q) ||
        (a.companyName || "").toLowerCase().includes(q) ||
        (a.jobTitle || "").toLowerCase().includes(q)
      );
    }
    return true;
  });

  const totalCount = apps.length;
  const paidCount = apps.filter((a: any) => a.paymentStatus === "paid").length;
  const failedCount = apps.filter((a: any) => a.paymentStatus === "failed").length;
  const totalRevenue = apps.filter((a: any) => a.paymentStatus === "paid").length * 3000;

  const formatDate = (s: string) =>
    new Date(s).toLocaleDateString("ja-JP", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

  const exportCsv = () => {
    const rows = [
      ["応募日", "応募者名", "メール", "電話", "求人名", "企業名", "課金ステータス", "金額"],
      ...filtered.map((a: any) => [
        formatDate(a.createdAt),
        a.name,
        a.email,
        a.phone,
        a.jobTitle,
        a.companyName,
        a.paymentStatus === "paid" ? "成功" : a.paymentStatus === "failed" ? "失敗" : "未処理",
        a.paymentStatus === "paid" ? 3000 : 0,
      ]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `applications_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  return (
    <DashboardLayout>
      <div className="px-4 sm:px-6 py-6 max-w-5xl mx-auto">
        <div className="rounded-xl p-6 mb-6 hero-gradient relative overflow-hidden">
          <div className="hero-grid absolute inset-0 opacity-30" />
          <div className="relative z-10 flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="text-white/80 text-xs mb-0.5">APPLICATIONS</p>
              <h1 className="text-2xl font-bold text-white" data-testid="text-page-title">応募管理</h1>
              <p className="text-white/70 text-sm mt-1">全応募者・課金ステータス管理</p>
            </div>
            <Button
              variant="outline"
              className="bg-white/10 border-white/30 text-white hover:bg-white/20 text-xs"
              onClick={exportCsv}
            >
              <Download className="w-3.5 h-3.5 mr-1" />CSVエクスポート
            </Button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            { label: "総応募数", value: totalCount, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
            { label: "課金成功", value: paidCount, icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-50" },
            { label: "決済失敗", value: failedCount, icon: AlertCircle, color: "text-destructive", bg: "bg-destructive/10", highlight: failedCount > 0 },
            { label: "売上合計", value: `¥${totalRevenue.toLocaleString()}`, icon: CreditCard, color: "text-violet-600", bg: "bg-violet-50" },
          ].map((s) => (
            <Card key={s.label} className={`border ${(s as any).highlight ? "border-destructive/30" : "border-border"}`}>
              <CardContent className="p-4">
                <div className={`w-7 h-7 rounded-lg ${s.bg} flex items-center justify-center mb-2`}>
                  <s.icon className={`w-3.5 h-3.5 ${s.color}`} />
                </div>
                <p className="text-xl font-black text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="応募者名・企業名・求人名で検索"
              className="pl-8 text-sm"
            />
          </div>
          <Select value={filterPayment} onValueChange={setFilterPayment}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全ステータス</SelectItem>
              <SelectItem value="paid">課金成功</SelectItem>
              <SelectItem value="failed">決済失敗</SelectItem>
              <SelectItem value="pending">未処理</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全対応状況</SelectItem>
              <SelectItem value="new">新着</SelectItem>
              <SelectItem value="reviewed">確認済み</SelectItem>
              <SelectItem value="rejected">不採用</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Applications table */}
        <Card className="border border-border">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-5 space-y-2">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
            ) : filtered.length === 0 ? (
              <div className="p-12 text-center">
                <ClipboardList className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">応募データがありません</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-border">
                    <tr>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground">応募者名</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground">求人名</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground">掲載企業</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground">応募日</th>
                      <th className="text-center py-3 px-4 text-xs font-semibold text-muted-foreground">課金</th>
                      <th className="text-center py-3 px-4 text-xs font-semibold text-muted-foreground">対応状況</th>
                      <th className="py-3 px-4" />
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((a: any) => (
                      <tr
                        key={a.id}
                        className="border-b border-border/50 hover:bg-muted/30 transition-colors cursor-pointer"
                        onClick={() => setSelectedApp(a)}
                      >
                        <td className="py-3 px-4 font-medium">{a.name}</td>
                        <td className="py-3 px-4 text-xs text-muted-foreground truncate max-w-[150px]">{a.jobTitle}</td>
                        <td className="py-3 px-4 text-xs text-muted-foreground truncate max-w-[120px]">{a.companyName}</td>
                        <td className="py-3 px-4 text-xs text-muted-foreground whitespace-nowrap">{formatDate(a.createdAt)}</td>
                        <td className="py-3 px-4 text-center">
                          {a.paymentStatus === "paid" ? (
                            <Badge className="text-[10px] bg-emerald-100 text-emerald-800 border-emerald-300 border">¥3,000</Badge>
                          ) : a.paymentStatus === "failed" ? (
                            <Badge className="text-[10px] bg-destructive/10 text-destructive border-destructive/30 border">失敗</Badge>
                          ) : (
                            <Badge variant="secondary" className="text-[10px]">未処理</Badge>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Badge variant="outline" className={`text-[10px] ${a.reviewStatus === "new" ? "border-blue-400 text-blue-700 bg-blue-50" : a.reviewStatus === "reviewed" ? "border-emerald-400 text-emerald-700 bg-emerald-50" : "border-muted-foreground/30 text-muted-foreground"}`}>
                            {a.reviewStatus === "new" ? "新着" : a.reviewStatus === "reviewed" ? "確認済" : a.reviewStatus === "rejected" ? "不採用" : "新着"}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          {a.paymentStatus === "failed" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-6 text-[10px] px-2 text-primary border-primary/40"
                              onClick={(e) => { e.stopPropagation(); retryPayment.mutate(a.id); }}
                            >
                              <RefreshCw className="w-3 h-3 mr-1" />再試行
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detail dialog */}
      {selectedApp && (
        <Dialog open onOpenChange={() => setSelectedApp(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>応募詳細</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 pt-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">応募者名</p>
                  <p className="text-sm font-semibold">{selectedApp.name}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">応募日</p>
                  <p className="text-sm">{formatDate(selectedApp.createdAt)}</p>
                </div>
              </div>
              {selectedApp.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                  {selectedApp.email}
                </div>
              )}
              {selectedApp.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                  {selectedApp.phone}
                </div>
              )}
              {selectedApp.address && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                  {selectedApp.address}
                </div>
              )}
              <hr className="border-border" />
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">求人名</p>
                <p className="text-sm font-semibold">{selectedApp.jobTitle}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">掲載企業</p>
                <p className="text-sm">{selectedApp.companyName}</p>
              </div>
              {selectedApp.message && (
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">メッセージ</p>
                  <p className="text-sm bg-muted/30 rounded p-2 whitespace-pre-wrap">{selectedApp.message}</p>
                </div>
              )}
              <hr className="border-border" />
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">課金ステータス</p>
                {selectedApp.paymentStatus === "paid" ? (
                  <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 border">課金済 ¥3,000</Badge>
                ) : selectedApp.paymentStatus === "failed" ? (
                  <div className="flex items-center gap-2">
                    <Badge className="bg-destructive/10 text-destructive border-destructive/30 border">決済失敗</Badge>
                    <Button size="sm" variant="outline" className="h-6 text-xs px-2" onClick={() => retryPayment.mutate(selectedApp.id)}>
                      <RefreshCw className="w-3 h-3 mr-1" />再試行
                    </Button>
                  </div>
                ) : (
                  <Badge variant="secondary">未処理</Badge>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </DashboardLayout>
  );
}
