import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import DashboardLayout from "@/components/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Rss, Copy, ExternalLink, CheckCircle2, Briefcase, Globe } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AdminIndeedFeed() {
  const { toast } = useToast();

  const feedUrl = `${window.location.origin}/feed/indeed.xml`;

  const { data: jobs = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/jobs"],
    queryFn: () => apiRequest("GET", "/api/admin/jobs").then((r) => r.json()),
  });

  const activeJobs = jobs.filter((j: any) => j.status === "active").length;
  const totalJobs = jobs.length;

  const copyFeedUrl = () => {
    navigator.clipboard.writeText(feedUrl).then(() => {
      toast({ title: "フィードURLをコピーしました" });
    });
  };

  return (
    <DashboardLayout>
      <div className="px-4 sm:px-6 py-6 max-w-4xl mx-auto">
        <div className="rounded-xl p-6 mb-6 hero-gradient relative overflow-hidden">
          <div className="hero-grid absolute inset-0 opacity-30" />
          <div className="relative z-10">
            <p className="text-white/80 text-xs mb-0.5">INDEED FEED</p>
            <h1 className="text-2xl font-bold text-white" data-testid="text-page-title">INDEED 運用管理</h1>
            <p className="text-white/70 text-sm mt-1">XML フィード配信・Indeed 連携設定</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-5">
              <p className="text-xs text-muted-foreground mb-1">掲載中の求人</p>
              <p className="text-3xl font-black text-primary">{activeJobs}</p>
              <p className="text-xs text-muted-foreground mt-1">件（フィード配信中）</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <p className="text-xs text-muted-foreground mb-1">全求人数</p>
              <p className="text-3xl font-black text-foreground">{totalJobs}</p>
              <p className="text-xs text-muted-foreground mt-1">件</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <p className="text-xs text-muted-foreground mb-1">フィード形式</p>
              <p className="text-3xl font-black text-foreground">XML</p>
              <p className="text-xs text-muted-foreground mt-1">Indeed 標準形式</p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <Rss className="w-4 h-4 text-primary" />
                <p className="text-sm font-semibold">フィード URL</p>
                <Badge variant="outline" className="text-[10px] border-emerald-400 text-emerald-700 bg-emerald-50">
                  <CheckCircle2 className="w-3 h-3 mr-1" />自動更新中
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs bg-muted rounded-md px-3 py-2.5 break-all font-mono text-foreground">
                  {feedUrl}
                </code>
                <Button variant="outline" size="sm" onClick={copyFeedUrl} className="shrink-0">
                  <Copy className="w-3.5 h-3.5 mr-1" />コピー
                </Button>
                <Button variant="outline" size="sm" asChild className="shrink-0">
                  <a href={feedUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-3.5 h-3.5 mr-1" />確認
                  </a>
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                掲載ステータスが「公開中」の求人のみ自動でフィードに含まれます。Indeed の求人管理画面からこの URL を登録してください。
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <Globe className="w-4 h-4 text-primary" />
                <p className="text-sm font-semibold">Indeed 登録手順</p>
              </div>
              <ol className="space-y-3">
                {[
                  { step: "1", text: "Indeed 求人掲載管理画面にログイン" },
                  { step: "2", text: "「フィードによる求人掲載」またはパートナー登録を選択" },
                  { step: "3", text: "上記のフィード URL を Indeed に登録" },
                  { step: "4", text: "Indeed が定期的にフィードを取得し、求人を自動掲載" },
                ].map(({ step, text }) => (
                  <li key={step} className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {step}
                    </span>
                    <p className="text-sm text-foreground">{text}</p>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <Briefcase className="w-4 h-4 text-primary" />
                <p className="text-sm font-semibold">フィード対象求人一覧</p>
              </div>
              {activeJobs === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">掲載中の求人がありません</p>
              ) : (
                <div className="space-y-2" data-testid="list-active-jobs">
                  {jobs.filter((j: any) => j.status === "active").map((job: any) => (
                    <div key={job.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                      <div>
                        <p className="text-sm font-medium">{job.title}</p>
                        <p className="text-xs text-muted-foreground">{job.companyName} · {job.area}</p>
                      </div>
                      <Badge variant="outline" className="text-[10px] border-emerald-400 text-emerald-700 bg-emerald-50">配信中</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
