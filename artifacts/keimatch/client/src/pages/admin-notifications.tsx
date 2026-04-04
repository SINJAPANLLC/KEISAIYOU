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
import { Bell, Send, Mail, Loader2, Pencil, CheckCircle, XCircle, Search, Users } from "lucide-react";

type NotificationTemplate = {
  id: string;
  name: string;
  subject: string | null;
  body: string;
  triggerEvent: string | null;
  isActive: boolean;
};

const TRIGGER_LABELS: Record<string, string> = {
  new_application:       "新規応募時",
  job_approved:          "求人承認時",
  refund_request:        "返金申請受付時",
  registration_complete: "会員登録完了時",
};

export default function AdminNotifications() {
  const { toast } = useToast();

  // Template state
  const [editing, setEditing] = useState<NotificationTemplate | null>(null);
  const [formSubject, setFormSubject] = useState("");
  const [formBody, setFormBody] = useState("");

  // Send state
  const [sendTarget, setSendTarget] = useState("all");
  const [sendTitle, setSendTitle] = useState("");
  const [sendMessage, setSendMessage] = useState("");
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [userSearch, setUserSearch] = useState("");

  // ── Queries ──
  const { data: templates = [], isLoading: tmplLoading } = useQuery<NotificationTemplate[]>({
    queryKey: ["/api/admin/notification-templates?channel=email&category=auto_reply"],
    queryFn: () =>
      apiRequest("GET", "/api/admin/notification-templates?channel=email&category=auto_reply")
        .then((r) => r.json()),
  });

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

  // ── Mutations ──
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      apiRequest("PATCH", `/api/admin/notification-templates/${id}`, data).then((r) => r.json()),
    onSuccess: () => {
      toast({ title: "テンプレートを更新しました" });
      queryClient.invalidateQueries({ predicate: (q) => (q.queryKey[0] as string)?.includes("notification-templates") });
      setEditing(null);
    },
    onError: () => toast({ variant: "destructive", title: "更新に失敗しました" }),
  });

  const sendMutation = useMutation({
    mutationFn: () => {
      const payload: any = { title: sendTitle, message: sendMessage, target: sendTarget, channels: ["system", "email"] };
      if (sendTarget === "selected") payload.userIds = selectedUserIds;
      return apiRequest("POST", "/api/admin/notifications/send", payload).then((r) => r.json());
    },
    onSuccess: (data) => {
      const r = data.results || {};
      const parts = [];
      if (r.system) parts.push(`システム${r.system}件`);
      if (r.email)  parts.push(`メール${r.email}件`);
      toast({ title: "通知を送信しました", description: parts.join("、") || `${data.count}人` });
      setSendTitle(""); setSendMessage(""); setSendTarget("all");
      setSelectedUserIds([]); setUserSearch("");
    },
    onError: () => toast({ variant: "destructive", title: "送信に失敗しました" }),
  });

  const startEdit = (t: NotificationTemplate) => {
    setEditing(t);
    setFormSubject(t.subject || "");
    setFormBody(t.body || "");
  };

  const handleSave = () => {
    if (!editing || !formSubject.trim() || !formBody.trim()) return;
    updateMutation.mutate({ id: editing.id, data: { subject: formSubject, body: formBody } });
  };

  const toggleUser = (id: string) =>
    setSelectedUserIds((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);

  const emailConfigured = channelStatus?.email?.configured;

  return (
    <DashboardLayout>
      <div className="px-4 sm:px-6 py-6 space-y-6 max-w-5xl mx-auto">
        <div className="rounded-xl p-6 hero-gradient relative overflow-hidden">
          <div className="hero-grid absolute inset-0 opacity-30" />
          <div className="relative z-10 flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="text-white/80 text-xs mb-0.5">NOTIFICATIONS</p>
              <h1 className="text-2xl font-bold text-white" data-testid="text-page-title">通知管理</h1>
              <p className="text-white/70 text-sm mt-1">自動返信メール設定・ユーザー通知送信</p>
            </div>
            <Badge
              variant={emailConfigured ? "default" : "secondary"}
              className="text-xs"
            >
              {emailConfigured
                ? <><CheckCircle className="w-3 h-3 mr-1" />メール設定済み</>
                : <><XCircle className="w-3 h-3 mr-1" />メール未設定</>}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* ── 自動返信メール ── */}
          <div className="space-y-4">
            <h2 className="text-sm font-bold flex items-center gap-2">
              <Mail className="w-4 h-4 text-primary" />自動返信メールテンプレート
            </h2>

            {tmplLoading ? (
              <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
            ) : templates.length === 0 ? (
              <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">テンプレートがありません</CardContent></Card>
            ) : (
              <div className="space-y-2">
                {templates.map((t) => (
                  <Card
                    key={t.id}
                    className={`border cursor-pointer transition-colors ${editing?.id === t.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}
                    onClick={() => editing?.id === t.id ? setEditing(null) : startEdit(t)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <p className="text-sm font-semibold">{t.name}</p>
                            {t.triggerEvent && (
                              <Badge variant="outline" className="text-[10px]">
                                {TRIGGER_LABELS[t.triggerEvent] || t.triggerEvent}
                              </Badge>
                            )}
                            <Badge variant={t.isActive ? "default" : "secondary"} className="text-[10px]">
                              {t.isActive ? "有効" : "無効"}
                            </Badge>
                          </div>
                          {t.subject && <p className="text-xs text-muted-foreground truncate">件名: {t.subject}</p>}
                          <p className="text-xs text-muted-foreground truncate mt-0.5">{t.body.substring(0, 60)}…</p>
                        </div>
                        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
                          <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                        </Button>
                      </div>

                      {/* Inline editor */}
                      {editing?.id === t.id && (
                        <div className="mt-4 space-y-3 border-t border-border pt-4" onClick={(e) => e.stopPropagation()}>
                          <div className="space-y-1">
                            <Label className="text-xs">件名</Label>
                            <Input value={formSubject} onChange={(e) => setFormSubject(e.target.value)} className="text-sm" />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">本文</Label>
                            <Textarea value={formBody} onChange={(e) => setFormBody(e.target.value)} rows={8} className="text-sm font-mono resize-y" />
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" className="flex-1" onClick={() => setEditing(null)}>キャンセル</Button>
                            <Button size="sm" className="flex-1" onClick={handleSave} disabled={updateMutation.isPending}>
                              {updateMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "保存"}
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* ── ユーザー通知送信 ── */}
          <div className="space-y-4">
            <h2 className="text-sm font-bold flex items-center gap-2">
              <Bell className="w-4 h-4 text-primary" />ユーザーへ通知を送る
            </h2>

            <Card>
              <CardContent className="p-5 space-y-4">
                {/* 送信対象 */}
                <div className="space-y-1.5">
                  <Label className="text-xs">送信対象</Label>
                  <Select value={sendTarget} onValueChange={(v) => { setSendTarget(v); setSelectedUserIds([]); }}>
                    <SelectTrigger data-testid="select-send-target"><SelectValue /></SelectTrigger>
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
                    <div className="border border-border rounded-md max-h-44 overflow-y-auto">
                      {filteredUsers.length === 0 ? (
                        <p className="text-xs text-muted-foreground text-center py-4"><Users className="w-4 h-4 mx-auto mb-1 opacity-40" />ユーザーなし</p>
                      ) : filteredUsers.map((u: any) => (
                        <label key={u.id} className={`flex items-center gap-2 px-3 py-2 text-xs cursor-pointer hover:bg-muted/50 border-b border-border/50 last:border-0 ${selectedUserIds.includes(u.id) ? "bg-primary/5" : ""}`}>
                          <input
                            type="checkbox"
                            checked={selectedUserIds.includes(u.id)}
                            onChange={() => toggleUser(u.id)}
                            className="rounded"
                          />
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
                  <Label className="text-xs">タイトル <span className="text-destructive">*</span></Label>
                  <Input
                    value={sendTitle}
                    onChange={(e) => setSendTitle(e.target.value)}
                    placeholder="例: 重要なお知らせ"
                    data-testid="input-send-title"
                  />
                </div>

                {/* 本文 */}
                <div className="space-y-1.5">
                  <Label className="text-xs">本文 <span className="text-destructive">*</span></Label>
                  <Textarea
                    value={sendMessage}
                    onChange={(e) => setSendMessage(e.target.value)}
                    placeholder="通知の内容..."
                    rows={5}
                    data-testid="input-send-message"
                  />
                </div>

                <p className="text-xs text-muted-foreground">システム通知とメールの両方に送信されます</p>

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
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
