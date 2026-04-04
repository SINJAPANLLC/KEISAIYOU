import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Briefcase, Search, MapPin, Building2, CheckCircle, XCircle, Pause, Play, Edit2,
  Tag, Banknote, Clock, CalendarDays, Calendar,
} from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import DashboardLayout from "@/components/dashboard-layout";

type JobListing = {
  id: string;
  title: string;
  jobCategory?: string;
  area: string;
  status: string;
  companyName?: string;
  employmentType: string;
  salary: string;
  workHours?: string;
  holidays?: string;
  description?: string;
  requirements?: string;
  benefits?: string;
  monthlyLimit: number;
  monthlySpent: number;
  createdAt: string;
  publishedAt?: string;
};

const JOB_CATEGORIES = ["軽貨物ドライバー", "宅配ドライバー", "幹線輸送ドライバー", "EC配送", "フードデリバリー", "企業配送", "その他"];
const EMPLOYMENT_TYPES = ["業務委託", "正社員", "契約社員", "パート・アルバイト"];
const HOLIDAYS_OPTIONS = ["週休2日（土日）", "週休2日（シフト制）", "週1日以上", "隔週土日", "年間休日120日以上", "要相談"];
const MONTHLY_LIMITS = [
  { label: "3万円（最大9応募/月）",  value: "30000" },
  { label: "5万円（最大15応募/月）", value: "50000" },
  { label: "10万円（最大30応募/月）", value: "100000" },
  { label: "20万円（最大60応募/月）", value: "200000" },
  { label: "上限なし",               value: "9999999" },
];

const EMPTY_FORM = {
  title: "", jobCategory: "", employmentType: "", area: "",
  salary: "", workHours: "", holidays: "", description: "", requirements: "", benefits: "",
  monthlyLimit: "30000",
};

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending: { label: "審査中",   color: "border-amber-400 text-amber-700 bg-amber-50" },
  active:  { label: "掲載中",   color: "border-emerald-400 text-emerald-700 bg-emerald-50" },
  paused:  { label: "停止中",   color: "border-muted-foreground/30 text-muted-foreground" },
  closed:  { label: "クローズ", color: "border-muted-foreground/30 text-muted-foreground" },
};

const BORDER_COLOR: Record<string, string> = {
  active:  "border-l-primary",
  pending: "border-l-amber-400",
  paused:  "border-l-muted-foreground/30",
  closed:  "border-l-muted-foreground/20",
};

export default function AdminListings() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<JobListing | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const { data: jobs = [], isLoading } = useQuery<JobListing[]>({
    queryKey: ["/api/admin/jobs"],
    queryFn: () => apiRequest("GET", "/api/admin/jobs").then((r) => r.json()),
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => apiRequest("PATCH", `/api/admin/jobs/${id}/approve`).then((r) => r.json()),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/admin/jobs"] }); toast({ title: "求人を承認しました" }); },
    onError: () => toast({ variant: "destructive", title: "承認に失敗しました" }),
  });

  const pauseMutation = useMutation({
    mutationFn: (id: string) => apiRequest("PATCH", `/api/admin/jobs/${id}/pause`).then((r) => r.json()),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/admin/jobs"] }); toast({ title: "求人を停止しました" }); },
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => apiRequest("PATCH", `/api/admin/jobs/${id}/reject`).then((r) => r.json()),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/admin/jobs"] }); toast({ title: "求人を却下しました" }); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      apiRequest("PUT", `/api/admin/jobs/${id}`, data).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/jobs"] });
      setEditOpen(false);
      setEditing(null);
      toast({ title: "求人を更新しました" });
    },
    onError: () => toast({ variant: "destructive", title: "更新に失敗しました" }),
  });

  const up = (key: string, val: any) => setForm((f) => ({ ...f, [key]: val }));

  const openEdit = (job: JobListing) => {
    setEditing(job);
    setForm({
      title: job.title || "",
      jobCategory: job.jobCategory || "",
      employmentType: job.employmentType || "",
      area: job.area || "",
      salary: job.salary || "",
      workHours: job.workHours || "",
      holidays: job.holidays || "",
      description: job.description || "",
      requirements: job.requirements || "",
      benefits: job.benefits || "",
      monthlyLimit: String(job.monthlyLimit || 30000),
    });
    setEditOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.area || !form.salary) {
      toast({ variant: "destructive", title: "タイトル・エリア・給与は必須です" });
      return;
    }
    updateMutation.mutate({ id: editing!.id, data: { ...form, monthlyLimit: Number(form.monthlyLimit) } });
  };

  const filtered = jobs.filter((j) => {
    if (filterStatus !== "all" && j.status !== filterStatus) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return j.title?.toLowerCase().includes(q) || j.area?.toLowerCase().includes(q) || j.companyName?.toLowerCase().includes(q);
  });

  const counts = {
    all: jobs.length,
    pending: jobs.filter((j) => j.status === "pending").length,
    active: jobs.filter((j) => j.status === "active").length,
    paused: jobs.filter((j) => j.status === "paused").length,
  };

  const formatDate = (s: string) => new Date(s).toLocaleDateString("ja-JP");

  return (
    <DashboardLayout>
      <div className="px-4 sm:px-6 py-6 max-w-4xl mx-auto">
        <div className="rounded-xl p-6 mb-6 hero-gradient relative overflow-hidden">
          <div className="hero-grid absolute inset-0 opacity-30" />
          <div className="relative z-10">
            <p className="text-white/80 text-xs mb-0.5">LISTINGS</p>
            <h1 className="text-2xl font-bold text-white" data-testid="text-page-title">求人管理</h1>
            <p className="text-white/70 text-sm mt-1">掲載申請の承認・掲載管理・内容編集</p>
          </div>
        </div>

        {/* Stats tabs */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          {[
            { key: "all",     label: "全求人",  count: counts.all,     color: "text-foreground" },
            { key: "pending", label: "審査中",  count: counts.pending, color: "text-amber-600" },
            { key: "active",  label: "掲載中",  count: counts.active,  color: "text-emerald-600" },
            { key: "paused",  label: "停止中",  count: counts.paused,  color: "text-muted-foreground" },
          ].map((s) => (
            <Card
              key={s.key}
              className={`cursor-pointer transition-shadow hover:shadow-sm ${filterStatus === s.key ? "ring-2 ring-primary" : ""}`}
              onClick={() => setFilterStatus(s.key)}
            >
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground mb-1">{s.label}</p>
                <p className={`text-2xl font-black ${s.color}`}>{isLoading ? "—" : s.count}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="タイトル・エリア・企業名で検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            data-testid="input-listing-search"
          />
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Card key={i}><CardContent className="p-5"><Skeleton className="h-24 w-full" /></CardContent></Card>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="p-12 flex flex-col items-center text-center">
              <Briefcase className="w-10 h-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm font-medium text-foreground mb-1" data-testid="text-empty-state">
                {searchQuery || filterStatus !== "all" ? "該当する求人がありません" : "求人がまだありません"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3" data-testid="list-job-listings">
            {filtered.map((job) => {
              const s = STATUS_MAP[job.status] || { label: job.status, color: "" };
              const borderColor = BORDER_COLOR[job.status] || "border-l-muted-foreground/20";
              const isPaused = job.status === "paused" || job.status === "closed";
              return (
                <Card key={job.id} className={`border overflow-hidden ${isPaused ? "opacity-70" : ""}`}>
                  <div className={`flex h-full border-l-4 ${borderColor}`}>
                    <CardContent className="p-5 flex-1">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-3 flex-wrap">
                            <p className="text-base font-bold text-foreground leading-snug">{job.title}</p>
                            <Badge variant="outline" className={`text-[10px] shrink-0 ${s.color}`}>{s.label}</Badge>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-3 gap-x-4 mb-3">
                            <div>
                              <p className="text-[10px] text-muted-foreground mb-0.5">掲載企業</p>
                              <p className="text-sm font-medium text-foreground flex items-center gap-1">
                                <Building2 className="w-3 h-3 text-primary shrink-0" />{job.companyName}
                              </p>
                            </div>
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
                            {job.status === "active" && (
                              <div>
                                <p className="text-[10px] text-muted-foreground mb-0.5">月間消化</p>
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                                    <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min(100, (job.monthlySpent / job.monthlyLimit) * 100)}%` }} />
                                  </div>
                                  <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                                    ¥{job.monthlySpent.toLocaleString()} / {job.monthlyLimit >= 9999999 ? "∞" : `¥${job.monthlyLimit.toLocaleString()}`}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>

                          <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            申請日: {formatDate(job.createdAt)}
                            {job.publishedAt && job.status === "active" && (
                              <span className="ml-3">掲載開始: {formatDate(job.publishedAt)}</span>
                            )}
                          </p>
                        </div>

                        {/* Action buttons */}
                        <div className="flex flex-col gap-1.5 shrink-0">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 px-3 text-xs"
                            onClick={() => openEdit(job)}
                            data-testid={`button-edit-${job.id}`}
                          >
                            <Edit2 className="w-3 h-3 mr-1" />編集
                          </Button>
                          {job.status === "pending" && (
                            <>
                              <Button
                                size="sm"
                                className="h-8 px-3 text-xs bg-emerald-600 hover:bg-emerald-700"
                                onClick={() => approveMutation.mutate(job.id)}
                                disabled={approveMutation.isPending}
                                data-testid={`button-approve-${job.id}`}
                              >
                                <CheckCircle className="w-3 h-3 mr-1" />承認
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 px-3 text-xs text-destructive border-destructive/40"
                                onClick={() => { if (confirm("この求人を却下しますか？")) rejectMutation.mutate(job.id); }}
                                disabled={rejectMutation.isPending}
                                data-testid={`button-reject-${job.id}`}
                              >
                                <XCircle className="w-3 h-3 mr-1" />却下
                              </Button>
                            </>
                          )}
                          {job.status === "active" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 px-3 text-xs text-amber-700 border-amber-300"
                              onClick={() => pauseMutation.mutate(job.id)}
                              disabled={pauseMutation.isPending}
                              data-testid={`button-pause-${job.id}`}
                            >
                              <Pause className="w-3 h-3 mr-1" />停止
                            </Button>
                          )}
                          {(job.status === "paused" || job.status === "closed") && (
                            <Button
                              size="sm"
                              className="h-8 px-3 text-xs bg-emerald-600 hover:bg-emerald-700"
                              onClick={() => approveMutation.mutate(job.id)}
                              disabled={approveMutation.isPending}
                            >
                              <Play className="w-3 h-3 mr-1" />再掲載
                            </Button>
                          )}
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

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={(v) => { setEditOpen(v); if (!v) setEditing(null); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>求人を編集</DialogTitle>
            {editing?.companyName && (
              <p className="text-xs text-muted-foreground mt-1">掲載企業: {editing.companyName}</p>
            )}
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label>タイトル <span className="text-destructive">*</span></Label>
              <Input value={form.title} onChange={(e) => up("title", e.target.value)} placeholder="例: 軽貨物ドライバー（神奈川エリア）" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>職種</Label>
                <Select value={form.jobCategory} onValueChange={(v) => up("jobCategory", v)}>
                  <SelectTrigger><SelectValue placeholder="選択" /></SelectTrigger>
                  <SelectContent>{JOB_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>雇用形態</Label>
                <Select value={form.employmentType} onValueChange={(v) => up("employmentType", v)}>
                  <SelectTrigger><SelectValue placeholder="選択" /></SelectTrigger>
                  <SelectContent>{EMPLOYMENT_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>勤務エリア <span className="text-destructive">*</span></Label>
              <Input value={form.area} onChange={(e) => up("area", e.target.value)} placeholder="例: 神奈川県横浜市・川崎市" />
            </div>

            <div className="space-y-1.5">
              <Label>給与・報酬 <span className="text-destructive">*</span></Label>
              <Input value={form.salary} onChange={(e) => up("salary", e.target.value)} placeholder="例: 月収30万〜50万円（歩合制）" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>勤務時間</Label>
                <Input value={form.workHours} onChange={(e) => up("workHours", e.target.value)} placeholder="例: 8:00〜18:00" />
              </div>
              <div className="space-y-1.5">
                <Label>休日</Label>
                <Select value={form.holidays} onValueChange={(v) => up("holidays", v)}>
                  <SelectTrigger><SelectValue placeholder="選択" /></SelectTrigger>
                  <SelectContent>{HOLIDAYS_OPTIONS.map((h) => <SelectItem key={h} value={h}>{h}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>仕事内容</Label>
              <textarea
                className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm resize-y focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={form.description}
                onChange={(e) => up("description", e.target.value)}
                placeholder="仕事内容の詳細..."
              />
            </div>

            <div className="space-y-1.5">
              <Label>応募条件・資格</Label>
              <textarea
                className="w-full min-h-[60px] rounded-md border border-input bg-background px-3 py-2 text-sm resize-y focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={form.requirements}
                onChange={(e) => up("requirements", e.target.value)}
                placeholder="応募条件・必要資格..."
              />
            </div>

            <div className="space-y-1.5">
              <Label>待遇・福利厚生</Label>
              <textarea
                className="w-full min-h-[60px] rounded-md border border-input bg-background px-3 py-2 text-sm resize-y focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={form.benefits}
                onChange={(e) => up("benefits", e.target.value)}
                placeholder="待遇・福利厚生..."
              />
            </div>

            <div className="space-y-1.5">
              <Label>月の上限金額</Label>
              <Select value={form.monthlyLimit} onValueChange={(v) => up("monthlyLimit", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{MONTHLY_LIMITS.map((l) => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}</SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">1応募 = ¥3,000税別</p>
            </div>

            <div className="flex gap-2 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setEditOpen(false)}>
                キャンセル
              </Button>
              <Button type="submit" className="flex-1" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "更新中..." : "更新する"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
