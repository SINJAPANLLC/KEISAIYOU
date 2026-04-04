import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import DashboardLayout from "@/components/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Bell, Send, Mail, Loader2, Pencil, CheckCircle, XCircle,
  Search, Users, CreditCard, FileCheck, UserCheck, KeyRound,
  ChevronDown, ChevronUp, MailCheck,
} from "lucide-react";

type NotificationTemplate = {
  id: string;
  name: string;
  subject: string | null;
  body: string;
  triggerEvent: string | null;
  isActive: boolean;
  category: string | null;
};

// KEI SAIYOU で実際に使うトリガーイベント
const SAIYOU_EVENTS = [
  "new_application",
  "job_published",
  "registration_complete",
  "payment_failed",
  "password_reset",
  "user_approved",
];

const EVENT_META: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  new_application:      { label: "新規応募時",         icon: <MailCheck className="w-4 h-4" />,  color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  job_published:        { label: "求人掲載時",         icon: <FileCheck className="w-4 h-4" />,  color: "bg-blue-50 text-blue-700 border-blue-200" },
  registration_complete:{ label: "会員登録完了時",     icon: <UserCheck className="w-4 h-4" />,  color: "bg-violet-50 text-violet-700 border-violet-200" },
  payment_failed:       { label: "決済失敗時",         icon: <CreditCard className="w-4 h-4" />, color: "bg-red-50 text-red-700 border-red-200" },
  password_reset:       { label: "パスワードリセット時", icon: <KeyRound className="w-4 h-4" />, color: "bg-amber-50 text-amber-700 border-amber-200" },
  user_approved:        { label: "アカウント承認時",   icon: <CheckCircle className="w-4 h-4" />,color: "bg-orange-50 text-orange-700 border-orange-200" },
};

function TemplateCard({ t }: { t: NotificationTemplate }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [formSubject, setFormSubject] = useState(t.subject || "");
  const [formBody, setFormBody]       = useState(t.body || "");

  const meta = t.triggerEvent ? EVENT_META[t.triggerEvent] : null;

  const updateMutation = useMutation({
    mutationFn: (data: any) =>
      apiRequest("PATCH", `/api/admin/notification-templates/${t.id}`, data).then((r) => r.json()),
    onSuccess: () => {
      toast({ title: "テンプレートを更新しました" });
      queryClient.invalidateQueries({ predicate: (q) => (q.queryKey[0] as string)?.includes("notification-templates") });
      setOpen(false);
    },
    onError: () => toast({ variant: "destructive", title: "更新に失敗しました" }),
  });

  return (
    <div className={`border rounded-xl overflow-hidden transition-all ${open ? "border-primary shadow-sm" : "border-border hover:border-primary/30"}`}>
      {/* Header row */}
      <button
        className="w-full text-left px-4 py-3.5 flex items-center gap-3"
        onClick={() => {
          if (!open) { setFormSubject(t.subject || ""); setFormBody(t.body || ""); }
          setOpen((v) => !v);
        }}
      >
        {meta && (
          <span className={`flex items-center gap-1.5 text-[11px] font-semibold border px-2 py-1 rounded-full shrink-0 ${meta.color}`}>
            {meta.icon}{meta.label}
          </span>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate">{t.name}</p>
          {t.subject && !open && (
            <p className="text-xs text-muted-foreground truncate mt-0.5">件名: {t.subject}</p>
          )}
        </div>
        <Badge variant={t.isActive ? "default" : "secondary"} className="text-[10px] shrink-0">
          {t.isActive ? "有効" : "無効"}
        </Badge>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" /> : <Pencil className="w-3.5 h-3.5 text-muted-foreground shrink-0" />}
      </button>

      {/* Inline editor */}
      {open && (
        <div className="px-4 pb-4 border-t border-border space-y-3 pt-3 bg-muted/20">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">件名</Label>
            <Input value={formSubject} onChange={(e) => setFormSubject(e.target.value)} className="text-sm bg-white" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">本文</Label>
            <Textarea
              value={formBody}
              onChange={(e) => setFormBody(e.target.value)}
              rows={10}
              className="text-xs font-mono resize-y bg-white"
            />
            <p className="text-[10px] text-muted-foreground">
              使用可能変数: {"{{companyName}}"} {"{{jobTitle}}"} {"{{applicantName}}"} {"{{dashboardUrl}}"}
            </p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="flex-1" onClick={() => setOpen(false)}>キャンセル</Button>
            <Button
              size="sm" className="flex-1"
              onClick={() => updateMutation.mutate({ subject: formSubject, body: formBody })}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "保存"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminNotifications() {
  const { toast } = useToast();

  const [sendTarget, setSendTarget]       = useState("all");
  const [sendTitle, setSendTitle]         = useState("");
  const [sendMessage, setSendMessage]     = useState("");
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [userSearch, setUserSearch]       = useState("");

  const { data: allTemplates = [], isLoading: tmplLoading } = useQuery<NotificationTemplate[]>({
    queryKey: ["/api/admin/notification-templates"],
    queryFn: () => apiRequest("GET", "/api/admin/notification-templates").then((r) => r.json()),
  });

  // KEI SAIYOU 関連のみ表示
  const templates = allTemplates.filter(
    (t) => t.triggerEvent && SAIYOU_EVENTS.includes(t.triggerEvent)
  );

  const autoNotifications = templates.filter((t) => t.category !== "auto_reply");
  const autoReplies       = templates.filter((t) => t.category === "auto_reply");

  const { data: allUsers = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/users"],
    queryFn: () => apiRequest("GET", "/api/admin/users").then((r) => r.json()),
  });

  const { data: channelStatus } = useQuery<any>({
    queryKey: ["/api/admin/notification-channels/status"],
  });

  const filteredUsers = allUsers.filter((u: any) => {
    if (!u.approved || u.role === "admin") return false;
    if (!userSearch) return true;
    const q = userSearch.toLowerCase();
    return (u.companyName || "").toLowerCase().includes(q) || (u.email || "").toLowerCase().includes(q);
  });

  const sendMutation = useMutation({
    mutationFn: () => {
      const payload: any = { title: sendTitle, message: sendMessage, target: sendTarget, channels: ["system", "email"] };
      if (sendTarget === "selected") payload.userIds = selectedUserIds;
      return apiRequest("POST", "/api/admin/notifications/send", payload).then((r) => r.json());
    },
    onSuccess: (data) => {
      const r = data.results || {};
      const parts: string[] = [];
      if (r.system) parts.push(`システム${r.system}件`);
      if (r.email)  parts.push(`メール${r.email}件`);
      toast({ title: "通知を送信しました", description: parts.join("、") || `${data.count}人` });
      setSendTitle(""); setSendMessage(""); setSendTarget("all");
      setSelectedUserIds([]); setUserSearch("");
    },
    onError: () => toast({ variant: "destructive", title: "送信に失敗しました" }),
  });

  const emailConfigured = channelStatus?.email?.configured;

  return (
    <DashboardLayout>
      <div className="flex flex-col h-full">

        {/* Header */}
        <div className="px-6 py-4 hero-gradient relative overflow-hidden shrink-0">
          <div className="hero-grid absolute inset-0 opacity-30" />
          <div className="relative z-10 flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="text-white/70 text-xs mb-0.5 tracking-widest">NOTIFICATIONS</p>
              <h1 className="text-xl font-bold text-white">通知管理</h1>
              <p className="text-white/60 text-xs mt-0.5">自動メール設定 / 一斉送信</p>
            </div>
            <Badge
              variant="outline"
              className={`text-xs border ${emailConfigured ? "border-emerald-300 text-emerald-100 bg-emerald-900/30" : "border-red-300 text-red-100 bg-red-900/30"}`}
            >
              {emailConfigured
                ? <><CheckCircle className="w-3 h-3 mr-1" />SMTP設定済み</>
                : <><XCircle className="w-3 h-3 mr-1" />SMTP未設定</>}
            </Badge>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-1 min-h-0 overflow-hidden">

          {/* LEFT: Templates */}
          <div className="flex-1 overflow-y-auto p-5 border-r border-border space-y-5">

            {/* Auto-notifications */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Bell className="w-4 h-4 text-primary" />
                <h2 className="text-sm font-bold">自動通知メール</h2>
                <span className="text-[11px] text-muted-foreground ml-1">イベント発生時に企業へ自動送信</span>
              </div>
              {tmplLoading ? (
                <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}</div>
              ) : autoNotifications.length === 0 ? (
                <div className="border border-dashed border-border rounded-xl p-6 text-center text-xs text-muted-foreground">テンプレートがありません</div>
              ) : (
                <div className="space-y-2">
                  {autoNotifications.map((t) => <TemplateCard key={t.id} t={t} />)}
                </div>
              )}
            </div>

            {/* Auto-replies */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Mail className="w-4 h-4 text-primary" />
                <h2 className="text-sm font-bold">自動返信メール</h2>
                <span className="text-[11px] text-muted-foreground ml-1">ユーザー操作に対する返信</span>
              </div>
              {tmplLoading ? (
                <div className="space-y-2">{Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}</div>
              ) : autoReplies.length === 0 ? (
                <div className="border border-dashed border-border rounded-xl p-6 text-center text-xs text-muted-foreground">テンプレートがありません</div>
              ) : (
                <div className="space-y-2">
                  {autoReplies.map((t) => <TemplateCard key={t.id} t={t} />)}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: Manual send */}
          <div className="w-[340px] shrink-0 overflow-y-auto p-5">
            <div className="flex items-center gap-2 mb-3">
              <Send className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-bold">一斉・個別送信</h2>
            </div>

            <div className="space-y-4">
              {/* 送信対象 */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">送信対象</Label>
                <Select value={sendTarget} onValueChange={(v) => { setSendTarget(v); setSelectedUserIds([]); }}>
                  <SelectTrigger className="text-sm" data-testid="select-send-target"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全ユーザー</SelectItem>
                    <SelectItem value="selected">個別選択</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 個別選択 */}
              {sendTarget === "selected" && (
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    <Input
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      placeholder="会社名・メールで検索..."
                      className="pl-8 h-8 text-sm"
                    />
                  </div>
                  <div className="border border-border rounded-lg max-h-40 overflow-y-auto text-xs">
                    {filteredUsers.length === 0 ? (
                      <p className="text-muted-foreground text-center py-4"><Users className="w-4 h-4 mx-auto mb-1 opacity-40" />ユーザーなし</p>
                    ) : filteredUsers.map((u: any) => (
                      <label key={u.id} className={`flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-muted/50 border-b border-border/50 last:border-0 ${selectedUserIds.includes(u.id) ? "bg-primary/5" : ""}`}>
                        <input type="checkbox" checked={selectedUserIds.includes(u.id)}
                          onChange={() => setSelectedUserIds((p) => p.includes(u.id) ? p.filter((x) => x !== u.id) : [...p, u.id])}
                          className="rounded" />
                        <div className="min-w-0">
                          <p className="font-medium truncate">{u.companyName || u.username}</p>
                          <p className="text-muted-foreground truncate">{u.email}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                  {selectedUserIds.length > 0 && (
                    <p className="text-xs text-primary font-medium">{selectedUserIds.length}人選択中</p>
                  )}
                </div>
              )}

              {/* タイトル */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">タイトル <span className="text-destructive">*</span></Label>
                <Input
                  value={sendTitle}
                  onChange={(e) => setSendTitle(e.target.value)}
                  placeholder="例: 重要なお知らせ"
                  className="text-sm"
                  data-testid="input-send-title"
                />
              </div>

              {/* 本文 */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">本文 <span className="text-destructive">*</span></Label>
                <Textarea
                  value={sendMessage}
                  onChange={(e) => setSendMessage(e.target.value)}
                  placeholder="通知の内容..."
                  rows={6}
                  className="text-sm resize-y"
                  data-testid="input-send-message"
                />
              </div>

              <p className="text-[11px] text-muted-foreground">システム通知とメールの両方に送信されます</p>

              <Button
                className="w-full"
                onClick={() => sendMutation.mutate()}
                disabled={
                  !sendTitle.trim() || !sendMessage.trim() || sendMutation.isPending ||
                  (sendTarget === "selected" && selectedUserIds.length === 0)
                }
                data-testid="button-send-notification"
              >
                {sendMutation.isPending
                  ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />送信中...</>
                  : <><Send className="w-4 h-4 mr-2" />{sendTarget === "selected" ? `${selectedUserIds.length}人に送信` : "全ユーザーに送信"}</>}
              </Button>
            </div>
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
}
