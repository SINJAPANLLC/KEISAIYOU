import { useState, useRef, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import DashboardLayout from "@/components/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Upload, Users, Send, Trash2, Search, Plus, Clock, Globe, RefreshCw, Eye, Mail } from "lucide-react";

type Lead = {
  id: string;
  companyName: string;
  email?: string;
  phone?: string;
  prefecture?: string;
  status: string;
  sentAt?: string;
  createdAt: string;
};

const PREFECTURES = [
  "北海道","青森県","岩手県","宮城県","秋田県","山形県","福島県",
  "茨城県","栃木県","群馬県","埼玉県","千葉県","東京都","神奈川県",
  "新潟県","富山県","石川県","福井県","山梨県","長野県","岐阜県",
  "静岡県","愛知県","三重県","滋賀県","京都府","大阪府","兵庫県",
  "奈良県","和歌山県","鳥取県","島根県","岡山県","広島県","山口県",
  "徳島県","香川県","愛媛県","高知県","福岡県","佐賀県","長崎県",
  "熊本県","大分県","宮崎県","鹿児島県","沖縄県",
];

const KEYWORDS = [
  "軽貨物　運送会社", "宅配　業務委託", "ドライバー　採用", "配送会社　軽貨物",
  "軽貨物　求人", "EC配送　委託", "フードデリバリー　委託",
];

const TEMPLATES = [
  {
    name: "初回営業",
    subject: "【軽貨物ドライバー採用】KEI SAIYOUのご案内",
    body: `{{companyName}} ご担当者様

はじめまして。軽貨物ドライバー採用プラットフォーム「KEI SAIYOU」の和哉と申します。

軽貨物ドライバーの採用にお困りではございませんか？

KEI SAIYOUは、応募通知ごとに¥3,000（税別）のシンプルな料金体系で、効率的にドライバーを採用できるサービスです。

▶ 初期費用・月額費用は一切なし
▶ 応募が来たときだけ課金される完全成功報酬型
▶ 最短で求人掲載スタート

ご興味がございましたら、無料登録をお試しください。
https://kei-saiyou.jp/register

─
KEI SAIYOU（合同会社SIN JAPAN）`,
  },
  {
    name: "フォローアップ",
    subject: "【再送】KEI SAIYOUの軽貨物採用サービス",
    body: `{{companyName}} ご担当者様

先日ご案内いたしましたKEI SAIYOUについて、改めてご連絡させていただきます。

初月で複数名の採用に成功された企業様もいらっしゃいます。

無料でお試しいただけますので、ぜひご検討ください。
https://kei-saiyou.jp/register

─
KEI SAIYOU（合同会社SIN JAPAN）`,
  },
];

function buildEmailHtml(subject: string, body: string, previewCompany = "サンプル株式会社"): string {
  const personalized = body
    .replace(/\{\{companyName\}\}/g, previewCompany)
    .replace(/\{\{company_name\}\}/g, previewCompany);
  const lines = personalized.split("\n");
  const htmlLines = lines.map((line) => {
    if (line.startsWith("▶") || line.startsWith("✅") || line.startsWith("☑")) {
      return `<li style="margin:4px 0;">${line}</li>`;
    }
    if (line.startsWith("━")) return `<hr style="border:none;border-top:1px solid #e2e8f0;margin:12px 0;">`;
    if (line.startsWith("■")) return `<p style="font-weight:bold;color:#d05a2a;margin:12px 0 4px;">${line}</p>`;
    if (line.trim() === "") return `<div style="height:8px;"></div>`;
    return `<p style="margin:4px 0;line-height:1.7;">${line}</p>`;
  });
  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="font-family:'Hiragino Sans','Meiryo',sans-serif;font-size:14px;color:#1a202c;max-width:600px;margin:0 auto;padding:24px;">
<div style="background:#d05a2a;color:white;padding:16px 24px;border-radius:8px 8px 0 0;">
  <p style="margin:0;font-size:11px;opacity:.8;">KEI SAIYOU</p>
  <p style="margin:4px 0 0;font-size:18px;font-weight:bold;">${subject || "（件名未入力）"}</p>
</div>
<div style="border:1px solid #e2e8f0;border-top:none;border-radius:0 0 8px 8px;padding:24px;">
${htmlLines.join("\n")}
</div>
<p style="margin-top:16px;font-size:11px;color:#94a3b8;text-align:center;">KEI SAIYOU — 合同会社SIN JAPAN | info@sinjapan.jp</p>
</body></html>`;
}

export default function AdminEmailMarketing() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // List filters
  const [search, setSearch] = useState("");
  const [filterPref, setFilterPref] = useState("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Scrape form
  const [scrapePref, setScrapePref] = useState("");
  const [scrapeKw, setScrapeKw] = useState(KEYWORDS[0]);
  const [crawling, setCrawling] = useState(false);

  // Add single
  const [singleForm, setSingleForm] = useState({ companyName: "", email: "", phone: "", prefecture: "" });

  // Email compose
  const [emailForm, setEmailForm] = useState({ subject: "", body: "" });
  const [sending, setSending] = useState(false);
  const [activeTab, setActiveTab] = useState<"compose" | "preview">("compose");

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/sales/leads"] });
      setSingleForm({ companyName: "", email: "", phone: "", prefecture: "" });
      toast({ title: "追加しました" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/sales/leads/${id}`).then((r) => r.json()),
    onSuccess: (_, id) => { queryClient.invalidateQueries({ queryKey: ["/api/admin/sales/leads"] }); setSelectedIds((p) => p.filter((x) => x !== id)); },
  });

  const handleCrawl = async () => {
    if (!scrapePref || !scrapeKw) return toast({ variant: "destructive", title: "都道府県とキーワードを選択してください" });
    setCrawling(true);
    try {
      const res = await apiRequest("POST", "/api/admin/sales/crawl", { prefecture: scrapePref, keyword: scrapeKw, limit: 30 });
      const data = await res.json();
      queryClient.invalidateQueries({ queryKey: ["/api/admin/sales/leads"] });
      toast({ title: `${data.found}件のリードを取得しました（検索: ${data.searched}件）` });
    } catch {
      toast({ variant: "destructive", title: "クロールに失敗しました" });
    } finally { setCrawling(false); }
  };

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
        prefecture: obj.prefecture || obj["都道府県"] || "",
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

  const prefOptions = useMemo(() => {
    const ps = [...new Set(leads.map((l) => l.prefecture).filter(Boolean) as string[])].sort();
    return ps;
  }, [leads]);

  const filtered = leads.filter((l) => {
    if (filterPref !== "all" && l.prefecture !== filterPref) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return l.companyName.toLowerCase().includes(q) || l.email?.toLowerCase().includes(q) || "";
  });

  const toggleSelect = (id: string) => setSelectedIds((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);
  const emailableFiltered = filtered.filter((l) => l.email);
  const allSelected = emailableFiltered.length > 0 && emailableFiltered.every((l) => selectedIds.includes(l.id));
  const toggleAll = () => {
    const ids = emailableFiltered.map((l) => l.id);
    setSelectedIds(allSelected ? selectedIds.filter((id) => !ids.includes(id)) : [...new Set([...selectedIds, ...ids])]);
  };

  const previewHtml = useMemo(() => buildEmailHtml(emailForm.subject, emailForm.body), [emailForm.subject, emailForm.body]);

  return (
    <DashboardLayout>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="px-6 py-4 hero-gradient relative overflow-hidden shrink-0">
          <div className="hero-grid absolute inset-0 opacity-30" />
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <p className="text-white/80 text-xs mb-0.5">SALES</p>
              <h1 className="text-xl font-bold text-white">営業メール管理</h1>
            </div>
            <div className="flex items-center gap-2 text-white/80 text-xs">
              <Users className="w-3.5 h-3.5" />{leads.length}件
              <span className="ml-2"><Mail className="w-3.5 h-3.5 inline mr-0.5" />{leads.filter((l) => l.status === "sent").length}件送信済</span>
            </div>
          </div>
        </div>

        {/* Split layout */}
        <div className="flex flex-1 overflow-hidden min-h-0">

          {/* ── LEFT PANEL: Lead list ── */}
          <div className="w-[42%] border-r border-border flex flex-col overflow-hidden">

            {/* Scrape controls */}
            <div className="p-3 border-b border-border bg-muted/30 shrink-0">
              <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
                <Globe className="w-3.5 h-3.5" />DuckDuckGoでリスト取得
              </p>
              <div className="flex gap-1.5 mb-1.5">
                <Select value={scrapePref} onValueChange={setScrapePref}>
                  <SelectTrigger className="h-8 text-xs flex-1"><SelectValue placeholder="都道府県" /></SelectTrigger>
                  <SelectContent>{PREFECTURES.map((p) => <SelectItem key={p} value={p} className="text-xs">{p}</SelectItem>)}</SelectContent>
                </Select>
                <Select value={scrapeKw} onValueChange={setScrapeKw}>
                  <SelectTrigger className="h-8 text-xs flex-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{KEYWORDS.map((k) => <SelectItem key={k} value={k} className="text-xs">{k}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <Button size="sm" className="w-full h-8 text-xs" onClick={handleCrawl} disabled={crawling || !scrapePref}>
                {crawling ? <><RefreshCw className="w-3 h-3 mr-1.5 animate-spin" />検索中…</> : <><Search className="w-3 h-3 mr-1.5" />クロール実行</>}
              </Button>
            </div>

            {/* Single add + CSV */}
            <div className="p-3 border-b border-border shrink-0">
              <div className="flex gap-1.5 mb-1.5">
                <Input value={singleForm.companyName} onChange={(e) => setSingleForm((p) => ({ ...p, companyName: e.target.value }))} placeholder="会社名 *" className="h-7 text-xs flex-1" />
                <Input value={singleForm.email} onChange={(e) => setSingleForm((p) => ({ ...p, email: e.target.value }))} placeholder="メール" type="email" className="h-7 text-xs flex-1" />
              </div>
              <div className="flex gap-1.5">
                <Input value={singleForm.phone} onChange={(e) => setSingleForm((p) => ({ ...p, phone: e.target.value }))} placeholder="電話" className="h-7 text-xs flex-1" />
                <Select value={singleForm.prefecture} onValueChange={(v) => setSingleForm((p) => ({ ...p, prefecture: v }))}>
                  <SelectTrigger className="h-7 text-xs w-28"><SelectValue placeholder="都道府県" /></SelectTrigger>
                  <SelectContent>{PREFECTURES.map((p) => <SelectItem key={p} value={p} className="text-xs">{p}</SelectItem>)}</SelectContent>
                </Select>
                <Button size="sm" className="h-7 px-2 text-xs shrink-0" onClick={() => addOneMutation.mutate(singleForm)} disabled={!singleForm.companyName || addOneMutation.isPending}>
                  <Plus className="w-3 h-3" />
                </Button>
              </div>
            </div>

            {/* Search + filter */}
            <div className="p-3 border-b border-border shrink-0">
              <div className="flex gap-1.5">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                  <Input placeholder="検索..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-7 h-7 text-xs" />
                </div>
                <Select value={filterPref} onValueChange={setFilterPref}>
                  <SelectTrigger className="h-7 text-xs w-28"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-xs">全エリア</SelectItem>
                    {prefOptions.map((p) => <SelectItem key={p} value={p} className="text-xs">{p}</SelectItem>)}
                  </SelectContent>
                </Select>
                <input ref={fileInputRef} type="file" accept=".csv" onChange={handleCSV} className="hidden" />
                <Button variant="outline" size="sm" className="h-7 px-2 text-xs shrink-0" onClick={() => fileInputRef.current?.click()} title="CSV">
                  <Upload className="w-3 h-3" />
                </Button>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <Checkbox checked={allSelected} onCheckedChange={toggleAll} id="all" className="w-3.5 h-3.5" />
                <label htmlFor="all" className="text-[10px] text-muted-foreground cursor-pointer">全選択</label>
                <span className="ml-auto text-[10px] text-muted-foreground">{filtered.length}件 / 選択: {selectedIds.length}件</span>
              </div>
            </div>

            {/* Lead list */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-8">
                  <Users className="w-8 h-8 text-muted-foreground/30 mb-2" />
                  <p className="text-xs text-muted-foreground">リードがありません</p>
                </div>
              ) : (
                filtered.map((lead) => (
                  <Card key={lead.id} className={`border transition-colors ${selectedIds.includes(lead.id) ? "border-primary/50 bg-primary/5" : "border-border"}`}>
                    <CardContent className="p-2.5 flex items-center gap-2">
                      <Checkbox checked={selectedIds.includes(lead.id)} onCheckedChange={() => toggleSelect(lead.id)} disabled={!lead.email} className="w-3.5 h-3.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="text-xs font-semibold truncate max-w-[120px]">{lead.companyName}</p>
                          {lead.prefecture && <span className="text-[9px] bg-muted px-1 py-0.5 rounded text-muted-foreground shrink-0">{lead.prefecture}</span>}
                          <Badge variant="outline" className={`text-[9px] shrink-0 px-1 py-0 h-4 ${lead.status === "sent" ? "border-emerald-400 text-emerald-700" : "border-muted-foreground/30 text-muted-foreground"}`}>
                            {lead.status === "sent" ? "送信済" : "未送信"}
                          </Badge>
                        </div>
                        <div className="text-[10px] text-muted-foreground flex flex-wrap gap-x-2 mt-0.5">
                          {lead.email ? <span className="truncate max-w-[150px]">{lead.email}</span> : <span className="text-red-400">メールなし</span>}
                          {lead.sentAt && <span className="flex items-center gap-0.5"><Clock className="w-2.5 h-2.5" />{new Date(lead.sentAt).toLocaleDateString("ja-JP")}</span>}
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground/50 hover:text-destructive shrink-0" onClick={() => deleteMutation.mutate(lead.id)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>

          {/* ── RIGHT PANEL: Compose + Preview ── */}
          <div className="flex-1 flex flex-col overflow-hidden">

            {/* Template selector */}
            <div className="p-3 border-b border-border shrink-0 flex items-center gap-2 flex-wrap">
              <p className="text-xs text-muted-foreground font-semibold">テンプレート:</p>
              {TEMPLATES.map((t) => (
                <Button key={t.name} variant="outline" size="sm" className="text-xs h-7"
                  onClick={() => setEmailForm({ subject: t.subject, body: t.body })}>
                  {t.name}
                </Button>
              ))}
              <div className="ml-auto flex items-center gap-1">
                <Button variant={activeTab === "compose" ? "default" : "outline"} size="sm" className="h-7 text-xs" onClick={() => setActiveTab("compose")}>
                  編集
                </Button>
                <Button variant={activeTab === "preview" ? "default" : "outline"} size="sm" className="h-7 text-xs" onClick={() => setActiveTab("preview")}>
                  <Eye className="w-3 h-3 mr-1" />プレビュー
                </Button>
              </div>
            </div>

            {/* Subject */}
            <div className="px-4 py-2 border-b border-border shrink-0">
              <div className="flex items-center gap-2">
                <Label className="text-xs shrink-0 text-muted-foreground w-8">件名</Label>
                <Input
                  value={emailForm.subject}
                  onChange={(e) => setEmailForm((p) => ({ ...p, subject: e.target.value }))}
                  placeholder="メールの件名..."
                  className="text-sm border-0 shadow-none px-0 focus-visible:ring-0 h-8"
                />
              </div>
            </div>

            {/* Body / Preview */}
            <div className="flex-1 overflow-hidden relative">
              {activeTab === "compose" ? (
                <div className="h-full p-1">
                  <textarea
                    className="w-full h-full resize-none border-0 bg-transparent text-sm p-3 focus:outline-none font-mono text-foreground placeholder:text-muted-foreground"
                    value={emailForm.body}
                    onChange={(e) => setEmailForm((p) => ({ ...p, body: e.target.value }))}
                    placeholder={`本文を入力...\n\n{{companyName}} は各会社名に自動置換されます`}
                    data-testid="textarea-email-body"
                  />
                </div>
              ) : (
                <div className="h-full overflow-y-auto bg-slate-100">
                  <div className="max-w-[600px] mx-auto my-4 shadow-md">
                    <iframe
                      srcDoc={previewHtml}
                      className="w-full border-0"
                      style={{ minHeight: "500px", height: "100%" }}
                      title="メールプレビュー"
                      sandbox="allow-same-origin"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Send bar */}
            <div className="p-3 border-t border-border shrink-0 flex items-center gap-3">
              <div className="text-xs text-muted-foreground">
                送信先: <span className={`font-semibold ${selectedIds.length > 0 ? "text-primary" : "text-muted-foreground"}`}>{selectedIds.length}件</span>
                {selectedIds.length === 0 && <span className="ml-1">（左のリストから選択）</span>}
              </div>
              <Button
                onClick={handleSend}
                disabled={sending || !selectedIds.length || !emailForm.subject || !emailForm.body}
                className="ml-auto"
                data-testid="button-send-email"
              >
                {sending
                  ? <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />送信中...</>
                  : <><Send className="w-4 h-4 mr-2" />{selectedIds.length}件に送信</>}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
