import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import DashboardLayout from "@/components/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Search, Users, Phone, Mail, MapPin, FileText, Calendar, CheckCircle2, Clock } from "lucide-react";

type Application = {
  id: string;
  jobId: string;
  name: string;
  phone: string;
  email: string;
  licenseType: string;
  hasBlackNumber: boolean;
  availableAreas: string;
  message: string;
  paymentStatus: string;
  viewable: boolean;
  createdAt: string;
};

type Job = {
  id: string;
  title: string;
  status: string;
};

export default function Applications() {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Application | null>(null);

  const { data: jobs = [] } = useQuery<Job[]>({
    queryKey: ["/api/jobs"],
    queryFn: () => apiRequest("GET", "/api/jobs").then((r) => r.json()),
  });

  const { data: applications = [], isLoading } = useQuery<Application[]>({
    queryKey: ["/api/my/applications"],
    queryFn: () => apiRequest("GET", "/api/my/applications").then((r) => r.json()),
  });

  const jobMap = Object.fromEntries(jobs.map((j) => [j.id, j.title]));

  const filtered = applications.filter((a) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      a.name?.toLowerCase().includes(q) ||
      a.email?.toLowerCase().includes(q) ||
      a.phone?.includes(q) ||
      jobMap[a.jobId]?.toLowerCase().includes(q)
    );
  });

  const formatDate = (s: string) =>
    new Date(s).toLocaleDateString("ja-JP", { year: "numeric", month: "short", day: "numeric" });

  return (
    <DashboardLayout>
      <div className="px-4 sm:px-6 py-6 max-w-4xl mx-auto">
        <div className="rounded-xl p-6 mb-6 hero-gradient relative overflow-hidden">
          <div className="hero-grid absolute inset-0 opacity-30" />
          <div className="relative z-10">
            <p className="text-white/80 text-xs mb-0.5">APPLICANTS</p>
            <h1 className="text-2xl font-bold text-white" data-testid="text-page-title">応募者一覧</h1>
            <p className="text-white/70 text-sm mt-1">全求人への応募者 {applications.length}件</p>
          </div>
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="氏名・メール・電話・求人名で検索..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            data-testid="input-search"
          />
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
                {search ? "検索に一致する応募者がいません" : "まだ応募がありません"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2" data-testid="list-applications">
            {filtered.map((app) => (
              <Card
                key={app.id}
                className="border border-border hover:border-primary/40 hover:shadow-sm transition-all cursor-pointer"
                onClick={() => setSelected(app)}
              >
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Users className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-foreground">{app.name}</p>
                      <Badge
                        variant="outline"
                        className={`text-[10px] shrink-0 ${
                          app.paymentStatus === "paid"
                            ? "border-emerald-400 text-emerald-700 bg-emerald-50"
                            : "border-amber-400 text-amber-700 bg-amber-50"
                        }`}
                      >
                        {app.paymentStatus === "paid" ? (
                          <><CheckCircle2 className="w-3 h-3 mr-1" />課金済</>
                        ) : (
                          <><Clock className="w-3 h-3 mr-1" />未課金</>
                        )}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        {jobMap[app.jobId] ?? "求人削除済"}
                      </span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(app.createdAt)}
                      </span>
                    </div>
                  </div>
                  <div className="hidden sm:flex flex-col items-end text-xs text-muted-foreground gap-1">
                    <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{app.phone}</span>
                    <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{app.email}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Detail Drawer */}
      <Sheet open={!!selected} onOpenChange={(o) => { if (!o) setSelected(null); }}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          {selected && (
            <>
              <SheetHeader className="mb-6">
                <SheetTitle className="text-lg">{selected.name}</SheetTitle>
                <p className="text-xs text-muted-foreground">{formatDate(selected.createdAt)} 応募</p>
              </SheetHeader>
              <div className="space-y-4">
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs font-semibold text-muted-foreground mb-1">応募求人</p>
                  <p className="text-sm font-medium">{jobMap[selected.jobId] ?? "求人削除済"}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-1 flex items-center gap-1"><Phone className="w-3 h-3" />電話番号</p>
                    <a href={`tel:${selected.phone}`} className="text-sm text-primary hover:underline">{selected.phone}</a>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-1 flex items-center gap-1"><Mail className="w-3 h-3" />メール</p>
                    <a href={`mailto:${selected.email}`} className="text-sm text-primary hover:underline break-all">{selected.email}</a>
                  </div>
                </div>
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
                    <p className="text-xs font-semibold text-muted-foreground mb-1 flex items-center gap-1"><MapPin className="w-3 h-3" />稼働可能エリア</p>
                    <p className="text-sm">{selected.availableAreas}</p>
                  </div>
                )}
                {selected.message && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-1">メッセージ</p>
                    <p className="text-sm whitespace-pre-wrap bg-muted/40 rounded-lg p-3">{selected.message}</p>
                  </div>
                )}
                <div className="pt-2">
                  <Badge
                    className={`${
                      selected.paymentStatus === "paid"
                        ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                        : "bg-amber-100 text-amber-800 border-amber-300"
                    } border text-xs`}
                  >
                    {selected.paymentStatus === "paid" ? "課金済（¥3,000）" : "未課金"}
                  </Badge>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </DashboardLayout>
  );
}
