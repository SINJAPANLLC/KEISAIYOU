import { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plus, Briefcase, Search, MapPin, Clock, Pencil, Trash2, Eye } from "lucide-react";
import DashboardLayout from "@/components/dashboard-layout";

export default function Jobs() {
  const [search, setSearch] = useState("");

  return (
    <DashboardLayout>
      <div className="px-4 sm:px-6 py-6 max-w-4xl mx-auto">
        <div className="rounded-xl p-6 mb-6 hero-gradient relative overflow-hidden">
          <div className="hero-grid absolute inset-0 opacity-30" />
          <div className="relative z-10 flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="text-white/80 text-xs mb-0.5">JOBS</p>
              <h1 className="text-2xl font-bold text-white" data-testid="text-page-title">求人一覧</h1>
              <p className="text-white/70 text-sm mt-1">掲載中・下書きの求人を管理できます</p>
            </div>
            <Link href="/jobs/new">
              <Button className="bg-white text-primary hover:bg-white/90 font-bold shadow">
                <Plus className="w-4 h-4 mr-2" />
                求人を作成
              </Button>
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="求人を検索..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <Card className="border border-dashed border-muted-foreground/20">
          <CardContent className="p-16 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Briefcase className="w-8 h-8 text-primary/60" />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-2">まだ求人がありません</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm">
              求人を作成すると、軽貨物ドライバーからの応募がメールで届きます。掲載費用は無料です。
            </p>
            <Link href="/jobs/new">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                最初の求人を作成する
              </Button>
            </Link>
          </CardContent>
        </Card>

        <div className="mt-6 rounded-xl border border-border bg-muted/30 p-5">
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-foreground mb-1">料金について</p>
              <p className="text-sm text-muted-foreground">
                求人の掲載・編集は無料です。応募が届いた時点で <strong>¥3,000（税込）/ 1応募</strong> が発生します。
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
