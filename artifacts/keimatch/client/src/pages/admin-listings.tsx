import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Briefcase, Search, MapPin, Building2, Eye, Trash2, CheckCircle, XCircle, Clock } from "lucide-react";
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
  createdAt: string;
};

export default function AdminListings() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: cargo, isLoading } = useQuery<any[]>({
    queryKey: ["/api/cargo"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/cargo/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cargo"] });
      toast({ title: "求人を削除しました" });
    },
    onError: () => {
      toast({ title: "削除に失敗しました", variant: "destructive" });
    },
  });

  const listings = cargo ?? [];
  const filtered = listings.filter((item: any) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.title?.toLowerCase().includes(q) ||
      item.departureArea?.toLowerCase().includes(q) ||
      item.companyName?.toLowerCase().includes(q)
    );
  });

  return (
    <DashboardLayout>
      <div className="px-4 sm:px-6 py-6 max-w-5xl mx-auto">
        <div className="rounded-xl p-6 mb-6 hero-gradient relative overflow-hidden">
          <div className="hero-grid absolute inset-0 opacity-30" />
          <div className="relative z-10">
            <p className="text-white/80 text-xs mb-0.5">LISTINGS</p>
            <h1 className="text-2xl font-bold text-white" data-testid="text-page-title">求人管理</h1>
            <p className="text-white/70 text-sm mt-1">全企業の求人一覧を管理します</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">総求人数</p>
              <p className="text-2xl font-black text-foreground">{isLoading ? "—" : listings.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">掲載中</p>
              <p className="text-2xl font-black text-emerald-600">
                {isLoading ? "—" : listings.filter((l: any) => l.status === "active" || l.status === "open").length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">クローズ</p>
              <p className="text-2xl font-black text-muted-foreground">
                {isLoading ? "—" : listings.filter((l: any) => l.status === "closed" || l.status === "completed").length}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="求人タイトル・エリア・企業名で検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            data-testid="input-listing-search"
          />
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Card key={i}><CardContent className="p-4"><Skeleton className="h-12 w-full" /></CardContent></Card>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="p-12 flex flex-col items-center text-center">
              <Briefcase className="w-10 h-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm font-medium text-foreground mb-1" data-testid="text-empty-state">
                {searchQuery ? "検索結果がありません" : "求人がまだありません"}
              </p>
              <p className="text-xs text-muted-foreground">企業がログインして求人を作成するとここに表示されます</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2" data-testid="list-job-listings">
            {filtered.map((item: any) => (
              <Card key={item.id} className="border border-border hover:shadow-sm transition-shadow">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Briefcase className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-foreground truncate">{item.title || "無題の求人"}</p>
                      <Badge
                        variant="outline"
                        className={`text-[10px] shrink-0 ${
                          item.status === "active" || item.status === "open"
                            ? "border-emerald-400 text-emerald-700 bg-emerald-50"
                            : item.status === "closed" || item.status === "completed"
                            ? "border-muted-foreground/30 text-muted-foreground"
                            : "border-amber-400 text-amber-700 bg-amber-50"
                        }`}
                      >
                        {item.status === "active" || item.status === "open" ? "掲載中" :
                         item.status === "closed" || item.status === "completed" ? "クローズ" : "下書き"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                      {item.departureArea && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {item.departureArea}
                        </span>
                      )}
                      {item.companyName && (
                        <span className="flex items-center gap-1">
                          <Building2 className="w-3 h-3" />
                          {item.companyName}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(item.createdAt).toLocaleDateString("ja-JP")}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={() => {
                      if (confirm("この求人を削除しますか？")) {
                        deleteMutation.mutate(item.id);
                      }
                    }}
                    disabled={deleteMutation.isPending}
                    data-testid={`button-delete-listing-${item.id}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
