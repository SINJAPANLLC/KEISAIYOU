import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import DashboardLayout from "@/components/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  Search, Users, Phone, Mail, FileText, Calendar, CheckCircle2, Clock, Lock, AlertCircle,
  MapPin, User, Cake, Briefcase, StickyNote, Save, ExternalLink, RefreshCw, ChevronDown, ChevronUp,
} from "lucide-react";

type Application = {
  id: string;
  jobId: string;
  jobTitle?: string;
  name: string;
  phone: string;
  email: string;
  gender?: string;
  birthDate?: string;
  address?: string;
  workHistory?: string;
  resumeUrl?: string;
  message?: string;
  memo?: string;
  paymentStatus: string;
  viewable: boolean;
  reviewStatus: string;
  createdAt: string;
};

const REVIEW_STATUS: Record<string, { label: string; className: string }> = {
  new:          { label: "新着",   className: "border-primary text-primary bg-primary/10" },
  contacted:    { label: "連絡済", className: "border-blue-400 text-blue-700 bg-blue-50" },
  interviewing: { label: "面接中", className: "border-amber-400 text-amber-700 bg-amber-50" },
  hired:        { label: "採用",   className: "border-emerald-400 text-emerald-700 bg-emerald-50" },
  rejected:     { label: "不採用", className: "border-muted-foreground/40 text-muted-foreground bg-muted/50" },
};

const STATUS_BUTTONS = [
  { value: "new",          label: "新着" },
  { value: "contacted",    label: "連絡済" },
  { value: "interviewing", label: "面接中" },
  { value: "hired",        label: "採用" },
  { value: "rejected",     label: "不採用" },
];

export default function Applications() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState<Application | null>(null);
  const [memoText, setMemoText] = useState("");
  const [refundOpen, setRefundOpen] = useState(false);
  const [refundReason, setRefundReason] = useState("");
  const [refundDetail, setRefundDetail] = useState("");
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

  const memoMutation = useMutation({
    mutationFn: async ({ id, memo }: { id: string; memo: string }) => {
      const res = await apiRequest("PATCH", `/api/applications/${id}/memo`, { memo });
      return res.json();
    },
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["/api/my/applications"] });
      if (selected) setSelected({ ...selected, memo: updated.memo });
      toast({ title: "メモを保存しました" });
    },
    onError: () => toast({ title: "メモの保存に失敗しました", variant: "destructive" }),
  });

  const refundMutation = useMutation({
    mutationFn: async ({ id, reason, detail }: { id: string; reason: string; detail: string }) => {
      const res = await apiRequest("POST", `/api/applications/${id}/refund-request`, { reason, detail });
      return res.json();
    },
    onSuccess: () => {
      setRefundOpen(false);
      setRefundReason("");
      setRefundDetail("");
      toast({ title: "返金申請を送信しました", description: "管理者が確認後、処理いたします。" });
    },
    onError: (e: any) => toast({ title: "申請に失敗しました", description: e.message, variant: "destructive" }),
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

  const openDetail = (app: Application) => {
    setSelected(app);
    setMemoText(app.memo || "");
  };

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

        {/* Speed-to-call notice */}
        <div className="flex items-center gap-2.5 px-4 py-2.5 mb-4 rounded-lg bg-amber-50 border border-amber-200 text-amber-800">
          <Phone className="w-4 h-4 shrink-0 text-amber-500" />
          <p className="text-xs font-medium">採用率UPのため、5〜30分以内に電話連絡することを推奨しています。</p>
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
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全ステータス</SelectItem>
              {STATUS_BUTTONS.map((s) => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
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
                  onClick={() => openDetail(app)}
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
                        {app.memo && (
                          <Badge variant="outline" className="text-[10px] shrink-0 border-amber-300 text-amber-700 bg-amber-50">
                            <StickyNote className="w-3 h-3 mr-1" />メモあり
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
                      <p className="text-xs font-semibold text-muted-foreground mb-2">ステータス</p>
                      <div className="flex gap-1.5 flex-wrap">
                        {STATUS_BUTTONS.map((s) => (
                          <Button
                            key={s.value}
                            size="sm"
                            variant={selected.reviewStatus === s.value ? "default" : "outline"}
                            className="text-xs h-7 px-2.5"
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
                      <p className="text-xs font-semibold text-muted-foreground mb-1 flex items-center gap-1">
                        <Briefcase className="w-3 h-3" />応募求人
                      </p>
                      <p className="text-sm font-medium">{selected.jobTitle || "求人削除済"}</p>
                    </div>

                    {/* Basic info */}
                    <div className="space-y-3">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">基本情報</p>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                            <Phone className="w-3 h-3" />電話番号
                          </p>
                          <a href={`tel:${selected.phone}`} className="text-sm text-primary hover:underline">{selected.phone}</a>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                            <Mail className="w-3 h-3" />メール
                          </p>
                          <a href={`mailto:${selected.email}`} className="text-sm text-primary hover:underline break-all">{selected.email}</a>
                        </div>
                      </div>

                      {(selected.gender || selected.birthDate) && (
                        <div className="grid grid-cols-2 gap-3">
                          {selected.gender && (
                            <div>
                              <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                                <User className="w-3 h-3" />性別
                              </p>
                              <p className="text-sm">{selected.gender}</p>
                            </div>
                          )}
                          {selected.birthDate && (
                            <div>
                              <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                                <Cake className="w-3 h-3" />生年月日
                              </p>
                              <p className="text-sm">{selected.birthDate}</p>
                            </div>
                          )}
                        </div>
                      )}

                      {selected.address && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                            <MapPin className="w-3 h-3" />住所
                          </p>
                          <p className="text-sm">{selected.address}</p>
                        </div>
                      )}
                    </div>

                    {/* Work history */}
                    {selected.workHistory && (
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground mb-1 flex items-center gap-1">
                          <Briefcase className="w-3 h-3" />職歴
                        </p>
                        <p className="text-sm whitespace-pre-wrap bg-muted/40 rounded-lg p-3">{selected.workHistory}</p>
                      </div>
                    )}

                    {/* Resume */}
                    {selected.resumeUrl && (
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground mb-1 flex items-center gap-1">
                          <FileText className="w-3 h-3" />履歴書
                        </p>
                        <a
                          href={selected.resumeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline flex items-center gap-1"
                        >
                          <ExternalLink className="w-3 h-3" />履歴書を確認する
                        </a>
                      </div>
                    )}

                    {/* Message */}
                    {selected.message && (
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground mb-1">メッセージ</p>
                        <p className="text-sm whitespace-pre-wrap bg-muted/40 rounded-lg p-3">{selected.message}</p>
                      </div>
                    )}

                    {/* Memo */}
                    <div className="border-t pt-4">
                      <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
                        <StickyNote className="w-3 h-3" />社内メモ
                      </p>
                      <Textarea
                        placeholder="この応募者に関するメモを記入..."
                        value={memoText}
                        onChange={(e) => setMemoText(e.target.value)}
                        className="text-sm min-h-[80px] resize-none"
                      />
                      <Button
                        size="sm"
                        className="mt-2 text-xs"
                        onClick={() => memoMutation.mutate({ id: selected.id, memo: memoText })}
                        disabled={memoMutation.isPending || memoText === (selected.memo || "")}
                      >
                        <Save className="w-3 h-3 mr-1" />
                        {memoMutation.isPending ? "保存中..." : "メモを保存"}
                      </Button>
                    </div>

                    {/* Payment status */}
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        課金ステータス: {selected.paymentStatus === "paid" ? "課金済（¥3,000税別）" : selected.paymentStatus === "failed" ? "決済失敗" : "未課金"}
                      </span>
                    </div>

                    {/* Refund request */}
                    {selected.paymentStatus === "paid" && (
                      <div className="border-t pt-4">
                        <button
                          className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors w-full"
                          onClick={() => setRefundOpen((o) => !o)}
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>返金申請（重複・悪意ある応募など）</span>
                          {refundOpen ? <ChevronUp className="w-3 h-3 ml-auto" /> : <ChevronDown className="w-3 h-3 ml-auto" />}
                        </button>
                        {refundOpen && (
                          <div className="mt-3 space-y-3 p-3 rounded-lg bg-muted/40 border">
                            <div>
                              <p className="text-xs font-semibold text-muted-foreground mb-1.5">申請理由</p>
                              <Select value={refundReason} onValueChange={setRefundReason}>
                                <SelectTrigger className="h-8 text-xs">
                                  <SelectValue placeholder="理由を選択..." />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="重複応募">重複応募（同一人物）</SelectItem>

                                  <SelectItem value="スパム・悪意のある応募">スパム・悪意のある応募</SelectItem>
                                  <SelectItem value="虚偽の情報">虚偽の情報</SelectItem>
                                  <SelectItem value="その他">その他</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <Textarea
                              placeholder="詳細（任意）..."
                              value={refundDetail}
                              onChange={(e) => setRefundDetail(e.target.value)}
                              className="text-xs min-h-[60px] resize-none"
                            />
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-full text-xs border-destructive text-destructive hover:bg-destructive/5"
                              disabled={!refundReason || refundMutation.isPending}
                              onClick={() => refundMutation.mutate({ id: selected.id, reason: refundReason, detail: refundDetail })}
                            >
                              <RefreshCw className="w-3 h-3 mr-1.5" />
                              {refundMutation.isPending ? "送信中..." : "返金申請を送信"}
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
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
