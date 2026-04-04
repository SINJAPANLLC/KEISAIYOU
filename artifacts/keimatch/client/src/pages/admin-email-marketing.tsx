import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import DashboardLayout from "@/components/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Users, Send, Trash2, Search, Plus, Clock, AlertCircle } from "lucide-react";

type Lead = {
  id: string;
  companyName: string;
  email?: string;
  phone?: string;
  status: string;
  sentAt?: string;
  createdAt: string;
};

const TEMPLATES = [
  {
    name: "初回営業",
    subject: "【軽貨物ドライバー採用】KEI SAIYOUのご案内",
    body: `{{companyName}} ご担当者様\n\nはじめまして。軽貨物ドライバー採用プラットフォーム「KEI SAIYOU」の和哉と申します。\n\n軽貨物ドライバーの採用にお困りではございませんか？\n\nKEI SAIYOUは、応募通知ごとに¥3,000のシンプルな料金体系で、効率的にドライバーを採用できるサービスです。\n\n▶ 初期費用・月額費用は一切なし\n▶ 応募が来たときだけ課金される完全成功報酬型\n▶ 最短で求人掲載スタート\n\nご興味がございましたら、無料登録をお試しください。\nhttps://kei-saiyou.jp/register\n\n─\nKEI SAIYOU（合同会社SIN JAPAN）`,
  },
  {
    name: "フォローアップ",
    subject: "【再送】KEI SAIYOUの軽貨物採用サービス",
    body: `{{companyName}} ご担当者様\n\n先日ご案内いたしましたKEI SAIYOUについて、改めてご連絡させていただきます。\n\n初月で複数名の採用に成功された企業様もいらっしゃいます。\n\n無料でお試しいただけますので、ぜひご検討ください。\nhttps://kei-saiyou.jp/register\n\n─\nKEI SAIYOU（合同会社SIN JAPAN）`,
  },
];

export default function AdminEmailMarketing() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [emailForm, setEmailForm] = useState({ subject: "", body: "" });
  const [singleForm, setSingleForm] = useState({ companyName: "", email: "", phone: "" });
  const [sending, setSending] = useState(false);

  const { data: leads = [], isLoading } = useQuery<Lead[]>({
    queryKey: ["/api/admin/sales/leads"],
    queryFn: () => apiRequest("GET", "/api/admin/sales/leads").then((r) => r.json()),
  });

  const importMutation = useMutation({
    mutationFn: (rows: any[]) => apiRequest("POST", "/api/admin/sales/leads", rows).then((r) => r.json()),
    onSuccess: (data) => { queryClient.invalidateQueries({ queryKey: ["/api/admin/sales/leads"] }); toast({ title: `${data.inserted}件インポートしました` }); },
    onError: () => toast({ variant: "destructive", title: "インポートに失敗しました" }),
  });

  const addOneMutation = useMutation({
    mutationFn: (row: typeof singleForm) => apiRequest("POST", "/api/admin/sales/leads", [row]).then((r) => r.json()),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/admin/sales/leads"] }); setSingleForm({ companyName: "", email: "", phone: "" }); toast({ title: "追加しました" }); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/sales/leads/${id}`).then((r) => r.json()),
    onSuccess: (_, id) => { queryClient.invalidateQueries({ queryKey: ["/api/admin/sales/leads"] }); setSelectedIds((p) => p.filter((x) => x !== id)); },
  });

  const handleCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const lines = text.trim().split("\n");
    if (lines.length < 2) return toast({ variant: "destructive", title: "CSVデータが空です" });
    const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
    const rows = lines.slice(1).map((line) => {
      const vals = line.split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
      const obj: any = {};
      headers.forEach((h, i) => { obj[h] = vals[i] || ""; });
      return {
        companyName: obj.companyName || obj.company_name || obj["会社名"] || "不明",
        email: obj.email || obj["メール"] || obj["メールアドレス"] || "",
        phone: obj.phone || obj["電話"] || obj["電話番号"] || "",
        industry: "軽貨物", source: "csv",
      };
    }).filter((r) => r.companyName !== "不明");
    if (!rows.length) return toast({ variant: "destructive", title: "有効データがありません" });
    importMutation.mutate(rows);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSend = async () => {
    if (!selectedIds.length) return toast({ variant: "destructive", title: "送信先を選択してください" });
    if (!emailForm.subject || !emailForm.body) return toast({ variant: "destructive", title: "件名・本文を入力してください" });
    setSending(true);
    try {
      const res = await apiRequest("POST", "/api/admin/sales/send", { leadIds: selectedIds, subject: emailForm.subject, body: emailForm.body });
      const data = await res.json();
      queryClient.invalidateQueries({ queryKey: ["/api/admin/sales/leads"] });
      setSelectedIds([]);
      toast({ title: `${data.sentCount}件送信完了（失敗: ${data.failedCount}件）` });
    } catch { toast({ variant: "destructive", title: "送信に失敗しました" }); }
    finally { setSending(false); }
  };

  const filtered = leads.filter((l) => !search || l.companyName.toLowerCase().includes(search.toLowerCase()) || l.email?.toLowerCase().includes(search.toLowerCase()));
  const toggleSelect = (id: string) => setSelectedIds((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);
  const toggleAll = () => { const ids = filtered.filter((l) => l.email).map((l) => l.id); setSelectedIds(selectedIds.length === ids.length ? [] : ids); };

  return (
    <DashboardLayout>
      <div className="px-4 sm:px-6 py-6 max-w-5xl mx-auto">
        <div className="rounded-xl p-6 mb-6 hero-gradient relative overflow-hidden">
          <div className="hero-grid absolute inset-0 opacity-30" />
          <div className="relative z-10">
            <p className="text-white/80 text-xs mb-0.5">SALES</p>
            <h1 className="text-2xl font-bold text-white" data-testid="text-page-title">営業メール管理</h1>
            <p className="text-white/70 text-sm mt-1">リード管理・一括メール送信</p>
          </div>
        </div>

        <Tabs defaultValue="leads">
          <TabsList className="mb-4">
            <TabsTrigger value="leads">リスト管理 ({leads.length})</TabsTrigger>
            <TabsTrigger value="send">メール送信</TabsTrigger>
          </TabsList>

          <TabsContent value="leads" className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="会社名・メールで検索..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
              </div>
              <input ref={fileInputRef} type="file" accept=".csv" onChange={handleCSV} className="hidden" />
              <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={importMutation.isPending}>
                <Upload className="w-4 h-4 mr-1" />CSVインポート
              </Button>
            </div>
            <Card><CardContent className="p-4">
              <p className="text-xs font-semibold text-muted-foreground mb-3">1件追加</p>
              <div className="flex flex-col sm:flex-row gap-2">
                <Input value={singleForm.companyName} onChange={(e) => setSingleForm((p) => ({ ...p, companyName: e.target.value }))} placeholder="会社名 *" className="flex-1" />
                <Input value={singleForm.email} onChange={(e) => setSingleForm((p) => ({ ...p, email: e.target.value }))} placeholder="メールアドレス" type="email" className="flex-1" />
                <Input value={singleForm.phone} onChange={(e) => setSingleForm((p) => ({ ...p, phone: e.target.value }))} placeholder="電話番号" className="flex-1" />
                <Button size="sm" onClick={() => addOneMutation.mutate(singleForm)} disabled={!singleForm.companyName || addOneMutation.isPending}><Plus className="w-4 h-4 mr-1" />追加</Button>
              </div>
            </CardContent></Card>
            <div className="flex items-center gap-2">
              <Checkbox checked={selectedIds.length > 0 && selectedIds.length === filtered.filter((l) => l.email).length} onCheckedChange={toggleAll} id="all" />
              <label htmlFor="all" className="text-xs text-muted-foreground cursor-pointer">全選択</label>
              <span className="ml-auto text-xs text-muted-foreground">{filtered.length}件</span>
            </div>
            {isLoading ? (
              <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Card key={i}><CardContent className="p-3"><Skeleton className="h-8 w-full" /></CardContent></Card>)}</div>
            ) : filtered.length === 0 ? (
              <Card><CardContent className="p-12 text-center"><Users className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" /><p className="text-sm text-muted-foreground">リードがありません</p></CardContent></Card>
            ) : (
              <div className="space-y-1" data-testid="list-leads">
                {filtered.map((lead) => (
                  <Card key={lead.id} className={`border transition-colors ${selectedIds.includes(lead.id) ? "border-primary bg-primary/5" : "border-border"}`}>
                    <CardContent className="p-3 flex items-center gap-3">
                      <Checkbox checked={selectedIds.includes(lead.id)} onCheckedChange={() => toggleSelect(lead.id)} disabled={!lead.email} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold truncate">{lead.companyName}</p>
                          <Badge variant="outline" className={`text-[10px] shrink-0 ${lead.status === "sent" ? "border-emerald-400 text-emerald-700 bg-emerald-50" : "border-muted-foreground/30 text-muted-foreground"}`}>{lead.status === "sent" ? "送信済" : "未送信"}</Badge>
                        </div>
                        <div className="text-xs text-muted-foreground flex flex-wrap gap-2 mt-0.5">
                          {lead.email ? <span>{lead.email}</span> : <span className="text-red-500">メールなし</span>}
                          {lead.phone && <span>{lead.phone}</span>}
                          {lead.sentAt && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(lead.sentAt).toLocaleDateString("ja-JP")}</span>}
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => deleteMutation.mutate(lead.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="send">
            <Card><CardContent className="p-5 space-y-4">
              <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>「リスト管理」タブで送信先を選択してください（選択中: {selectedIds.length}件）</span>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2">テンプレートを選択</p>
                <div className="flex gap-2 flex-wrap">
                  {TEMPLATES.map((t) => <Button key={t.name} variant="outline" size="sm" className="text-xs h-7" onClick={() => setEmailForm({ subject: t.subject, body: t.body })}>{t.name}</Button>)}
                </div>
              </div>
              <div className="space-y-2">
                <Label>件名 <span className="text-destructive">*</span></Label>
                <Input value={emailForm.subject} onChange={(e) => setEmailForm((p) => ({ ...p, subject: e.target.value }))} placeholder="件名" data-testid="input-email-subject" />
              </div>
              <div className="space-y-2">
                <Label>本文 <span className="text-destructive">*</span></Label>
                <p className="text-xs text-muted-foreground">{"{{companyName}}"} は各会社名に自動置換されます</p>
                <Textarea value={emailForm.body} onChange={(e) => setEmailForm((p) => ({ ...p, body: e.target.value }))} rows={12} placeholder="本文" data-testid="textarea-email-body" />
              </div>
              <Button onClick={handleSend} disabled={sending || !selectedIds.length || !emailForm.subject || !emailForm.body} className="w-full" data-testid="button-send-email">
                {sending ? "送信中..." : <><Send className="w-4 h-4 mr-2" />{selectedIds.length}件に送信する</>}
              </Button>
            </CardContent></Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
