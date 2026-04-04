import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import DashboardLayout from "@/components/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Briefcase, Plus, Edit2, Trash2, Pause, MapPin, Banknote, Users, AlertCircle,
} from "lucide-react";

type Job = {
  id: string;
  title: string;
  employmentType: string;
  salary: string;
  area: string;
  description: string;
  requirements: string;
  status: string;
  monthlyLimit: number;
  monthlySpent: number;
  createdAt: string;
  publishedAt?: string;
};

const EMPLOYMENT_TYPES = ["業務委託", "正社員", "契約社員", "パート・アルバイト", "その他"];
const MONTHLY_LIMITS = [
  { label: "3万円（最大10応募/月）", value: "30000" },
  { label: "5万円（最大16応募/月）", value: "50000" },
  { label: "10万円（最大33応募/月）", value: "100000" },
  { label: "20万円（最大66応募/月）", value: "200000" },
  { label: "上限なし", value: "9999999" },
];

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending: { label: "審査中", color: "border-amber-400 text-amber-700 bg-amber-50" },
  active: { label: "掲載中", color: "border-emerald-400 text-emerald-700 bg-emerald-50" },
  paused: { label: "停止中", color: "border-muted-foreground/30 text-muted-foreground" },
  closed: { label: "クローズ", color: "border-muted-foreground/30 text-muted-foreground" },
};

const EMPTY_FORM = {
  title: "",
  employmentType: "",
  salary: "",
  area: "",
  description: "",
  requirements: "",
  monthlyLimit: "30000",
};

export default function Jobs() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Job | null>(null);
  const [appsJobId, setAppsJobId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const { data: jobs = [], isLoading } = useQuery<Job[]>({ queryKey: ["/api/jobs"] });

  const { data: appList = [] } = useQuery<any[]>({
    queryKey: ["/api/jobs", appsJobId, "applications"],
    queryFn: () =>
      appsJobId
        ? apiRequest("GET", `/api/jobs/${appsJobId}/applications`).then((r) => r.json())
        : [],
    enabled: !!appsJobId,
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof EMPTY_FORM) =>
      apiRequest("POST", "/api/jobs", data).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      setOpen(false);
      toast({ title: "求人を申請しました", description: "管理者が審査後に掲載されます" });
    },
    onError: (e: any) => toast({ variant: "destructive", title: "エラー", description: e.message }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      apiRequest("PUT", `/api/jobs/${id}`, data).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      setOpen(false);
      setEditing(null);
      toast({ title: "求人を更新しました" });
    },
    onError: (e: any) => toast({ variant: "destructive", title: "エラー", description: e.message }),
  });

  const pauseMutation = useMutation({
    mutationFn: (id: string) => apiRequest("PUT", `/api/jobs/${id}`, { status: "paused" }).then((r) => r.json()),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/jobs"] }); toast({ title: "求人を停止しました" }); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/jobs/${id}`).then((r) => r.json()),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/jobs"] }); toast({ title: "求人を削除しました" }); },
  });

  const openCreate = () => { setEditing(null); setForm(EMPTY_FORM); setOpen(true); };
  const openEdit = (job: Job) => {
    setEditing(job);
    setForm({
      title: job.title,
      employmentType: job.employmentType,
      salary: job.salary,
      area: job.area,
      description: job.description,
      requirements: job.requirements || "",
      monthlyLimit: String(job.monthlyLimit),
    });
    setOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.employmentType || !form.salary || !form.area || !form.description) {
      toast({ variant: "destructive", title: "必須項目を入力してください" });
      return;
    }
    if (editing) {
      updateMutation.mutate({ id: editing.id, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const up = (k: keyof typeof EMPTY_FORM, v: string) => setForm((p) => ({ ...p, [k]: v }));

  return (
    <DashboardLayout>
      <div className="px-4 sm:px-6 py-6 max-w-5xl mx-auto">
        {/* Hero banner */}
        <div className="rounded-xl p-6 mb-6 hero-gradient relative overflow-hidden">
          <div className="hero-grid absolute inset-0 opacity-30" />
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <p className="text-white/80 text-xs mb-0.5">JOBS</p>
              <h1 className="text-2xl font-bold text-white" data-testid="text-page-title">求人管理</h1>
              <p className="text-white/70 text-sm mt-1">掲載申請・応募者確認・上限設定</p>
            </div>
            <Button
              onClick={openCreate}
              className="bg-white text-primary hover:bg-white/90 shrink-0"
              data-testid="button-create-job"
            >
              <Plus className="w-4 h-4 mr-1" />新規作成
            </Button>
          </div>
        </div>

        {/* Billing note */}
        <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 mb-6 text-xs text-amber-800">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <p>応募通知：¥3,000 / 件（税込）。月の上限金額に達すると掲載が自動停止されます。</p>
        </div>

        {/* Job list */}
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}><CardContent className="p-4"><Skeleton className="h-16 w-full" /></CardContent></Card>
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <Card>
            <CardContent className="p-16 flex flex-col items-center text-center">
              <Briefcase className="w-10 h-10 text-muted-foreground/30 mb-3" />
              <p className="font-semibold text-foreground mb-1" data-testid="text-empty-state">
                求人がまだありません
              </p>
              <p className="text-sm text-muted-foreground mb-4">「新規作成」から求人を登録してください</p>
              <Button onClick={openCreate}>
                <Plus className="w-4 h-4 mr-1" />最初の求人を作成
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3" data-testid="list-jobs">
            {jobs.map((job) => {
              const s = STATUS_MAP[job.status] || { label: job.status, color: "" };
              return (
                <Card key={job.id} className="border border-border hover:shadow-sm transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Briefcase className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <p className="font-semibold text-foreground">{job.title}</p>
                          <Badge variant="outline" className={`text-[10px] shrink-0 ${s.color}`}>{s.label}</Badge>
                        </div>
                        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><Briefcase className="w-3 h-3" />{job.employmentType}</span>
                          <span className="flex items-center gap-1"><Banknote className="w-3 h-3" />{job.salary}</span>
                          <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{job.area}</span>
                        </div>
                        {job.status === "active" && (
                          <div className="mt-2 flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary rounded-full transition-all"
                                style={{ width: `${Math.min(100, (job.monthlySpent / job.monthlyLimit) * 100)}%` }}
                              />
                            </div>
                            <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                              ¥{job.monthlySpent.toLocaleString()} / ¥{job.monthlyLimit >= 9999999 ? "∞" : job.monthlyLimit.toLocaleString()}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setAppsJobId(appsJobId === job.id ? null : job.id)}
                          title="応募者を見る"
                        >
                          <Users className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(job)} title="編集">
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        {job.status === "active" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-amber-600"
                            onClick={() => pauseMutation.mutate(job.id)}
                            title="停止"
                          >
                            <Pause className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => { if (confirm("この求人を削除しますか？")) deleteMutation.mutate(job.id); }}
                          title="削除"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Applicants drawer */}
                    {appsJobId === job.id && (
                      <div className="mt-4 border-t pt-4">
                        <p className="text-xs font-semibold text-muted-foreground mb-3">応募者一覧</p>
                        {appList.length === 0 ? (
                          <p className="text-xs text-muted-foreground">まだ応募がありません</p>
                        ) : (
                          <div className="space-y-2">
                            {appList.map((a: any) => (
                              <div
                                key={a.id}
                                className={`rounded-lg p-3 text-xs ${a.viewable ? "bg-muted/40" : "bg-red-50 border border-red-200"}`}
                              >
                                {a.viewable ? (
                                  <div>
                                    <p className="font-semibold">{a.name}</p>
                                    <p className="text-muted-foreground">{a.phone} / {a.email}</p>
                                    {a.licenseType && <p className="mt-1">免許：{a.licenseType}　黒ナンバー：{a.hasBlackNumber ? "あり" : "なし"}</p>}
                                    {a.availableAreas && <p>稼働エリア：{a.availableAreas}</p>}
                                    {a.message && <p className="mt-1 text-muted-foreground">{a.message}</p>}
                                  </div>
                                ) : (
                                  <p className="text-red-700 font-medium">
                                    決済失敗 — 応募者情報は非表示です。設定画面からカード情報をご確認ください。
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditing(null); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "求人を編集" : "求人を新規作成"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>求人タイトル <span className="text-destructive">*</span></Label>
              <Input
                value={form.title}
                onChange={(e) => up("title", e.target.value)}
                placeholder="例: 軽貨物ドライバー（神奈川エリア）"
                required
                data-testid="input-job-title"
              />
            </div>
            <div className="space-y-2">
              <Label>雇用形態 <span className="text-destructive">*</span></Label>
              <Select value={form.employmentType} onValueChange={(v) => up("employmentType", v)} required>
                <SelectTrigger data-testid="select-employment-type">
                  <SelectValue placeholder="選択してください" />
                </SelectTrigger>
                <SelectContent>
                  {EMPLOYMENT_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>給与 <span className="text-destructive">*</span></Label>
              <Input
                value={form.salary}
                onChange={(e) => up("salary", e.target.value)}
                placeholder="例: 月収30万〜50万円（歩合制）"
                required
                data-testid="input-job-salary"
              />
            </div>
            <div className="space-y-2">
              <Label>勤務エリア <span className="text-destructive">*</span></Label>
              <Input
                value={form.area}
                onChange={(e) => up("area", e.target.value)}
                placeholder="例: 神奈川県横浜市・川崎市"
                required
                data-testid="input-job-area"
              />
            </div>
            <div className="space-y-2">
              <Label>仕事内容 <span className="text-destructive">*</span></Label>
              <Textarea
                value={form.description}
                onChange={(e) => up("description", e.target.value)}
                placeholder="仕事内容を詳しく入力してください..."
                rows={5}
                required
                data-testid="textarea-job-description"
              />
            </div>
            <div className="space-y-2">
              <Label>応募条件</Label>
              <Textarea
                value={form.requirements}
                onChange={(e) => up("requirements", e.target.value)}
                placeholder="例: 普通自動車免許（AT限定可）・黒ナンバー取得者優遇"
                rows={3}
                data-testid="textarea-job-requirements"
              />
            </div>
            <div className="space-y-2">
              <Label>月の上限金額</Label>
              <Select value={form.monthlyLimit} onValueChange={(v) => up("monthlyLimit", v)}>
                <SelectTrigger data-testid="select-monthly-limit"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MONTHLY_LIMITS.map((l) => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">上限到達で掲載が自動停止されます（1応募 = ¥3,000）</p>
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setOpen(false)}>
                キャンセル
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={createMutation.isPending || updateMutation.isPending}
                data-testid="button-submit-job"
              >
                {createMutation.isPending || updateMutation.isPending
                  ? "保存中..."
                  : editing
                  ? "更新する"
                  : "掲載申請する"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
