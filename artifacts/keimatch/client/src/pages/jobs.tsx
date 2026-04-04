import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import DashboardLayout from "@/components/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Briefcase, Plus, Edit2, Trash2, Pause, Play, MapPin, Banknote, Users, Calendar } from "lucide-react";

type Job = {
  id: string;
  title: string;
  jobCategory?: string;
  employmentType: string;
  salary: string;
  area: string;
  description: string;
  requirements: string;
  workHours?: string;
  holidays?: string;
  benefits?: string;
  requiresLicense?: boolean;
  requiresBlackNumber?: boolean;
  requiresVehicle?: boolean;
  requiresExperience?: boolean;
  status: string;
  monthlyLimit: number;
  monthlySpent: number;
  createdAt: string;
};

const JOB_CATEGORIES = ["軽貨物ドライバー", "宅配ドライバー", "幹線輸送ドライバー", "EC配送", "フードデリバリー", "企業配送", "その他"];
const EMPLOYMENT_TYPES = ["業務委託", "正社員", "契約社員", "パート・アルバイト"];
const PREFECTURES = [
  "北海道","青森県","岩手県","宮城県","秋田県","山形県","福島県",
  "茨城県","栃木県","群馬県","埼玉県","千葉県","東京都","神奈川県",
  "新潟県","富山県","石川県","福井県","山梨県","長野県","岐阜県",
  "静岡県","愛知県","三重県","滋賀県","京都府","大阪府","兵庫県",
  "奈良県","和歌山県","鳥取県","島根県","岡山県","広島県","山口県",
  "徳島県","香川県","愛媛県","高知県","福岡県","佐賀県","長崎県",
  "熊本県","大分県","宮崎県","鹿児島県","沖縄県",
];
const SALARY_OPTIONS = [
  "月収20万〜30万円（歩合制）",
  "月収30万〜40万円（歩合制）",
  "月収40万〜50万円（歩合制）",
  "月収50万円以上（歩合制）",
  "日給1.5万〜2万円",
  "時給1,500〜2,000円",
  "要相談",
];
const WORK_HOURS_OPTIONS = [
  "8:00〜17:00（実働8時間）",
  "9:00〜18:00（実働8時間）",
  "6:00〜15:00（実働8時間）",
  "シフト制（週3日〜OK）",
  "フルフレックス",
  "要相談",
];
const HOLIDAYS_OPTIONS = [
  "週休2日（土日）",
  "週休2日（シフト制）",
  "週1日以上",
  "隔週土日",
  "年間休日120日以上",
  "要相談",
];
const MONTHLY_LIMITS = [
  { label: "3万円（最大9応募/月）", value: "30000" },
  { label: "5万円（最大15応募/月）", value: "50000" },
  { label: "10万円（最大30応募/月）", value: "100000" },
  { label: "20万円（最大60応募/月）", value: "200000" },
  { label: "上限なし", value: "9999999" },
];

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending: { label: "審査中", color: "border-amber-400 text-amber-700 bg-amber-50" },
  active:  { label: "掲載中", color: "border-emerald-400 text-emerald-700 bg-emerald-50" },
  paused:  { label: "停止中", color: "border-muted-foreground/30 text-muted-foreground" },
  closed:  { label: "クローズ", color: "border-muted-foreground/30 text-muted-foreground" },
};

const EMPTY_FORM = {
  jobCategory: "",
  employmentType: "",
  prefecture: "",
  salary: "",
  workHours: "",
  holidays: "",
  requiresLicense: false,
  requiresBlackNumber: false,
  requiresVehicle: false,
  requiresExperience: false,
  monthlyLimit: "30000",
};

export default function Jobs() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Job | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const { data: jobs = [], isLoading } = useQuery<Job[]>({ queryKey: ["/api/jobs"] });
  const { data: allApps = [] } = useQuery<any[]>({
    queryKey: ["/api/my/applications"],
    queryFn: () => apiRequest("GET", "/api/my/applications").then((r) => r.json()),
  });

  const appCountByJob = allApps.reduce((acc: Record<string, number>, a: any) => {
    acc[a.jobId] = (acc[a.jobId] || 0) + 1;
    return acc;
  }, {});

  const buildPayload = () => {
    const title = `${form.jobCategory || "軽貨物ドライバー"}（${form.prefecture || "エリア未定"}）`;
    return {
      title,
      jobCategory: form.jobCategory,
      employmentType: form.employmentType,
      salary: form.salary,
      area: form.prefecture,
      description: `${form.jobCategory}として${form.prefecture}エリアで活躍していただくお仕事です。`,
      requirements: "",
      workHours: form.workHours,
      holidays: form.holidays,
      benefits: "",
      requiresLicense: form.requiresLicense,
      requiresBlackNumber: form.requiresBlackNumber,
      requiresVehicle: form.requiresVehicle,
      requiresExperience: form.requiresExperience,
      monthlyLimit: Number(form.monthlyLimit),
    };
  };

  const createMutation = useMutation({
    mutationFn: (data: ReturnType<typeof buildPayload>) =>
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
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiRequest("PUT", `/api/jobs/${id}`, { status }).then((r) => r.json()),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      toast({ title: vars.status === "paused" ? "求人を停止しました" : "求人を再開しました" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/jobs/${id}`).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      toast({ title: "求人を削除しました" });
    },
  });

  const up = (key: string, val: any) => setForm((f) => ({ ...f, [key]: val }));

  const openCreate = () => { setEditing(null); setForm(EMPTY_FORM); setOpen(true); };
  const openEdit = (job: Job) => {
    setEditing(job);
    setForm({
      jobCategory: job.jobCategory || "",
      employmentType: job.employmentType || "",
      prefecture: job.area || "",
      salary: job.salary || "",
      workHours: job.workHours || "",
      holidays: job.holidays || "",
      requiresLicense: job.requiresLicense ?? false,
      requiresBlackNumber: job.requiresBlackNumber ?? false,
      requiresVehicle: job.requiresVehicle ?? false,
      requiresExperience: job.requiresExperience ?? false,
      monthlyLimit: String(job.monthlyLimit),
    });
    setOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.jobCategory || !form.employmentType || !form.prefecture || !form.salary) {
      toast({ variant: "destructive", title: "必須項目を選択してください" });
      return;
    }
    const data = buildPayload();
    if (editing) {
      updateMutation.mutate({ id: editing.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const formatDate = (s: string) => new Date(s).toLocaleDateString("ja-JP");

  return (
    <DashboardLayout>
      <div className="px-4 sm:px-6 py-6 max-w-4xl mx-auto">
        <div className="rounded-xl p-6 mb-6 hero-gradient relative overflow-hidden">
          <div className="hero-grid absolute inset-0 opacity-30" />
          <div className="relative z-10 flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="text-white/80 text-xs mb-0.5">JOB LISTINGS</p>
              <h1 className="text-2xl font-bold text-white" data-testid="text-page-title">求人管理</h1>
              <p className="text-white/70 text-sm mt-1">掲載申請・応募者確認・上限設定</p>
            </div>
            <Button
              onClick={openCreate}
              className="bg-white text-primary hover:bg-white/90 font-semibold"
              data-testid="button-create-job"
            >
              <Plus className="w-4 h-4 mr-1.5" />求人を作成
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}><CardContent className="p-5"><Skeleton className="h-20 w-full" /></CardContent></Card>
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <Card className="border border-dashed border-border">
            <CardContent className="p-16 flex flex-col items-center text-center gap-4">
              <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
                <Briefcase className="w-7 h-7 text-muted-foreground/40" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground mb-1">まだ求人がありません</p>
                <p className="text-xs text-muted-foreground">「求人を作成」から最初の求人票を作成してください</p>
              </div>
              <Button onClick={openCreate} data-testid="button-create-first-job">
                <Plus className="w-4 h-4 mr-1.5" />最初の求人を作成
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {jobs.map((job) => {
              const s = STATUS_MAP[job.status] ?? { label: job.status, color: "border-muted-foreground/30 text-muted-foreground" };
              const appCount = appCountByJob[job.id] || 0;
              return (
                <Card key={job.id} className="border border-border" data-testid={`card-job-${job.id}`}>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          <p className="text-base font-bold text-foreground truncate">{job.title}</p>
                          <Badge variant="outline" className={`text-[10px] shrink-0 ${s.color}`}>{s.label}</Badge>
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><Briefcase className="w-3 h-3" />{job.employmentType}</span>
                          <span className="flex items-center gap-1"><Banknote className="w-3 h-3" />{job.salary}</span>
                          <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{job.area}</span>
                          <span className="flex items-center gap-1"><Users className="w-3 h-3" />応募 {appCount}件</span>
                          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDate(job.createdAt)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Button size="sm" variant="outline" className="h-8 px-3 text-xs" onClick={() => openEdit(job)} data-testid={`button-edit-job-${job.id}`}>
                          <Edit2 className="w-3 h-3 mr-1" />編集
                        </Button>
                        {job.status === "active" && (
                          <Button size="sm" variant="outline" className="h-8 px-3 text-xs" onClick={() => pauseMutation.mutate({ id: job.id, status: "paused" })}>
                            <Pause className="w-3 h-3 mr-1" />停止
                          </Button>
                        )}
                        {job.status === "paused" && (
                          <Button size="sm" variant="outline" className="h-8 px-3 text-xs text-emerald-700 border-emerald-400 hover:bg-emerald-50" onClick={() => pauseMutation.mutate({ id: job.id, status: "active" })}>
                            <Play className="w-3 h-3 mr-1" />再開
                          </Button>
                        )}
                        <Button
                          size="sm" variant="outline"
                          className="h-8 px-3 text-xs text-destructive border-destructive/40 hover:bg-destructive/10"
                          onClick={() => { if (confirm(`「${job.title}」を削除しますか？`)) deleteMutation.mutate(job.id); }}
                          data-testid={`button-delete-job-${job.id}`}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditing(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "求人を編集" : "求人を新規作成"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">

            {/* 職種 */}
            <div className="space-y-1.5">
              <Label>職種 <span className="text-destructive">*</span></Label>
              <Select value={form.jobCategory} onValueChange={(v) => up("jobCategory", v)}>
                <SelectTrigger data-testid="select-job-category"><SelectValue placeholder="選択してください" /></SelectTrigger>
                <SelectContent>{JOB_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>

            {/* 雇用形態 */}
            <div className="space-y-1.5">
              <Label>雇用形態 <span className="text-destructive">*</span></Label>
              <Select value={form.employmentType} onValueChange={(v) => up("employmentType", v)}>
                <SelectTrigger data-testid="select-employment-type"><SelectValue placeholder="選択してください" /></SelectTrigger>
                <SelectContent>{EMPLOYMENT_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>

            {/* 都道府県 */}
            <div className="space-y-1.5">
              <Label>勤務エリア（都道府県）<span className="text-destructive">*</span></Label>
              <Select value={form.prefecture} onValueChange={(v) => up("prefecture", v)}>
                <SelectTrigger data-testid="select-prefecture"><SelectValue placeholder="都道府県を選択" /></SelectTrigger>
                <SelectContent className="max-h-60">
                  {PREFECTURES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* 給与帯 */}
            <div className="space-y-1.5">
              <Label>給与・報酬 <span className="text-destructive">*</span></Label>
              <Select value={form.salary} onValueChange={(v) => up("salary", v)}>
                <SelectTrigger data-testid="select-salary"><SelectValue placeholder="選択してください" /></SelectTrigger>
                <SelectContent>{SALARY_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>

            {/* 勤務時間 */}
            <div className="space-y-1.5">
              <Label>勤務時間</Label>
              <Select value={form.workHours} onValueChange={(v) => up("workHours", v)}>
                <SelectTrigger><SelectValue placeholder="選択してください" /></SelectTrigger>
                <SelectContent>{WORK_HOURS_OPTIONS.map((h) => <SelectItem key={h} value={h}>{h}</SelectItem>)}</SelectContent>
              </Select>
            </div>

            {/* 休日 */}
            <div className="space-y-1.5">
              <Label>休日</Label>
              <Select value={form.holidays} onValueChange={(v) => up("holidays", v)}>
                <SelectTrigger><SelectValue placeholder="選択してください" /></SelectTrigger>
                <SelectContent>{HOLIDAYS_OPTIONS.map((h) => <SelectItem key={h} value={h}>{h}</SelectItem>)}</SelectContent>
              </Select>
            </div>

            {/* 応募条件チェックボックス */}
            <div className="space-y-2">
              <Label>応募条件</Label>
              <div className="grid grid-cols-2 gap-3 p-3 rounded-lg border border-border bg-muted/30">
                {[
                  { key: "requiresLicense",      label: "免許必須" },
                  { key: "requiresBlackNumber",  label: "黒ナンバー必須" },
                  { key: "requiresVehicle",      label: "車両持込必須" },
                  { key: "requiresExperience",   label: "経験必須" },
                ].map(({ key, label }) => (
                  <div key={key} className="flex items-center gap-2">
                    <Checkbox
                      id={key}
                      checked={Boolean(form[key as keyof typeof form])}
                      onCheckedChange={(v) => up(key, Boolean(v))}
                    />
                    <label htmlFor={key} className="text-sm text-foreground cursor-pointer">{label}</label>
                  </div>
                ))}
              </div>
            </div>

            {/* 月の上限金額 */}
            <div className="space-y-1.5">
              <Label>月の上限金額</Label>
              <Select value={form.monthlyLimit} onValueChange={(v) => up("monthlyLimit", v)}>
                <SelectTrigger data-testid="select-monthly-limit"><SelectValue /></SelectTrigger>
                <SelectContent>{MONTHLY_LIMITS.map((l) => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}</SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">上限到達で掲載が自動停止されます（1応募 = ¥3,000税別）</p>
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
                  ? "送信中..."
                  : editing ? "更新する" : "掲載申請する"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
