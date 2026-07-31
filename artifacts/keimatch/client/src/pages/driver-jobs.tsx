import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Banknote, Clock, Calendar, Briefcase, Search, ChevronRight, Car, FileText } from "lucide-react";
import logoImg from "@/assets/logo-keisaiyou.png";

type PublicJob = {
  id: string;
  title: string;
  jobCategory: string | null;
  employmentType: string;
  salary: string;
  area: string;
  workHours: string | null;
  holidays: string | null;
  benefits: string | null;
  requiresLicense: boolean | null;
  requiresBlackNumber: boolean | null;
  requiresVehicle: boolean | null;
  requiresExperience: boolean | null;
  publishedAt: string | null;
  companyName: string | null;
};

const EMPLOYMENT_OPTIONS = ["業務委託", "正社員", "パート・アルバイト", "契約社員"];
const CATEGORY_OPTIONS = ["軽貨物配送", "宅配便", "食品配送", "医療・医薬品配送", "EC配送", "引越補助", "その他"];

function JobCard({ job }: { job: PublicJob }) {
  const publishedDate = job.publishedAt
    ? new Date(job.publishedAt).toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric" })
    : null;

  return (
    <Card className="hover:shadow-md transition-shadow border border-border/60">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap gap-1.5 mb-2">
              {job.jobCategory && (
                <Badge variant="secondary" className="text-xs">{job.jobCategory}</Badge>
              )}
              <Badge variant="outline" className="text-xs">{job.employmentType}</Badge>
              {job.requiresBlackNumber && (
                <Badge className="text-xs bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-100">黒ナンバー必要</Badge>
              )}
              {job.requiresVehicle && (
                <Badge className="text-xs bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100">車両持込</Badge>
              )}
            </div>
            <h3 className="font-bold text-base text-foreground leading-snug">{job.title}</h3>
            {job.companyName && (
              <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-1">
                <Briefcase className="w-3.5 h-3.5 shrink-0" />
                {job.companyName}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mb-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Banknote className="w-4 h-4 shrink-0 text-orange-500" />
            <span className="font-medium text-foreground">{job.salary}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <MapPin className="w-4 h-4 shrink-0 text-orange-500" />
            <span>{job.area}</span>
          </div>
          {job.workHours && (
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 shrink-0 text-orange-500" />
              <span>{job.workHours}</span>
            </div>
          )}
          {job.holidays && (
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 shrink-0 text-orange-500" />
              <span>{job.holidays}</span>
            </div>
          )}
        </div>

        {job.benefits && (
          <p className="text-xs text-muted-foreground mb-4 line-clamp-2 bg-muted/50 rounded px-2 py-1.5">
            {job.benefits}
          </p>
        )}

        <div className="flex items-center justify-between">
          {publishedDate && (
            <span className="text-xs text-muted-foreground">{publishedDate} 掲載</span>
          )}
          <Link href={`/apply/${job.id}`} className="ml-auto">
            <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white gap-1">
              この求人に応募する
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

function JobCardSkeleton() {
  return (
    <Card className="border border-border/60">
      <CardContent className="p-5 space-y-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <div className="grid grid-cols-2 gap-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
        </div>
        <Skeleton className="h-8 w-32 ml-auto" />
      </CardContent>
    </Card>
  );
}

export default function DriverJobs() {
  const [areaInput, setAreaInput] = useState("");
  const [area, setArea] = useState("");
  const [category, setCategory] = useState("all");
  const [employment, setEmployment] = useState("all");

  const params = new URLSearchParams();
  if (area) params.set("area", area);
  if (category && category !== "all") params.set("category", category);
  if (employment && employment !== "all") params.set("employment", employment);
  const queryStr = params.toString();

  const { data: jobs, isLoading } = useQuery<PublicJob[]>({
    queryKey: ["/api/public/jobs", queryStr],
    queryFn: () => apiRequest("GET", `/api/public/jobs${queryStr ? "?" + queryStr : ""}`).then((r) => r.json()),
  });

  const handleSearch = () => setArea(areaInput.trim());
  const clearFilters = () => {
    setAreaInput("");
    setArea("");
    setCategory("all");
    setEmployment("all");
  };
  const hasFilters = area || (category && category !== "all") || (employment && employment !== "all");

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b bg-white sticky top-0 z-30 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div />
        </div>
      </header>

      {/* Hero */}
      <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white py-10 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-2 mb-2">
            <Car className="w-5 h-5" />
            <span className="text-sm font-medium opacity-90">軽貨物ドライバー専門</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold mb-1">求人一覧</h1>
          <p className="text-white/80 text-sm">あなたに合った軽貨物の仕事を探しましょう</p>

          {/* Search bar */}
          <div className="mt-5 flex gap-2 max-w-lg">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60" />
              <Input
                placeholder="エリアで検索（例：神奈川、横浜）"
                value={areaInput}
                onChange={(e) => setAreaInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="pl-9 bg-white/15 border-white/30 text-white placeholder:text-white/60 focus:bg-white/20"
              />
            </div>
            <Button onClick={handleSearch} className="bg-white text-orange-600 hover:bg-orange-50 font-semibold shrink-0">
              検索
            </Button>
          </div>
        </div>
      </div>

      {/* Filters + Results */}
      <div className="max-w-5xl mx-auto px-4 py-6 w-full flex-1">
        {/* Filter row */}
        <div className="flex flex-wrap items-center gap-3 mb-5">
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-44 h-9 text-sm">
              <SelectValue placeholder="職種カテゴリ" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">すべての職種</SelectItem>
              {CATEGORY_OPTIONS.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={employment} onValueChange={setEmployment}>
            <SelectTrigger className="w-44 h-9 text-sm">
              <SelectValue placeholder="雇用形態" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">すべての形態</SelectItem>
              {EMPLOYMENT_OPTIONS.map((e) => (
                <SelectItem key={e} value={e}>{e}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground h-9">
              条件をリセット
            </Button>
          )}

          <div className="ml-auto text-sm text-muted-foreground">
            {!isLoading && jobs && (
              <span><span className="font-semibold text-foreground">{jobs.length}</span> 件の求人</span>
            )}
          </div>
        </div>

        {/* Job list */}
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => <JobCardSkeleton key={i} />)}
          </div>
        ) : !jobs || jobs.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="font-medium">現在掲載中の求人がありません</p>
            <p className="text-sm mt-1">条件を変えてお試しください</p>
            {hasFilters && (
              <Button variant="outline" size="sm" onClick={clearFilters} className="mt-4">
                絞り込みを解除
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {jobs.map((job) => <JobCard key={job.id} job={job} />)}
          </div>
        )}

      </div>

    </div>
  );
}
