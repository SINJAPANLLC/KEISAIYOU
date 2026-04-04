import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import DashboardLayout from "@/components/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Briefcase, Plus, Edit2, Trash2, Pause, Play, MapPin, Banknote, Users, Calendar, Clock, CalendarDays, Tag } from "lucide-react";

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
  status: string;
  monthlyLimit: number;
  monthlySpent: number;
  createdAt: string;
};

const JOB_CATEGORIES = ["軽貨物ドライバー", "宅配ドライバー", "幹線輸送ドライバー", "EC配送", "フードデリバリー", "企業配送", "その他"];
const EMPLOYMENT_TYPES = ["業務委託", "正社員", "契約社員", "パート・アルバイト"];
const HOLIDAYS_OPTIONS = [
  "週休2日（土日）",
  "週休2日（シフト制）",
  "週1日以上",
  "隔週土日",
  "年間休日120日以上",
  "要相談",
];
const EMPTY_FORM = {
  title: "",
  jobCategory: "",
  employmentType: "",
  area: "",
  salary: "",
  workHours: "",
  holidays: "",
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

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/jobs", data).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      setOpen(false);
      toast({ title: "求人を掲載しました" });
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
      title: job.title,
      jobCategory: job.jobCategory || "",
      employmentType: job.employmentType || "",
      area: job.area || "",
      salary: job.salary || "",
      workHours: job.workHours || "",
      holidays: job.holidays || "",
    });
    setOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.jobCategory || !form.employmentType || !form.area || !form.salary) {
      toast({ variant: "destructive", title: "必須項目を入力・選択してください" });
      return;
    }
    const data = {
      title: form.title,
      jobCategory: form.jobCategory,
      employmentType: form.employmentType,
      area: form.area,
      salary: form.salary,
      workHours: form.workHours,
      holidays: form.holidays,
      description: `${form.jobCategory}として${form.area}エリアで活躍していただくお仕事です。`,
      requirements: "",
      benefits: "",
    };
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
              const appCount = appCountByJob[job.id] || 0;
              const isPaused = job.status === "paused";
              return (
                <Card
                  key={job.id}
                  className={`border overflow-hidden ${isPaused ? "border-border opacity-60" : "border-border"}`}
                  data-testid={`card-job-${job.id}`}
                >
                  <div className={`flex h-full ${isPaused ? "border-l-4 border-l-muted-foreground/30" : "border-l-4 border-l-primary"}`}>
                    <CardContent className="p-5 flex-1">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="text-base font-bold text-foreground mb-3 leading-snug">{job.title}</p>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-3 gap-x-4 mb-3">
                            {job.jobCategory && (
                              <div>
                                <p className="text-[10px] text-muted-foreground mb-0.5">職種</p>
                                <p className="text-sm font-medium text-foreground flex items-center gap-1">
                                  <Tag className="w-3 h-3 text-primary shrink-0" />{job.jobCategory}
                                </p>
                              </div>
                            )}
                            <div>
                              <p className="text-[10px] text-muted-foreground mb-0.5">雇用形態</p>
                              <p className="text-sm font-medium text-foreground flex items-center gap-1">
                                <Briefcase className="w-3 h-3 text-primary shrink-0" />{job.employmentType}
                              </p>
                            </div>
                            <div>
                              <p className="text-[10px] text-muted-foreground mb-0.5">勤務エリア</p>
                              <p className="text-sm font-medium text-foreground flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-primary shrink-0" />{job.area}
                              </p>
                            </div>
                            <div>
                              <p className="text-[10px] text-muted-foreground mb-0.5">給与・報酬</p>
                              <p className="text-sm font-medium text-foreground flex items-center gap-1">
                                <Banknote className="w-3 h-3 text-primary shrink-0" />{job.salary}
                              </p>
                            </div>
                            {job.workHours && (
                              <div>
                                <p className="text-[10px] text-muted-foreground mb-0.5">勤務時間</p>
                                <p className="text-sm font-medium text-foreground flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-primary shrink-0" />{job.workHours}
                                </p>
                              </div>
                            )}
                            {job.holidays && (
                              <div>
                                <p className="text-[10px] text-muted-foreground mb-0.5">休日</p>
                                <p className="text-sm font-medium text-foreground flex items-center gap-1">
                                  <CalendarDays className="w-3 h-3 text-primary shrink-0" />{job.holidays}
                                </p>
                              </div>
                            )}
                            <div>
                              <p className="text-[10px] text-muted-foreground mb-0.5">応募数</p>
                              <p className="text-sm font-bold text-primary flex items-center gap-1">
                                <Users className="w-3 h-3 shrink-0" />{appCount}件
                              </p>
                            </div>
                          </div>
                          <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                            <Calendar className="w-3 h-3" />掲載開始: {formatDate(job.createdAt)}
                            {isPaused && <span className="ml-2 font-medium">（停止中）</span>}
                          </p>
                        </div>
                        <div className="flex flex-col gap-1.5 shrink-0">
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
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditing(null); }}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "求人を編集" : "求人を新規作成"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">

            {/* タイトル */}
            <div className="space-y-1.5">
              <Label>タイトル <span className="text-destructive">*</span></Label>
              <Input
                value={form.title}
                onChange={(e) => up("title", e.target.value)}
                placeholder="例: 軽貨物ドライバー（神奈川エリア）"
                data-testid="input-job-title"
              />
            </div>

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

            {/* 勤務エリア */}
            <div className="space-y-1.5">
              <Label>勤務エリア <span className="text-destructive">*</span></Label>
              <Input
                value={form.area}
                onChange={(e) => up("area", e.target.value)}
                placeholder="例: 神奈川県横浜市・川崎市"
                data-testid="input-job-area"
              />
            </div>

            {/* 給与・報酬 */}
            <div className="space-y-1.5">
              <Label>給与・報酬 <span className="text-destructive">*</span></Label>
              <Input
                value={form.salary}
                onChange={(e) => up("salary", e.target.value)}
                placeholder="例: 月収30万〜50万円（歩合制）"
                data-testid="input-job-salary"
              />
            </div>

            {/* 勤務時間 */}
            <div className="space-y-1.5">
              <Label>勤務時間</Label>
              <Input
                value={form.workHours}
                onChange={(e) => up("workHours", e.target.value)}
                placeholder="例: 8:00〜18:00（実働8時間）"
              />
            </div>

            {/* 休日 */}
            <div className="space-y-1.5">
              <Label>休日</Label>
              <Select value={form.holidays} onValueChange={(v) => up("holidays", v)}>
                <SelectTrigger><SelectValue placeholder="選択してください" /></SelectTrigger>
                <SelectContent>{HOLIDAYS_OPTIONS.map((h) => <SelectItem key={h} value={h}>{h}</SelectItem>)}</SelectContent>
              </Select>
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
                  : editing ? "更新する" : "掲載する"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
