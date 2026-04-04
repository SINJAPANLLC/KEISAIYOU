import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Briefcase, Search, MapPin, Building2, Clock, CheckCircle, XCircle, Pause, Trash2 } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import DashboardLayout from "@/components/dashboard-layout";

type JobListing = {
  id: string;
  title: string;
  area: string;
  status: string;
  companyName?: string;
  employmentType: string;
  salary: string;
  monthlyLimit: number;
  monthlySpent: number;
  createdAt: string;
  publishedAt?: string;
};

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending: { label: "審査中", color: "border-amber-400 text-amber-700 bg-amber-50" },
  active: { label: "掲載中", color: "border-emerald-400 text-emerald-700 bg-emerald-50" },
  paused: { label: "停止中", color: "border-muted-foreground/30 text-muted-foreground" },
  closed: { label: "クローズ", color: "border-muted-foreground/30 text-muted-foreground" },
};

export default function AdminListings() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

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

  return (
    <DashboardLayout>
      <div className="px-4 sm:px-6 py-6 max-w-5xl mx-auto">
        <div className="rounded-xl p-6 mb-6 hero-gradient relative overflow-hidden">
          <div className="hero-grid absolute inset-0 opacity-30" />
          <div className="relative z-10">
            <p className="text-white/80 text-xs mb-0.5">LISTINGS</p>
            <h1 className="text-2xl font-bold text-white" data-testid="text-page-title">求人管理</h1>
            <p className="text-white/70 text-sm mt-1">掲載申請の承認・掲載管理</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          {[
            { key: "all", label: "全求人", count: counts.all, color: "text-foreground" },
            { key: "pending", label: "審査中", count: counts.pending, color: "text-amber-600" },
            { key: "active", label: "掲載中", count: counts.active, color: "text-emerald-600" },
            { key: "paused", label: "停止中", count: counts.paused, color: "text-muted-foreground" },
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
              <Card key={i}><CardContent className="p-4"><Skeleton className="h-20 w-full" /></CardContent></Card>
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
          <div className="space-y-2" data-testid="list-job-listings">
            {filtered.map((job) => {
              const s = STATUS_MAP[job.status] || { label: job.status, color: "" };
              return (
                <Card key={job.id} className="border border-border hover:shadow-sm transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Briefcase className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <p className="text-sm font-semibold text-foreground">{job.title}</p>
                          <Badge variant="outline" className={`text-[10px] shrink-0 ${s.color}`}>{s.label}</Badge>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                          <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{job.area}</span>
                          <span className="flex items-center gap-1"><Building2 className="w-3 h-3" />{job.companyName}</span>
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(job.createdAt).toLocaleDateString("ja-JP")}</span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {job.employmentType}・{job.salary}
                        </div>
                        {job.status === "active" && (
                          <div className="flex items-center gap-2 mt-1.5">
                            <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                              <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min(100, (job.monthlySpent / job.monthlyLimit) * 100)}%` }} />
                            </div>
                            <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                              ¥{job.monthlySpent.toLocaleString()} / ¥{job.monthlyLimit >= 9999999 ? "∞" : job.monthlyLimit.toLocaleString()}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0 flex-wrap justify-end">
                        {job.status === "pending" && (
                          <>
                            <Button
                              size="sm"
                              className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700"
                              onClick={() => approveMutation.mutate(job.id)}
                              disabled={approveMutation.isPending}
                              data-testid={`button-approve-${job.id}`}
                            >
                              <CheckCircle className="w-3 h-3 mr-1" />掲載承認
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs text-destructive border-destructive/30"
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
                            className="h-7 text-xs text-amber-700 border-amber-300"
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
                            className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700"
                            onClick={() => approveMutation.mutate(job.id)}
                            disabled={approveMutation.isPending}
                          >
                            <CheckCircle className="w-3 h-3 mr-1" />再掲載
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
