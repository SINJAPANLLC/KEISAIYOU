import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Briefcase, CheckCircle2, Circle, ArrowRight, Settings, FileText } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import DashboardLayout from "@/components/dashboard-layout";

interface OnboardingStep {
  id: string;
  label: string;
  description: string;
  done: boolean;
  href: string;
  action: string;
}

export default function Dashboard() {
  const { user } = useAuth();

  const onboardingSteps: OnboardingStep[] = [
    {
      id: "profile",
      label: "企業プロフィールを完成させる",
      description: "会社情報を入力すると求職者からの信頼度が上がります",
      done: !!(user?.phone && user?.address),
      href: "/settings",
      action: "設定へ",
    },
    {
      id: "job",
      label: "最初の求人を作成する",
      description: "募集エリア・勤務形態・報酬を入力するだけで公開できます",
      done: false,
      href: "/jobs/new",
      action: "求人を作成",
    },
  ];

  const doneCount = onboardingSteps.filter((s) => s.done).length;
  const allDone = doneCount === onboardingSteps.length;

  return (
    <DashboardLayout>
      <div className="px-4 sm:px-6 py-6 max-w-4xl mx-auto">
        <div className="rounded-xl p-6 mb-6 hero-gradient relative overflow-hidden">
          <div className="hero-grid absolute inset-0 opacity-30" />
          <div className="relative z-10">
            <p className="text-white/80 text-sm mb-1">ようこそ</p>
            <h1 className="text-2xl font-bold text-white mb-1" data-testid="text-page-title">
              {user?.companyName ?? "企業"} 様
            </h1>
            <p className="text-white/70 text-sm">KEI SAIYOUへようこそ。軽貨物ドライバーの採用をスタートしましょう。</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Card className="border border-border">
            <CardContent className="p-5">
              <p className="text-xs text-muted-foreground mb-1">掲載中の求人</p>
              <p className="text-3xl font-black text-foreground">0</p>
              <p className="text-xs text-muted-foreground mt-1">件</p>
            </CardContent>
          </Card>
          <Card className="border border-border">
            <CardContent className="p-5">
              <p className="text-xs text-muted-foreground mb-1">受け取った応募</p>
              <p className="text-3xl font-black text-foreground">0</p>
              <p className="text-xs text-muted-foreground mt-1">件</p>
            </CardContent>
          </Card>
          <Card className="border border-border">
            <CardContent className="p-5">
              <p className="text-xs text-muted-foreground mb-1">今週の新着応募</p>
              <p className="text-3xl font-black text-foreground">0</p>
              <p className="text-xs text-muted-foreground mt-1">件</p>
            </CardContent>
          </Card>
        </div>

        {!allDone && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-foreground">はじめの一歩</h2>
              <span className="text-xs text-muted-foreground">{doneCount} / {onboardingSteps.length} 完了</span>
            </div>
            <div className="w-full bg-muted rounded-full h-1.5 mb-4">
              <div
                className="bg-primary h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${(doneCount / onboardingSteps.length) * 100}%` }}
              />
            </div>
            <div className="space-y-3">
              {onboardingSteps.map((step) => (
                <Card key={step.id} className={`border ${step.done ? "border-border opacity-60" : "border-primary/30"}`}>
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="shrink-0">
                      {step.done ? (
                        <CheckCircle2 className="w-6 h-6 text-primary" />
                      ) : (
                        <Circle className="w-6 h-6 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold ${step.done ? "line-through text-muted-foreground" : "text-foreground"}`}>
                        {step.label}
                      </p>
                      {!step.done && (
                        <p className="text-xs text-muted-foreground mt-0.5">{step.description}</p>
                      )}
                    </div>
                    {!step.done && (
                      <Link href={step.href}>
                        <Button size="sm" className="shrink-0">
                          {step.action}
                          <ArrowRight className="w-3.5 h-3.5 ml-1" />
                        </Button>
                      </Link>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        <div>
          <h2 className="font-bold text-foreground mb-3">クイックアクション</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Link href="/jobs/new">
              <Card className="border border-dashed border-primary/40 hover:border-primary hover:bg-primary/5 transition-colors cursor-pointer h-full">
                <CardContent className="p-5 flex flex-col items-center text-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Plus className="w-5 h-5 text-primary" />
                  </div>
                  <p className="text-sm font-semibold text-foreground">求人を作成する</p>
                  <p className="text-xs text-muted-foreground">新しい求人票を作成・公開</p>
                </CardContent>
              </Card>
            </Link>
            <Link href="/jobs">
              <Card className="border border-border hover:border-primary/40 hover:bg-muted/50 transition-colors cursor-pointer h-full">
                <CardContent className="p-5 flex flex-col items-center text-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                    <Briefcase className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-semibold text-foreground">求人一覧を見る</p>
                  <p className="text-xs text-muted-foreground">掲載中・下書きの求人を管理</p>
                </CardContent>
              </Card>
            </Link>
            <Link href="/settings">
              <Card className="border border-border hover:border-primary/40 hover:bg-muted/50 transition-colors cursor-pointer h-full">
                <CardContent className="p-5 flex flex-col items-center text-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                    <Settings className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-semibold text-foreground">企業情報を設定する</p>
                  <p className="text-xs text-muted-foreground">会社情報・連絡先を更新</p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>

        <div className="mt-10 rounded-xl border border-border bg-muted/30 p-5">
          <div className="flex items-start gap-3">
            <FileText className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-foreground mb-1">料金について</p>
              <p className="text-sm text-muted-foreground">
                掲載は無料です。応募が届いた時点で <strong>¥3,000（税込）/ 1応募</strong> が発生します。応募がなければ費用は一切かかりません。
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
