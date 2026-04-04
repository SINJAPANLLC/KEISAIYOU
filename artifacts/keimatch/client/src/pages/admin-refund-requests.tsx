import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import DashboardLayout from "@/components/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { RefreshCw, CheckCircle2, XCircle, Clock, Building2, User, Calendar, AlertTriangle } from "lucide-react";

type RefundRequest = {
  id: string;
  applicationId: string;
  companyUserId: string;
  reason: string;
  detail?: string;
  status: string;
  adminNote?: string;
  refundAmount: number;
  createdAt: string;
  resolvedAt?: string;
  applicantName: string;
  companyName: string;
};

const STATUS_MAP: Record<string, { label: string; className: string; icon: React.ElementType }> = {
  pending:  { label: "審査中",   className: "border-amber-400 text-amber-700 bg-amber-50",   icon: Clock },
  approved: { label: "承認済み", className: "border-emerald-400 text-emerald-700 bg-emerald-50", icon: CheckCircle2 },
  rejected: { label: "却下",     className: "border-destructive text-destructive bg-destructive/5", icon: XCircle },
};

export default function AdminRefundRequests() {
  const { toast } = useToast();
  const [selected, setSelected] = useState<RefundRequest | null>(null);
  const [adminNote, setAdminNote] = useState("");

  const { data: requests = [], isLoading } = useQuery<RefundRequest[]>({
    queryKey: ["/api/admin/refund-requests"],
    queryFn: () => apiRequest("GET", "/api/admin/refund-requests").then((r) => r.json()),
  });

  const resolveMutation = useMutation({
    mutationFn: async ({ id, status, note }: { id: string; status: string; note: string }) => {
      const res = await apiRequest("PATCH", `/api/admin/refund-requests/${id}`, { status, adminNote: note });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/refund-requests"] });
      setSelected(null);
      toast({ title: "返金申請を処理しました" });
    },
    onError: () => toast({ title: "処理に失敗しました", variant: "destructive" }),
  });

  const pending = requests.filter((r) => r.status === "pending").length;
  const formatDate = (s: string) =>
    new Date(s).toLocaleDateString("ja-JP", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

  return (
    <DashboardLayout>
      <div className="px-4 sm:px-6 py-6 max-w-4xl mx-auto">
        <div className="rounded-xl p-6 mb-6 hero-gradient relative overflow-hidden">
          <div className="hero-grid absolute inset-0 opacity-30" />
          <div className="relative z-10 flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="text-white/80 text-xs mb-0.5">REFUND REQUESTS</p>
              <h1 className="text-2xl font-bold text-white">返金申請管理</h1>
              <p className="text-white/70 text-sm mt-1">
                {pending > 0 ? `審査待ち ${pending}件` : "審査待ちの申請はありません"}
              </p>
            </div>
            <div className="bg-white/20 rounded-lg px-4 py-2 text-center">
              <p className="text-white/80 text-xs">返金単価</p>
              <p className="text-white font-bold text-lg">¥3,000<span className="text-white/70 text-xs font-normal ml-1">税別</span></p>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Card key={i}><CardContent className="p-4"><Skeleton className="h-14 w-full" /></CardContent></Card>
            ))}
          </div>
        ) : requests.length === 0 ? (
          <Card>
            <CardContent className="p-16 text-center">
              <RefreshCw className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">返金申請はまだありません</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {requests.map((rr) => {
              const s = STATUS_MAP[rr.status] || STATUS_MAP.pending;
              const Icon = s.icon;
              return (
                <Card
                  key={rr.id}
                  className={`border cursor-pointer hover:shadow-sm transition-all ${rr.status === "pending" ? "border-amber-200 bg-amber-50/30" : "border-border"}`}
                  onClick={() => { setSelected(rr); setAdminNote(rr.adminNote || ""); }}
                >
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${rr.status === "pending" ? "bg-amber-100" : "bg-muted"}`}>
                      <Icon className={`w-4 h-4 ${rr.status === "pending" ? "text-amber-600" : "text-muted-foreground"}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <p className="text-sm font-semibold">{rr.applicantName}</p>
                        <Badge variant="outline" className={`text-[10px] ${s.className}`}>{s.label}</Badge>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Building2 className="w-3 h-3" />{rr.companyName}</span>
                        <span className="flex items-center gap-1"><AlertTriangle className="w-3 h-3" />{rr.reason}</span>
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDate(rr.createdAt)}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-primary">¥{rr.refundAmount.toLocaleString()}</p>
                      <p className="text-[10px] text-muted-foreground">税別</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Detail / Action Drawer */}
      <Sheet open={!!selected} onOpenChange={(o) => { if (!o) setSelected(null); }}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          {selected && (
            <>
              <SheetHeader className="mb-6">
                <SheetTitle>返金申請の詳細</SheetTitle>
              </SheetHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><User className="w-3 h-3" />応募者</p>
                    <p className="text-sm font-medium">{selected.applicantName}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Building2 className="w-3 h-3" />企業</p>
                    <p className="text-sm font-medium">{selected.companyName}</p>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                  <p className="text-xs font-semibold text-amber-700 mb-1 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />申請理由
                  </p>
                  <p className="text-sm font-medium text-amber-900">{selected.reason}</p>
                  {selected.detail && (
                    <p className="text-xs text-amber-700 mt-1 whitespace-pre-wrap">{selected.detail}</p>
                  )}
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <p className="text-xs text-muted-foreground">返金金額</p>
                    <p className="text-lg font-bold text-primary">¥{selected.refundAmount.toLocaleString()}<span className="text-xs text-muted-foreground font-normal ml-1">税別</span></p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">申請日時</p>
                    <p className="text-xs">{formatDate(selected.createdAt)}</p>
                  </div>
                </div>

                {selected.status !== "pending" ? (
                  <div className={`p-3 rounded-lg border ${selected.status === "approved" ? "bg-emerald-50 border-emerald-200" : "bg-muted/50 border-border"}`}>
                    <p className="text-xs font-semibold mb-1">
                      {selected.status === "approved" ? "✓ 承認済み" : "✗ 却下済み"}
                      {selected.resolvedAt && <span className="text-muted-foreground font-normal ml-2">{formatDate(selected.resolvedAt)}</span>}
                    </p>
                    {selected.adminNote && <p className="text-sm text-muted-foreground">{selected.adminNote}</p>}
                  </div>
                ) : (
                  <div className="space-y-3 border-t pt-4">
                    <p className="text-xs font-semibold text-muted-foreground">管理者メモ（任意）</p>
                    <Textarea
                      placeholder="却下理由や補足コメントなど..."
                      value={adminNote}
                      onChange={(e) => setAdminNote(e.target.value)}
                      className="text-sm min-h-[80px] resize-none"
                    />
                    <div className="flex gap-2">
                      <Button
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                        disabled={resolveMutation.isPending}
                        onClick={() => resolveMutation.mutate({ id: selected.id, status: "approved", note: adminNote })}
                      >
                        <CheckCircle2 className="w-4 h-4 mr-1.5" />承認・返金処理
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1 border-destructive text-destructive hover:bg-destructive/5"
                        disabled={resolveMutation.isPending}
                        onClick={() => resolveMutation.mutate({ id: selected.id, status: "rejected", note: adminNote })}
                      >
                        <XCircle className="w-4 h-4 mr-1.5" />却下
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </DashboardLayout>
  );
}
