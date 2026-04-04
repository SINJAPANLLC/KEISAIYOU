import { useState } from "react";
import { useRoute, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Banknote, Briefcase, CheckCircle2, ArrowLeft, Loader2 } from "lucide-react";

const LICENSE_TYPES = ["普通自動車（AT限定）", "普通自動車", "準中型", "中型", "大型", "けん引"];

type Job = {
  id: string;
  title: string;
  employmentType: string;
  salary: string;
  area: string;
  description: string;
  requirements?: string;
  status: string;
};

export default function Apply() {
  const [, params] = useRoute("/apply/:id");
  const jobId = params?.id;
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    licenseType: "",
    hasBlackNumber: false,
    availableAreas: "",
    message: "",
  });

  const { data: job, isLoading, isError } = useQuery<Job>({
    queryKey: ["/api/public/jobs", jobId],
    queryFn: () => apiRequest("GET", `/api/public/jobs/${jobId}`).then((r) => r.json()),
    enabled: !!jobId,
    retry: false,
  });

  const applyMutation = useMutation({
    mutationFn: (data: typeof form & { jobId: string }) =>
      apiRequest("POST", "/api/apply", data).then((r) => r.json()),
    onSuccess: () => {
      setSubmitted(true);
    },
    onError: (e: any) => {
      toast({ variant: "destructive", title: "送信エラー", description: e.message || "応募の送信に失敗しました" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone || !form.email) {
      toast({ variant: "destructive", title: "必須項目を入力してください" });
      return;
    }
    applyMutation.mutate({ ...form, jobId: jobId! });
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
          </div>
          <h1 className="text-xl font-bold mb-2">応募を受け付けました</h1>
          <p className="text-muted-foreground text-sm mb-6">
            ご応募ありがとうございます。企業より連絡が届くまでしばらくお待ちください。
          </p>
          <Link href="/">
            <Button variant="outline">トップページへ戻る</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <div className="hero-gradient relative overflow-hidden">
        <div className="hero-grid absolute inset-0 opacity-30" />
        <div className="relative z-10 px-4 py-5 max-w-2xl mx-auto">
          <Link href="/">
            <button className="flex items-center gap-1 text-white/80 text-sm mb-4 hover:text-white">
              <ArrowLeft className="w-4 h-4" />トップへ戻る
            </button>
          </Link>
          <img src="/logo-white.png" alt="KEI SAIYOU" className="h-8 w-auto mb-4" />
          <h1 className="text-xl font-bold text-white">求人に応募する</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Job info */}
        {isLoading ? (
          <Card><CardContent className="p-6 flex items-center justify-center h-24"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></CardContent></Card>
        ) : isError || !job ? (
          <Card><CardContent className="p-6 text-center">
            <p className="text-muted-foreground">この求人は見つかりません</p>
          </CardContent></Card>
        ) : (
          <Card>
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Briefcase className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <h2 className="font-bold text-foreground">{job.title}</h2>
                    <Badge variant="outline" className="text-[10px] border-emerald-400 text-emerald-700 bg-emerald-50">掲載中</Badge>
                  </div>
                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mb-3">
                    <span className="flex items-center gap-1"><Briefcase className="w-3 h-3" />{job.employmentType}</span>
                    <span className="flex items-center gap-1"><Banknote className="w-3 h-3" />{job.salary}</span>
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{job.area}</span>
                  </div>
                  <p className="text-sm text-foreground whitespace-pre-line">{job.description}</p>
                  {job.requirements && (
                    <div className="mt-3 p-3 rounded bg-muted/50">
                      <p className="text-xs font-semibold text-foreground mb-1">応募条件</p>
                      <p className="text-xs text-muted-foreground whitespace-pre-line">{job.requirements}</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Application form */}
        {job && (
          <Card>
            <CardContent className="p-5">
              <h2 className="font-bold text-foreground mb-4">応募フォーム</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>お名前 <span className="text-destructive">*</span></Label>
                    <Input
                      value={form.name}
                      onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                      placeholder="山田 太郎"
                      required
                      data-testid="input-apply-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>電話番号 <span className="text-destructive">*</span></Label>
                    <Input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                      placeholder="090-0000-0000"
                      required
                      data-testid="input-apply-phone"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>メールアドレス <span className="text-destructive">*</span></Label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                    placeholder="example@email.com"
                    required
                    data-testid="input-apply-email"
                  />
                </div>
                <div className="space-y-2">
                  <Label>保有免許</Label>
                  <Select onValueChange={(v) => setForm((p) => ({ ...p, licenseType: v }))}>
                    <SelectTrigger data-testid="select-license">
                      <SelectValue placeholder="選択してください" />
                    </SelectTrigger>
                    <SelectContent>
                      {LICENSE_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-3">
                  <Checkbox
                    id="blackNumber"
                    checked={form.hasBlackNumber}
                    onCheckedChange={(v) => setForm((p) => ({ ...p, hasBlackNumber: v === true }))}
                    data-testid="checkbox-black-number"
                  />
                  <Label htmlFor="blackNumber" className="cursor-pointer">黒ナンバーを保有している</Label>
                </div>
                <div className="space-y-2">
                  <Label>稼働可能エリア</Label>
                  <Input
                    value={form.availableAreas}
                    onChange={(e) => setForm((p) => ({ ...p, availableAreas: e.target.value }))}
                    placeholder="例: 神奈川県全域、東京都内"
                    data-testid="input-apply-areas"
                  />
                </div>
                <div className="space-y-2">
                  <Label>その他メッセージ</Label>
                  <Textarea
                    value={form.message}
                    onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
                    placeholder="自己PR・質問などがあればご記入ください"
                    rows={3}
                    data-testid="textarea-apply-message"
                  />
                </div>
                <div className="pt-2 p-3 rounded-lg bg-muted/50 text-xs text-muted-foreground">
                  ご応募いただいた情報は、採用担当企業へ通知されます。
                </div>
                <Button
                  type="submit"
                  className="w-full h-11"
                  disabled={applyMutation.isPending}
                  data-testid="button-submit-apply"
                >
                  {applyMutation.isPending ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />送信中...</>
                  ) : "この求人に応募する"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
