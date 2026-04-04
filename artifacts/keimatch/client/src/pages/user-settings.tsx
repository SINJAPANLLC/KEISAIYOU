import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, Mail, Phone, MapPin, User, Save, Loader2, CheckCircle, Bell, Lock, AlertTriangle, Landmark } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState, useEffect } from "react";
import DashboardLayout from "@/components/dashboard-layout";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const PREFECTURES = [
  "北海道","青森県","岩手県","宮城県","秋田県","山形県","福島県",
  "茨城県","栃木県","群馬県","埼玉県","千葉県","東京都","神奈川県",
  "新潟県","富山県","石川県","福井県","山梨県","長野県","岐阜県",
  "静岡県","愛知県","三重県","滋賀県","京都府","大阪府","兵庫県",
  "奈良県","和歌山県","鳥取県","島根県","岡山県","広島県","山口県",
  "徳島県","香川県","愛媛県","高知県","福岡県","佐賀県","長崎県",
  "熊本県","大分県","宮崎県","鹿児島県","沖縄県",
];

export default function UserSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [withdrawDialogOpen, setWithdrawDialogOpen] = useState(false);
  const [pwDialogOpen, setPwDialogOpen] = useState(false);
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");

  const [companyName, setCompanyName] = useState(user?.companyName ?? "");
  const [contactName, setContactName] = useState(user?.contactName ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [prefecture, setPrefecture] = useState(user?.prefecture ?? "");
  const [address, setAddress] = useState(user?.address ?? "");
  const [notifyEmail, setNotifyEmail] = useState(user?.notifyEmail ?? true);
  const [bankName, setBankName] = useState(user?.bankName ?? "");
  const [bankBranch, setBankBranch] = useState(user?.bankBranch ?? "");
  const [accountType, setAccountType] = useState(user?.accountType ?? "");
  const [accountNumber, setAccountNumber] = useState(user?.accountNumber ?? "");
  const [accountHolderKana, setAccountHolderKana] = useState(user?.accountHolderKana ?? "");

  useEffect(() => {
    if (user) {
      setCompanyName(user.companyName ?? "");
      setContactName(user.contactName ?? "");
      setPhone(user.phone ?? "");
      setEmail(user.email ?? "");
      setPrefecture(user.prefecture ?? "");
      setAddress(user.address ?? "");
      setNotifyEmail(user.notifyEmail ?? true);
      setBankName(user.bankName ?? "");
      setBankBranch(user.bankBranch ?? "");
      setAccountType(user.accountType ?? "");
      setAccountNumber(user.accountNumber ?? "");
      setAccountHolderKana(user.accountHolderKana ?? "");
    }
  }, [user]);

  const profileMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await apiRequest("PATCH", "/api/user/profile", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({ title: "保存しました", description: "企業情報を更新しました。" });
    },
    onError: () => toast({ title: "保存に失敗しました", variant: "destructive" }),
  });

  const pwMutation = useMutation({
    mutationFn: async (data: Record<string, string>) => {
      const res = await apiRequest("PATCH", "/api/user/password", data);
      return res.json();
    },
    onSuccess: () => {
      setPwDialogOpen(false);
      setCurrentPw(""); setNewPw(""); setConfirmPw("");
      toast({ title: "パスワードを変更しました" });
    },
    onError: (e: any) => toast({ title: e?.message || "変更に失敗しました", variant: "destructive" }),
  });

  const handleSave = () => {
    profileMutation.mutate({ companyName, contactName, phone, prefecture, address, notifyEmail, bankName, bankBranch, accountType, accountNumber, accountHolderKana });
  };

  const handlePwChange = () => {
    if (newPw !== confirmPw) {
      toast({ title: "新しいパスワードが一致しません", variant: "destructive" });
      return;
    }
    if (newPw.length < 8) {
      toast({ title: "パスワードは8文字以上にしてください", variant: "destructive" });
      return;
    }
    pwMutation.mutate({ currentPassword: currentPw, newPassword: newPw });
  };

  return (
    <DashboardLayout>
      <div className="px-4 sm:px-6 py-6 max-w-2xl mx-auto">
        <div className="rounded-xl p-6 mb-6 hero-gradient relative overflow-hidden">
          <div className="hero-grid absolute inset-0 opacity-30" />
          <div className="relative z-10">
            <p className="text-white/80 text-xs mb-0.5">SETTINGS</p>
            <h1 className="text-2xl font-bold text-white" data-testid="text-page-title">アカウント設定</h1>
            <p className="text-white/70 text-sm mt-1">企業情報と通知設定を管理します</p>
          </div>
        </div>

        {user && user.approved && (
          <div className="mb-4 rounded-lg border border-emerald-300 bg-emerald-50 p-3 flex items-center gap-2 text-sm text-emerald-800">
            <CheckCircle className="w-4 h-4 shrink-0" />
            アカウントは承認済みです
          </div>
        )}

        {/* Company info */}
        <Card className="border border-border mb-6">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-5">
              <Building2 className="w-4 h-4 text-primary" />
              <h2 className="font-bold text-foreground">企業情報</h2>
            </div>
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium mb-1.5 block">会社名 <span className="text-destructive">*</span></Label>
                <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="株式会社〇〇" />
              </div>
              <div>
                <Label className="text-sm font-medium mb-1.5 block">担当者名</Label>
                <Input value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="山田 太郎" />
              </div>
              <div>
                <Label className="text-sm font-medium mb-1.5 block">メールアドレス</Label>
                <Input value={email} disabled className="bg-muted/50" />
                <p className="text-xs text-muted-foreground mt-1">メールアドレスは変更できません</p>
              </div>
              <div>
                <Label className="text-sm font-medium mb-1.5 block">電話番号</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="03-0000-0000" />
              </div>
              <div>
                <Label className="text-sm font-medium mb-1.5 block">都道府県</Label>
                <Select value={prefecture} onValueChange={setPrefecture}>
                  <SelectTrigger>
                    <SelectValue placeholder="都道府県を選択" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {PREFECTURES.map((p) => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-medium mb-1.5 block">所在地（住所）</Label>
                <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="渋谷区〇〇 1-2-3" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notification settings */}
        <Card className="border border-border mb-6">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-5">
              <Bell className="w-4 h-4 text-primary" />
              <h2 className="font-bold text-foreground">通知設定</h2>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">応募メール通知</p>
                <p className="text-xs text-muted-foreground mt-0.5">求人に応募があった際にメールで通知します</p>
              </div>
              <Switch checked={notifyEmail} onCheckedChange={setNotifyEmail} />
            </div>
          </CardContent>
        </Card>

        {/* Bank account info */}
        <Card className="border border-border mb-6">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-5">
              <Landmark className="w-4 h-4 text-primary" />
              <h2 className="font-bold text-foreground">返金用口座情報</h2>
            </div>
            <p className="text-xs text-muted-foreground mb-4">返金が発生した際の振込先口座を登録してください。</p>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-sm font-medium mb-1.5 block">銀行名</Label>
                  <Input value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="〇〇銀行" />
                </div>
                <div>
                  <Label className="text-sm font-medium mb-1.5 block">支店名</Label>
                  <Input value={bankBranch} onChange={(e) => setBankBranch(e.target.value)} placeholder="〇〇支店" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-sm font-medium mb-1.5 block">口座種別</Label>
                  <Select value={accountType} onValueChange={setAccountType}>
                    <SelectTrigger>
                      <SelectValue placeholder="選択してください" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="普通">普通</SelectItem>
                      <SelectItem value="当座">当座</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm font-medium mb-1.5 block">口座番号</Label>
                  <Input value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} placeholder="1234567" />
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium mb-1.5 block">口座名義（カタカナ）</Label>
                <Input value={accountHolderKana} onChange={(e) => setAccountHolderKana(e.target.value)} placeholder="カブシキガイシャ〇〇" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account info */}
        <Card className="border border-border mb-6">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Mail className="w-4 h-4 text-primary" />
              <h2 className="font-bold text-foreground">アカウント情報</h2>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-sm text-muted-foreground">メールアドレス</span>
                <span className="text-sm font-medium">{user?.email}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-sm text-muted-foreground">アカウント状態</span>
                <Badge variant={user?.approved ? "default" : "secondary"} className={user?.approved ? "bg-emerald-100 text-emerald-700 border-emerald-300 border" : ""}>
                  {user?.approved ? "承認済み" : "承認待ち"}
                </Badge>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-muted-foreground">登録日</span>
                <span className="text-sm">{user?.createdAt ? new Date(user.createdAt).toLocaleDateString("ja-JP") : "-"}</span>
              </div>
            </div>
            <Button variant="outline" className="mt-4 w-full flex items-center gap-2" onClick={() => setPwDialogOpen(true)}>
              <Lock className="w-4 h-4" />パスワードを変更する
            </Button>
          </CardContent>
        </Card>

        {/* Save */}
        <Button onClick={handleSave} disabled={profileMutation.isPending} className="w-full" size="lg">
          {profileMutation.isPending ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" />保存中...</>
          ) : (
            <><Save className="w-4 h-4 mr-2" />変更を保存する</>
          )}
        </Button>

        {/* Withdrawal */}
        <div className="mt-8 p-4 rounded-lg border border-destructive/30 bg-destructive/5">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-destructive" />
            <p className="text-sm font-semibold text-destructive">退会申請</p>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            退会すると掲載中の求人が停止され、データは削除されます。この操作は取り消せません。
          </p>
          <Button variant="outline" size="sm" className="text-destructive border-destructive/40 hover:bg-destructive/10" onClick={() => setWithdrawDialogOpen(true)}>
            退会を申請する
          </Button>
        </div>
      </div>

      {/* Password change dialog */}
      <Dialog open={pwDialogOpen} onOpenChange={setPwDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>パスワード変更</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label className="text-sm mb-1.5 block">現在のパスワード</Label>
              <Input type="password" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} />
            </div>
            <div>
              <Label className="text-sm mb-1.5 block">新しいパスワード（8文字以上）</Label>
              <Input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} />
            </div>
            <div>
              <Label className="text-sm mb-1.5 block">新しいパスワード（確認）</Label>
              <Input type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setPwDialogOpen(false)}>キャンセル</Button>
              <Button className="flex-1" onClick={handlePwChange} disabled={pwMutation.isPending}>
                {pwMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "変更する"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Withdrawal confirm dialog */}
      <Dialog open={withdrawDialogOpen} onOpenChange={setWithdrawDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-destructive">退会申請の確認</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <p className="text-sm text-muted-foreground">
              退会申請を送信します。管理者が確認後、アカウントが削除されます。<br />
              掲載中の求人はすべて停止されます。
            </p>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setWithdrawDialogOpen(false)}>キャンセル</Button>
              <Button variant="destructive" className="flex-1" onClick={() => {
                setWithdrawDialogOpen(false);
                toast({ title: "退会申請を送信しました", description: "管理者が確認します。" });
              }}>
                退会申請を送信
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
