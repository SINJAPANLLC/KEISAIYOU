import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import {
  CreditCard, CheckCircle2, AlertCircle, Calendar, RefreshCw, Settings, Banknote, Loader2, ShieldCheck,
} from "lucide-react";
import DashboardLayout from "@/components/dashboard-layout";

const MONTHLY_LIMITS = [
  { label: "3万円（約9応募/月）", value: 30000 },
  { label: "5万円（約15応募/月）", value: 50000 },
  { label: "10万円（約30応募/月）", value: 100000 },
  { label: "20万円（約60応募/月）", value: 200000 },
  { label: "上限なし", value: 9999999 },
];

declare global {
  interface Window {
    Square?: any;
  }
}

function useSquareScript(src: string | null) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!src) return;
    if (window.Square) { setLoaded(true); return; }
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      existing.addEventListener("load", () => setLoaded(true));
      existing.addEventListener("error", () => setError(true));
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = () => setLoaded(true);
    script.onerror = () => setError(true);
    document.head.appendChild(script);
  }, [src]);

  return { loaded, error };
}

interface CardDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  isChanging?: boolean;
}

function CardRegistrationDialog({ open, onOpenChange, isChanging }: CardDialogProps) {
  const { toast } = useToast();
  const cardRef = useRef<any>(null);
  const paymentsRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [mounting, setMounting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [mountError, setMountError] = useState<string | null>(null);

  const { data: squareConfig } = useQuery<{ applicationId: string; locationId: string; environment: string }>({
    queryKey: ["/api/square/config"],
    queryFn: () => apiRequest("GET", "/api/square/config").then((r) => r.json()),
  });

  const scriptSrc = squareConfig
    ? squareConfig.environment === "production"
      ? "https://web.squarecdn.com/v1/square.js"
      : "https://sandbox.web.squarecdn.com/v1/square.js"
    : null;

  const { loaded: scriptLoaded, error: scriptError } = useSquareScript(scriptSrc);

  const mountCard = useCallback(async () => {
    if (!squareConfig?.applicationId || !squareConfig?.locationId) return;
    if (!window.Square) return;
    if (!containerRef.current) return;
    if (cardRef.current) return;

    setMounting(true);
    setMountError(null);
    try {
      const payments = window.Square.payments(squareConfig.applicationId, squareConfig.locationId);
      paymentsRef.current = payments;
      const card = await payments.card({
        style: {
          input: { fontSize: "14px", color: "#1a1a1a", fontFamily: "system-ui, sans-serif" },
          "input::placeholder": { color: "#9ca3af" },
          ".input-container": { borderRadius: "8px", borderColor: "#e5e7eb" },
          ".input-container.is-focus": { borderColor: "hsl(20,85%,56%)" },
          ".input-container.is-error": { borderColor: "#ef4444" },
        },
      });
      await card.attach(containerRef.current);
      cardRef.current = card;
    } catch (e: any) {
      setMountError(e.message || "カードフォームの読み込みに失敗しました");
    } finally {
      setMounting(false);
    }
  }, [squareConfig]);

  useEffect(() => {
    if (open && scriptLoaded && squareConfig) {
      setTimeout(mountCard, 100);
    }
    if (!open) {
      if (cardRef.current) {
        try { cardRef.current.destroy(); } catch {}
        cardRef.current = null;
      }
      paymentsRef.current = null;
      setMountError(null);
      setSubmitting(false);
    }
  }, [open, scriptLoaded, squareConfig, mountCard]);

  const handleSubmit = async () => {
    if (!cardRef.current) return;
    setSubmitting(true);
    try {
      const result = await cardRef.current.tokenize();
      if (result.status !== "OK") {
        const msg = result.errors?.[0]?.message || "カード情報を確認してください";
        toast({ title: "入力エラー", description: msg, variant: "destructive" });
        setSubmitting(false);
        return;
      }
      const sourceId = result.token;
      const res = await apiRequest("POST", "/api/square/save-card", { sourceId });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "保存に失敗しました");

      queryClient.invalidateQueries({ queryKey: ["/api/square/status"] });
      toast({ title: "カードを登録しました", description: "応募時に自動的に課金されます" });
      onOpenChange(false);
    } catch (e: any) {
      toast({ title: "エラー", description: e.message || "カード登録に失敗しました", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const isLoading = !scriptLoaded && !scriptError;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-primary" />
            {isChanging ? "カードを変更" : "カードを登録"}
          </DialogTitle>
          <DialogDescription>
            カード情報はSquareの安全なサーバーで管理されます。応募が来た際に自動課金（¥3,300/件）されます。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-1">
          <div>
            <Label className="text-xs text-muted-foreground mb-2 block">カード情報</Label>
            {scriptError ? (
              <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive text-center">
                カードフォームの読み込みに失敗しました。ページを再読み込みしてください。
              </div>
            ) : (
              <div className="relative min-h-[60px]">
                {(isLoading || mounting) && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-lg border border-border bg-muted/30">
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                  </div>
                )}
                {mountError && (
                  <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
                    {mountError}
                  </div>
                )}
                <div
                  ref={containerRef}
                  id="square-card-container"
                  className={`rounded-lg border border-border p-1 transition-opacity ${isLoading || mounting ? "opacity-0" : "opacity-100"}`}
                  style={{ minHeight: "56px" }}
                />
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 rounded-lg bg-muted/40 px-3 py-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <p className="text-xs text-muted-foreground">
              カード番号はKEI SAIYOUには保存されません。Square社のPCI DSS準拠の環境で管理されます。
            </p>
          </div>

          <div className="flex gap-2 pt-1">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              キャンセル
            </Button>
            <Button
              className="flex-1"
              onClick={handleSubmit}
              disabled={submitting || isLoading || mounting || !!mountError || !!scriptError}
            >
              {submitting ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />処理中…</>
              ) : (
                <><CreditCard className="w-4 h-4 mr-2" />{isChanging ? "カードを更新" : "カードを登録"}</>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function Payment() {
  const { toast } = useToast();
  const [limitDialogOpen, setLimitDialogOpen] = useState(false);
  const [cardDialogOpen, setCardDialogOpen] = useState(false);
  const [newLimit, setNewLimit] = useState("30000");

  const { data: billing, isLoading } = useQuery<any>({
    queryKey: ["/api/my/billing"],
    queryFn: () => apiRequest("GET", "/api/my/billing").then((r) => r.json()),
  });

  const { data: squareStatus, refetch: refetchStatus } = useQuery<any>({
    queryKey: ["/api/square/status"],
    queryFn: () => apiRequest("GET", "/api/square/status").then((r) => r.json()),
  });

  const limitMutation = useMutation({
    mutationFn: async (limit: number) => {
      const res = await apiRequest("PATCH", "/api/user/monthly-limit", { monthlyLimit: limit });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/my/billing"] });
      setLimitDialogOpen(false);
      toast({ title: "上限金額を変更しました" });
    },
    onError: () => toast({ title: "変更に失敗しました", variant: "destructive" }),
  });

  const monthlyTotal = billing?.monthlyTotal ?? 0;
  const monthlyLimit = billing?.monthlyLimit ?? 30000;
  const history = billing?.history ?? [];
  const usagePct = monthlyLimit < 9999999 ? Math.min(100, Math.round((monthlyTotal / monthlyLimit) * 100)) : 0;

  const formatDate = (s: string) =>
    new Date(s).toLocaleDateString("ja-JP", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

  return (
    <DashboardLayout>
      <div className="px-4 sm:px-6 py-6 max-w-4xl mx-auto">
        <div className="rounded-xl p-6 mb-6 hero-gradient relative overflow-hidden">
          <div className="hero-grid absolute inset-0 opacity-30" />
          <div className="relative z-10">
            <p className="text-white/80 text-xs mb-0.5">BILLING</p>
            <h1 className="text-2xl font-bold text-white" data-testid="text-page-title">請求・決済</h1>
            <p className="text-white/70 text-sm mt-1">利用状況・カード情報・請求履歴</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Monthly total */}
          <Card className="border border-border">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-2">
                <Banknote className="w-4 h-4 text-primary" />
                <p className="text-xs text-muted-foreground font-medium">今月の請求額</p>
              </div>
              {isLoading ? <Skeleton className="h-8 w-24" /> : (
                <p className="text-3xl font-black text-foreground">¥{monthlyTotal.toLocaleString()}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">（税込）</p>
            </CardContent>
          </Card>

          {/* Monthly limit */}
          <Card className="border border-border">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Settings className="w-4 h-4 text-primary" />
                  <p className="text-xs text-muted-foreground font-medium">月の上限金額</p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 text-xs text-primary px-2"
                  onClick={() => {
                    setNewLimit(String(monthlyLimit));
                    setLimitDialogOpen(true);
                  }}
                >
                  変更
                </Button>
              </div>
              {isLoading ? <Skeleton className="h-8 w-24" /> : (
                <p className="text-3xl font-black text-foreground">
                  {monthlyLimit >= 9999999 ? "上限なし" : `¥${monthlyLimit.toLocaleString()}`}
                  {monthlyLimit < 9999999 && <span className="text-sm font-normal text-muted-foreground ml-1">（税別）</span>}
                </p>
              )}
              {monthlyLimit < 9999999 && (
                <>
                  <div className="w-full bg-muted rounded-full h-1.5 mt-2">
                    <div
                      className={`h-1.5 rounded-full transition-all ${usagePct > 80 ? "bg-destructive" : "bg-primary"}`}
                      style={{ width: `${usagePct}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-xs text-muted-foreground">{usagePct}% 使用</p>
                    <p className="text-xs text-muted-foreground">
                      残り ¥{Math.max(0, monthlyLimit - monthlyTotal).toLocaleString()}（約{Math.floor(Math.max(0, monthlyLimit - monthlyTotal) / 3300)}応募）
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Card info */}
          <Card className="border border-border">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-2">
                <CreditCard className="w-4 h-4 text-primary" />
                <p className="text-xs text-muted-foreground font-medium">カード情報</p>
              </div>
              {squareStatus?.hasCard ? (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <p className="text-sm font-semibold text-emerald-700">登録済み</p>
                  </div>
                  <p className="text-xs text-muted-foreground">カード情報は安全に保管されています</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3 text-xs"
                    onClick={() => setCardDialogOpen(true)}
                  >
                    カードを変更
                  </Button>
                </div>
              ) : (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    <p className="text-sm font-semibold text-amber-700">未登録</p>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">カードを登録すると応募時に自動課金されます</p>
                  <Button
                    size="sm"
                    className="text-xs"
                    onClick={() => setCardDialogOpen(true)}
                  >
                    <CreditCard className="w-3.5 h-3.5 mr-1.5" />
                    カードを登録
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Billing history */}
        <Card className="border border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              請求履歴
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : history.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-10">請求履歴がありません</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground">応募者名</th>
                      <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground">求人名</th>
                      <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground">課金日時</th>
                      <th className="text-right py-2 px-3 text-xs font-semibold text-muted-foreground">金額</th>
                      <th className="text-center py-2 px-3 text-xs font-semibold text-muted-foreground">ステータス</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((h: any) => (
                      <tr key={h.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                        <td className="py-2.5 px-3 font-medium">{h.applicantName}</td>
                        <td className="py-2.5 px-3 text-muted-foreground text-xs truncate max-w-[150px]">{h.jobTitle}</td>
                        <td className="py-2.5 px-3 text-xs text-muted-foreground whitespace-nowrap">{formatDate(h.chargedAt)}</td>
                        <td className="py-2.5 px-3 text-right font-semibold">¥{h.amount.toLocaleString()}</td>
                        <td className="py-2.5 px-3 text-center">
                          {h.status === "paid" ? (
                            <Badge className="text-[10px] bg-emerald-100 text-emerald-800 border-emerald-300 border">
                              <CheckCircle2 className="w-3 h-3 mr-1" />成功
                            </Badge>
                          ) : h.status === "failed" ? (
                            <div className="flex items-center gap-2 justify-center">
                              <Badge className="text-[10px] bg-destructive/10 text-destructive border-destructive/30 border">
                                <AlertCircle className="w-3 h-3 mr-1" />失敗
                              </Badge>
                              <Button size="sm" variant="outline" className="h-6 text-[10px] px-2 text-primary border-primary/40">
                                <RefreshCw className="w-3 h-3 mr-1" />再試行
                              </Button>
                            </div>
                          ) : (
                            <Badge variant="secondary" className="text-[10px]">処理中</Badge>
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

      {/* Limit change dialog */}
      <Dialog open={limitDialogOpen} onOpenChange={setLimitDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>月の上限金額を変更</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <p className="text-sm text-muted-foreground">
              上限に達すると求人が自動停止されます（1応募 = ¥3,000税別）
            </p>
            <div className="space-y-2">
              <Label>上限金額</Label>
              <Select value={newLimit} onValueChange={setNewLimit}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTHLY_LIMITS.map((l) => (
                    <SelectItem key={l.value} value={String(l.value)}>{l.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setLimitDialogOpen(false)}>
                キャンセル
              </Button>
              <Button
                className="flex-1"
                disabled={limitMutation.isPending}
                onClick={() => limitMutation.mutate(Number(newLimit))}
              >
                変更する
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Card registration dialog */}
      <CardRegistrationDialog
        open={cardDialogOpen}
        onOpenChange={setCardDialogOpen}
        isChanging={squareStatus?.hasCard}
      />
    </DashboardLayout>
  );
}
