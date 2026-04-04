import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import DashboardLayout from "@/components/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  Search, Users, Phone, Mail, MapPin, FileText, Calendar, CheckCircle2, Clock, Lock, AlertCircle,
} from "lucide-react";

type Application = {
  id: string;
  jobId: string;
  jobTitle?: string;
  name: string;
  phone: string;
  email: string;
  licenseType: string;
  hasBlackNumber: boolean;
  availableAreas: string;
  message: string;
  paymentStatus: string;
  viewable: boolean;
  reviewStatus: string;
  createdAt: string;
};

const REVIEW_STATUS: Record<string, { label: string; className: string }> = {
  new: { label: "新着", className: "border-primary text-primary bg-primary/10" },
  reviewed: { label: "確認済み", className: "border-emerald-400 text-emerald-700 bg-emerald-50" },
  rejected: { label: "不採用", className: "border-muted-foreground/40 text-muted-foreground bg-muted/50" },
};

export default function Applications() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState<Application | null>(null);
  const { toast } = useToast();

  const { data: applications = [], isLoading } = useQuery<Application[]>({
    queryKey: ["/api/my/applications"],
    queryFn: () => apiRequest("GET", "/api/my/applications").then((r) => r.json()),
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await apiRequest("PATCH", `/api/applications/${id}/review-status`, { status });
      return res.json();
    },
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["/api/my/applications"] });
      if (selected && selected.id === updated.id) {
        setSelected({ ...selected, reviewStatus: updated.reviewStatus });
      }
      toast({ title: "ステータスを更新しました" });
    },
    onError: () => toast({ title: "更新に失敗しました", variant: "destructive" }),
  });

  const filtered = applications.filter((a) => {
    const q = search.toLowerCase();
    const matchSearch = !search || (
      a.name?.toLowerCase().includes(q) ||
      a.email?.toLowerCase().includes(q) ||
      a.phone?.includes(q) ||
      a.jobTitle?.toLowerCase().includes(q)
    );
    const matchStatus = statusFilter === "all" || a.reviewStatus === statusFilter;
    return matchSearch && matchStatus;
  });

  const formatDate = (s: string) =>
    new Date(s).toLocaleDateString("ja-JP", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

  return (
    <DashboardLayout>
      <div className="px-4 sm:px-6 py-6 max-w-5xl mx-auto">
        <div className="rounded-xl p-6 mb-6 hero-gradient relative overflow-hidden">
          <div className="hero-grid absolute inset-0 opacity-30" />
          <div className="relative z-10">
            <p className="text-white/80 text-xs mb-0.5">APPLICANTS</p>
            <h1 className="text-2xl font-bold text-white" data-testid="text-page-title">応募者一覧</h1>
            <p className="text-white/70 text-sm mt-1">全求人への応募者 {applications.length}件</p>
          </div>
        </div>

        {/* Filter bar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="氏名・メール・電話・求人名で検索..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
              data-testid="input-search"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全ステータス</SelectItem>
              <SelectItem value="new">新着</SelectItem>
              <SelectItem value="reviewed">確認済み</SelectItem>
              <SelectItem value="rejected">不採用</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Card key={i}><CardContent className="p-4"><Skeleton className="h-12 w-full" /></CardContent></Card>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="p-16 text-center">
              <Users className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground font-medium">
                {search || statusFilter !== "all" ? "該当する応募者がいません" : "まだ応募がありません"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2" data-testid="list-applications">
            {filtered.map((app) => {
              const rs = REVIEW_STATUS[app.reviewStatus] || REVIEW_STATUS.new;
              const isLocked = !app.viewable && app.paymentStatus !== "paid";
              return (
                <Card
                  key={app.id}
                  className="border border-border hover:border-primary/40 hover:shadow-sm transition-all cursor-pointer"
                  onClick={() => setSelected(app)}
                >
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${isLocked ? "bg-muted" : "bg-primary/10"}`}>
                      {isLocked ? <Lock className="w-4 h-4 text-muted-foreground" /> : <Users className="w-4 h-4 text-primary" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-foreground">
                          {isLocked ? "※ 決済失敗 — 閲覧ロック中" : app.name}
                        </p>
                        <Badge variant="outline" className={`text-[10px] shrink-0 ${rs.className}`}>
                          {rs.label}
                        </Badge>
                        {app.paymentStatus === "paid" && (
                          <Badge variant="outline" className="text-[10px] shrink-0 border-emerald-400 text-emerald-700 bg-emerald-50">
                            <CheckCircle2 className="w-3 h-3 mr-1" />課金済
                          </Badge>
                        )}
                        {app.paymentStatus === "failed" && (
                          <Badge variant="outline" className="text-[10px] shrink-0 border-destructive text-destructive bg-destructive/5">
                            <AlertCircle className="w-3 h-3 mr-1" />決済失敗
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <FileText className="w-3 h-3" />{app.jobTitle || "求人削除済"}
                        </span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="w-3 h-3" />{formatDate(app.createdAt)}
                        </span>
                      </div>
                    </div>
                    {!isLocked && (
                      <div className="hidden sm:flex flex-col items-end text-xs text-muted-foreground gap-1">
                        <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{app.phone}</span>
                        <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{app.email}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Detail Drawer */}
      <Sheet open={!!selected} onOpenChange={(o) => { if (!o) setSelected(null); }}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          {selected && (() => {
            const isLocked = !selected.viewable && selected.paymentStatus !== "paid";
            return (
              <>
                <SheetHeader className="mb-6">
                  <SheetTitle className="text-lg">{isLocked ? "閲覧ロック中" : selected.name}</SheetTitle>
                  <p className="text-xs text-muted-foreground">
                    <Calendar className="inline w-3 h-3 mr-1" />{formatDate(selected.createdAt)} 応募
                  </p>
                </SheetHeader>

                {isLocked ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                      <Lock className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-semibold text-foreground">決済に失敗しました</p>
                    <p className="text-xs text-muted-foreground">
                      この応募者の情報は決済完了後に閲覧できます。<br />
                      カード情報を更新してください。
                    </p>
                    <Button variant="outline" onClick={() => { setSelected(null); window.location.href = "/payment"; }}>
                      決済設定へ
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Status change */}
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-xs font-semibold text-muted-foreground mb-2">ステータス変更</p>
                      <div className="flex gap-2 flex-wrap">
                        {[
                          { value: "new", label: "新着" },
                          { value: "reviewed", label: "確認済み" },
                          { value: "rejected", label: "不採用" },
                        ].map((s) => (
                          <Button
                            key={s.value}
                            size="sm"
                            variant={selected.reviewStatus === s.value ? "default" : "outline"}
                            className="text-xs h-7"
                            onClick={() => statusMutation.mutate({ id: selected.id, status: s.value })}
                            disabled={statusMutation.isPending}
                          >
                            {s.label}
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Job */}
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-xs font-semibold text-muted-foreground mb-1">応募求人</p>
                      <p className="text-sm font-medium">{selected.jobTitle || "求人削除済"}</p>
                    </div>

                    {/* Contact */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground mb-1 flex items-center gap-1">
                          <Phone className="w-3 h-3" />電話番号
                        </p>
                        <a href={`tel:${selected.phone}`} className="text-sm text-primary hover:underline">{selected.phone}</a>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground mb-1 flex items-center gap-1">
                          <Mail className="w-3 h-3" />メール
                        </p>
                        <a href={`mailto:${selected.email}`} className="text-sm text-primary hover:underline break-all">{selected.email}</a>
                      </div>
                    </div>

                    {/* Requirements */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground mb-1">免許種別</p>
                        <p className="text-sm">{selected.licenseType || "未記入"}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground mb-1">黒ナンバー</p>
                        <p className="text-sm">{selected.hasBlackNumber ? "あり" : "なし"}</p>
                      </div>
                    </div>

                    {selected.availableAreas && (
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground mb-1 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />稼働可能エリア
                        </p>
                        <p className="text-sm">{selected.availableAreas}</p>
                      </div>
                    )}
                    {selected.message && (
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground mb-1">メッセージ</p>
                        <p className="text-sm whitespace-pre-wrap bg-muted/40 rounded-lg p-3">{selected.message}</p>
                      </div>
                    )}

                    {/* Payment status */}
                    <div className="pt-2 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        課金ステータス: {selected.paymentStatus === "paid" ? "課金済（¥3,000税別）" : selected.paymentStatus === "failed" ? "決済失敗" : "未課金"}
                      </span>
                    </div>
                  </div>
                )}
              </>
            );
          })()}
        </SheetContent>
      </Sheet>
    </DashboardLayout>
  );
}
