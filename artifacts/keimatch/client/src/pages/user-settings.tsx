import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Building2, Mail, Phone, MapPin, User, Save, Loader2, CheckCircle, Bell } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState, useEffect } from "react";
import DashboardLayout from "@/components/dashboard-layout";
import { Switch } from "@/components/ui/switch";

export default function UserSettings() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [companyName, setCompanyName] = useState(user?.companyName ?? "");
  const [contactName, setContactName] = useState(user?.contactName ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [address, setAddress] = useState(user?.address ?? "");
  const [businessDescription, setBusinessDescription] = useState(user?.businessDescription ?? "");
  const [notifyEmail, setNotifyEmail] = useState(user?.notifyEmail ?? true);

  useEffect(() => {
    if (user) {
      setCompanyName(user.companyName ?? "");
      setContactName(user.contactName ?? "");
      setPhone(user.phone ?? "");
      setEmail(user.email ?? "");
      setAddress(user.address ?? "");
      setBusinessDescription(user.businessDescription ?? "");
      setNotifyEmail(user.notifyEmail ?? true);
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
    onError: () => {
      toast({ title: "保存に失敗しました", variant: "destructive" });
    },
  });

  const handleSave = () => {
    profileMutation.mutate({
      companyName,
      contactName,
      phone,
      address,
      businessDescription,
      notifyEmail,
    });
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

        {user && !user.approved && (
          <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
            現在、管理者による承認待ちです。承認後にすべての機能をご利用いただけます。
          </div>
        )}

        {user && user.approved && (
          <div className="mb-4 rounded-lg border border-emerald-300 bg-emerald-50 p-3 flex items-center gap-2 text-sm text-emerald-800">
            <CheckCircle className="w-4 h-4 shrink-0" />
            アカウントは承認済みです
          </div>
        )}

        <Card className="border border-border mb-6">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-5">
              <Building2 className="w-4 h-4 text-primary" />
              <h2 className="font-bold text-foreground">企業情報</h2>
            </div>
            <div className="space-y-5">
              <div>
                <Label htmlFor="companyName" className="text-sm font-medium mb-1.5 block">会社名 <span className="text-red-500">*</span></Label>
                <Input
                  id="companyName"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="株式会社〇〇"
                />
              </div>
              <div>
                <Label htmlFor="contactName" className="text-sm font-medium mb-1.5 block">担当者名</Label>
                <Input
                  id="contactName"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="山田 太郎"
                />
              </div>
              <div>
                <Label htmlFor="phone" className="text-sm font-medium mb-1.5 block">電話番号</Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="03-0000-0000"
                />
              </div>
              <div>
                <Label htmlFor="email" className="text-sm font-medium mb-1.5 block">メールアドレス</Label>
                <Input
                  id="email"
                  value={email}
                  disabled
                  className="bg-muted/50"
                />
                <p className="text-xs text-muted-foreground mt-1">メールアドレスは変更できません</p>
              </div>
              <div>
                <Label htmlFor="address" className="text-sm font-medium mb-1.5 block">所在地</Label>
                <Input
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="東京都渋谷区〇〇 1-2-3"
                />
              </div>
              <div>
                <Label htmlFor="businessDescription" className="text-sm font-medium mb-1.5 block">事業内容</Label>
                <Textarea
                  id="businessDescription"
                  value={businessDescription}
                  onChange={(e) => setBusinessDescription(e.target.value)}
                  placeholder="軽貨物運送事業、ラストマイル配送など"
                  rows={3}
                />
              </div>
            </div>
          </CardContent>
        </Card>

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
              <Switch
                checked={notifyEmail}
                onCheckedChange={setNotifyEmail}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border mb-6">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-3">
              <Mail className="w-4 h-4 text-primary" />
              <h2 className="font-bold text-foreground">アカウント情報</h2>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-sm text-muted-foreground">メールアドレス</span>
                <span className="text-sm font-medium text-foreground">{user?.email}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-sm text-muted-foreground">アカウント状態</span>
                <Badge variant={user?.approved ? "default" : "secondary"} className={user?.approved ? "bg-emerald-100 text-emerald-700 border-emerald-300" : ""}>
                  {user?.approved ? "承認済み" : "承認待ち"}
                </Badge>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-muted-foreground">登録日</span>
                <span className="text-sm text-foreground">
                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString("ja-JP") : "-"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Button
          onClick={handleSave}
          disabled={profileMutation.isPending}
          className="w-full"
          size="lg"
        >
          {profileMutation.isPending ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" />保存中...</>
          ) : (
            <><Save className="w-4 h-4 mr-2" />変更を保存する</>
          )}
        </Button>
      </div>
    </DashboardLayout>
  );
}
