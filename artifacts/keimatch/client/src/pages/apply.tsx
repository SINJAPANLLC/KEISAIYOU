import { useState } from "react";
import { useRoute } from "wouter";
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
import { MapPin, Banknote, Briefcase, CheckCircle2, Loader2, Building2 } from "lucide-react";

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
  companyName?: string | null;
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
    onSuccess: () => setSubmitted(true),
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

  const companyDisplay = job?.companyName || "掲載企業";

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 className="w-10 h-10 text-emerald-600" />
          </div>
          <h1 className="text-xl font-bold mb-2">応募を受け付けました</h1>
          <p className="text-muted-foreground text-sm leading-relaxed mb-2">
            ご応募ありがとうございます。
          </p>
          <p className="text-muted-foreground text-sm leading-relaxed mb-6">
            <span className="font-semibold text-foreground">{companyDisplay}</span>の担当者より<br />
            折り返しご連絡いたします。しばらくお待ちください。
          </p>
          <div className="p-3 rounded-lg bg-muted/50 text-xs text-muted-foreground">
            ※ 連絡はご登録のメールまたは電話番号宛に届きます
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
      {/* Header — company branded, no KEI SAIYOU logo */}
      <div className="bg-white border-b border-orange-100 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            {isLoading ? (
              <div className="h-4 w-32 bg-muted rounded animate-pulse" />
            ) : (
              <p className="font-bold text-foreground text-sm leading-tight">{companyDisplay}</p>
            )}
            <p className="text-xs text-muted-foreground">採用情報</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        {/* Job info card */}
        {isLoading ? (
          <Card><CardContent className="p-6 flex items-center justify-center h-24">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </CardContent></Card>
        ) : isError || !job ? (
          <Card><CardContent className="p-6 text-center">
            <p className="text-muted-foreground">この求人は見つかりません</p>
          </CardContent></Card>
        ) : (
          <Card className="border-orange-100">
            <CardContent className="p-5">
              <h1 className="text-lg font-bold text-foreground mb-3">{job.title}</h1>
              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mb-4">
                <span className="flex items-center gap-1"><Briefcase className="w-3 h-3 text-orange-500" />{job.employmentType}</span>
                <span className="flex items-center gap-1"><Banknote className="w-3 h-3 text-orange-500" />{job.salary}</span>
                <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-orange-500" />{job.area}</span>
              </div>
              <p className="text-sm text-foreground whitespace-pre-line leading-relaxed">{job.description}</p>
              {job.requirements && (
                <div className="mt-4 p-3 rounded-lg bg-orange-50 border border-orange-100">
                  <p className="text-xs font-semibold text-foreground mb-1">応募条件</p>
                  <p className="text-xs text-muted-foreground whitespace-pre-line">{job.requirements}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Application form */}
        {job && (
          <Card className="border-orange-100">
            <CardContent className="p-5">
              <h2 className="font-bold text-foreground mb-1">応募フォーム</h2>
              <p className="text-xs text-muted-foreground mb-4">以下にご記入の上、送信ボタンを押してください</p>
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
                <div className="p-3 rounded-lg bg-muted/40 text-xs text-muted-foreground leading-relaxed">
                  ご応募いただいた情報は、<span className="font-semibold">{companyDisplay}</span>の採用担当者へ通知されます。
                </div>
                <Button
                  type="submit"
                  className="w-full h-12 text-base font-bold"
                  disabled={applyMutation.isPending}
                  data-testid="button-submit-apply"
                >
                  {applyMutation.isPending ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />送信中...</>
                  ) : `${companyDisplay}に応募する`}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        <p className="text-center text-xs text-muted-foreground pb-4">
          Powered by KEI SAIYOU 軽貨物採用プラットフォーム
        </p>
      </div>
    </div>
  );
}
