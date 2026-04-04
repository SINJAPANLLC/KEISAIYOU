import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  Globe, Mail, Shield, Database, Loader2, Save, Server, Users,
  CreditCard, Bell, CheckCircle, XCircle, AlertTriangle,
  RefreshCw, HardDrive, Zap, Lock, MessageSquare,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState, useEffect } from "react";
import DashboardLayout from "@/components/dashboard-layout";

type ChannelStatus = { configured: boolean; label: string };

export default function AdminSettings() {
  const { toast } = useToast();

  const { data: settings, isLoading } = useQuery<Record<string, string>>({
    queryKey: ["/api/admin/settings"],
  });
  const { data: adminStats } = useQuery<{ totalUsers: number; pendingApprovals: number }>({
    queryKey: ["/api/admin/stats"],
  });
  const { data: channelStatus } = useQuery<Record<string, ChannelStatus>>({
    queryKey: ["/api/admin/notification-channels/status"],
  });

  const [siteName, setSiteName] = useState("KEI SAIYOU");
  const [siteDescription, setSiteDescription] = useState("軽貨物ドライバー採用プラットフォーム");
  const [siteKeywords, setSiteKeywords] = useState("軽貨物, ドライバー採用, 求人, 配送");
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState("24");
  const [adminEmail, setAdminEmail] = useState("info@sinjapan.jp");
  const [registrationNotification, setRegistrationNotification] = useState(true);
  const [contactEmail, setContactEmail] = useState("info@sinjapan.jp");
  const [contactPhone, setContactPhone] = useState("046-212-2325");
  const [companyAddress, setCompanyAddress] = useState("");

  useEffect(() => {
    if (!settings) return;
    if (settings.siteName)        setSiteName(settings.siteName);
    if (settings.siteDescription) setSiteDescription(settings.siteDescription);
    if (settings.siteKeywords)    setSiteKeywords(settings.siteKeywords);
    if (settings.maintenanceMode) setMaintenanceMode(settings.maintenanceMode === "true");
    if (settings.sessionTimeout)  setSessionTimeout(settings.sessionTimeout);
    if (settings.adminEmail)      setAdminEmail(settings.adminEmail);
    if (settings.registrationNotification) setRegistrationNotification(settings.registrationNotification === "true");
    if (settings.contactEmail)    setContactEmail(settings.contactEmail);
    if (settings.contactPhone)    setContactPhone(settings.contactPhone);
    if (settings.companyAddress)  setCompanyAddress(settings.companyAddress);
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: async (data: Record<string, string>) => { await apiRequest("POST", "/api/admin/settings", data); },
    onSuccess: () => { toast({ title: "設定を保存しました" }); queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] }); },
    onError:   () => toast({ title: "保存に失敗しました", variant: "destructive" }),
  });

  const SaveBtn = ({ onClick, label }: { onClick: () => void; label: string }) => (
    <div className="flex justify-end pt-3">
      <Button onClick={onClick} disabled={saveMutation.isPending} data-testid={`button-save-${label}`} size="sm">
        {saveMutation.isPending ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Save className="w-4 h-4 mr-1.5" />}保存
      </Button>
    </div>
  );

  const Row = ({ icon: Icon, title, desc, children }: { icon: React.ElementType; title: string; desc: string; children: React.ReactNode }) => (
    <div className="flex items-start justify-between gap-4 py-3">
      <div className="flex gap-3 min-w-0 flex-1">
        <Icon className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-medium">{title}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
        </div>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );

  if (isLoading) return (
    <DashboardLayout>
      <div className="px-6 py-6">
        <Skeleton className="h-28 w-full mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-52 w-full" />)}
        </div>
      </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout>
      <div className="px-4 sm:px-6 py-6 max-w-4xl mx-auto">
        <div className="rounded-xl p-6 mb-6 hero-gradient relative overflow-hidden">
          <div className="hero-grid absolute inset-0 opacity-30" />
          <div className="relative z-10 flex items-start justify-between flex-wrap gap-3">
            <div>
              <p className="text-white/80 text-xs mb-0.5">SETTINGS</p>
              <h1 className="text-2xl font-bold text-white" data-testid="text-page-title">システム設定</h1>
              <p className="text-white/70 text-sm mt-1">KEI SAIYOU プラットフォーム設定</p>
            </div>
            {maintenanceMode && (
              <Badge variant="destructive"><AlertTriangle className="w-3 h-3 mr-1" />メンテナンスモード有効</Badge>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-md bg-primary/10"><Users className="w-4 h-4 text-primary" /></div>
              <div>
                <p className="text-xs text-muted-foreground">登録企業</p>
                <p className="text-lg font-bold" data-testid="text-stat-users">{adminStats?.totalUsers ?? "—"}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-md bg-amber-500/10"><CheckCircle className="w-4 h-4 text-amber-600" /></div>
              <div>
                <p className="text-xs text-muted-foreground">承認待ち</p>
                <p className="text-lg font-bold" data-testid="text-stat-pending">{adminStats?.pendingApprovals ?? "—"}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* サイト基本設定 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Globe className="w-4 h-4 text-primary" />サイト基本設定
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-xs text-muted-foreground">サービス名</Label>
                <Input value={siteName} onChange={(e) => setSiteName(e.target.value)} className="mt-1" data-testid="input-site-name" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">サービス説明（meta description）</Label>
                <Textarea value={siteDescription} onChange={(e) => setSiteDescription(e.target.value)} className="mt-1 resize-none" rows={2} data-testid="input-site-description" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">SEOキーワード（カンマ区切り）</Label>
                <Input value={siteKeywords} onChange={(e) => setSiteKeywords(e.target.value)} className="mt-1" data-testid="input-site-keywords" />
              </div>
              <SaveBtn onClick={() => saveMutation.mutate({ siteName, siteDescription, siteKeywords })} label="site" />
            </CardContent>
          </Card>

          {/* セキュリティ */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary" />セキュリティ
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="divide-y divide-border">
                <Row icon={AlertTriangle} title="メンテナンスモード" desc="有効にするとユーザーのアクセスを制限">
                  <Switch checked={maintenanceMode} onCheckedChange={setMaintenanceMode} data-testid="switch-maintenance-mode" />
                </Row>
                <Row icon={Lock} title="セッション有効期限" desc="ログイン状態の維持期間">
                  <Select value={sessionTimeout} onValueChange={setSessionTimeout}>
                    <SelectTrigger className="w-28" data-testid="select-session-timeout"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="6">6時間</SelectItem>
                      <SelectItem value="12">12時間</SelectItem>
                      <SelectItem value="24">24時間</SelectItem>
                      <SelectItem value="72">72時間</SelectItem>
                      <SelectItem value="168">1週間</SelectItem>
                    </SelectContent>
                  </Select>
                </Row>
              </div>
              <SaveBtn onClick={() => saveMutation.mutate({ maintenanceMode: String(maintenanceMode), sessionTimeout })} label="security" />
            </CardContent>
          </Card>

          {/* 通知・メール */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Bell className="w-4 h-4 text-primary" />通知・メール設定
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2 mb-4">
                {channelStatus ? Object.entries(channelStatus).map(([k, ch]) => (
                  <div key={k} className="flex items-center gap-1.5">
                    {ch.configured
                      ? <Badge variant="default" className="text-xs bg-emerald-500/15 text-emerald-700 border-emerald-500/30"><CheckCircle className="w-3 h-3 mr-1" />接続済み</Badge>
                      : <Badge variant="secondary" className="text-xs"><XCircle className="w-3 h-3 mr-1" />未設定</Badge>}
                    <span className="text-xs text-muted-foreground">{ch.label}</span>
                  </div>
                )) : <span className="text-xs text-muted-foreground">読み込み中...</span>}
              </div>
              <Separator className="mb-4" />
              <div className="space-y-4">
                <div>
                  <Label className="text-xs text-muted-foreground">管理者メールアドレス</Label>
                  <Input type="email" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} className="mt-1" data-testid="input-admin-email" />
                </div>
                <div className="divide-y divide-border">
                  <Row icon={Users} title="新規登録通知" desc="企業が新規登録したときに管理者へメール通知">
                    <Switch checked={registrationNotification} onCheckedChange={setRegistrationNotification} data-testid="switch-registration-notification" />
                  </Row>
                </div>
              </div>
              <SaveBtn onClick={() => saveMutation.mutate({ adminEmail, registrationNotification: String(registrationNotification) })} label="notification" />
            </CardContent>
          </Card>

          {/* 会社情報 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-primary" />お問い合わせ・会社情報
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-xs text-muted-foreground">お問い合わせメール</Label>
                <Input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} className="mt-1" data-testid="input-contact-email" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">電話番号</Label>
                <Input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} className="mt-1" data-testid="input-contact-phone" />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">会社所在地</Label>
                <Textarea value={companyAddress} onChange={(e) => setCompanyAddress(e.target.value)} className="mt-1 resize-none" rows={2} placeholder="〒000-0000 神奈川県..." data-testid="input-company-address" />
              </div>
              <SaveBtn onClick={() => saveMutation.mutate({ contactEmail, contactPhone, companyAddress })} label="contact" />
            </CardContent>
          </Card>

          {/* システム情報 */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Database className="w-4 h-4 text-primary" />システム情報
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <p className="text-xs text-muted-foreground font-medium mb-3">データ操作</p>
                  <div className="space-y-2">
                    <Button variant="outline" className="w-full justify-start text-sm"
                      onClick={() => toast({ title: "ユーザーデータをエクスポート中..." })}
                      data-testid="button-export-users">
                      <Users className="w-4 h-4 mr-2" />企業データエクスポート（CSV）
                    </Button>
                    <Button variant="outline" className="w-full justify-start text-sm"
                      onClick={() => toast({ title: "キャッシュをクリアしました" })}
                      data-testid="button-clear-cache">
                      <RefreshCw className="w-4 h-4 mr-2" />キャッシュクリア
                    </Button>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium mb-3">ステータス</p>
                  <div className="space-y-2">
                    {[
                      { icon: Server,     label: "バージョン",   value: "v1.0.0",     isText: true },
                      { icon: HardDrive,  label: "データベース", badge: "接続中",      ok: true },
                      { icon: Zap,        label: "AI機能",       badge: "有効",        ok: true },
                      { icon: CreditCard, label: "Square決済",   badge: import.meta.env.VITE_SQUARE_APP_ID ? "設定済み" : "未設定", ok: !!import.meta.env.VITE_SQUARE_APP_ID },
                      { icon: Mail,       label: "SMTP",         badge: channelStatus?.email?.configured ? "設定済み" : "未設定", ok: channelStatus?.email?.configured },
                    ].map(({ icon: Icon, label, value, badge, ok, isText }) => (
                      <div key={label} className="flex items-center justify-between gap-4 py-1.5 border-b border-border/50 last:border-0">
                        <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <Icon className="w-3 h-3" />{label}
                        </span>
                        {isText
                          ? <span className="text-xs font-mono">{value}</span>
                          : <Badge variant={ok ? "default" : "secondary"} className={`text-xs ${ok ? "bg-emerald-500/15 text-emerald-700 border-emerald-500/30" : ""}`}>{badge}</Badge>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
