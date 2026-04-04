import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

const PREFECTURES = [
  "北海道","青森県","岩手県","宮城県","秋田県","山形県","福島県",
  "茨城県","栃木県","群馬県","埼玉県","千葉県","東京都","神奈川県",
  "新潟県","富山県","石川県","福井県","山梨県","長野県","岐阜県",
  "静岡県","愛知県","三重県","滋賀県","京都府","大阪府","兵庫県",
  "奈良県","和歌山県","鳥取県","島根県","岡山県","広島県","山口県",
  "徳島県","香川県","愛媛県","高知県","福岡県","佐賀県","長崎県",
  "熊本県","大分県","宮崎県","鹿児島県","沖縄県",
];

export default function Register() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [agreed, setAgreed] = useState(false);
  const [form, setForm] = useState({
    companyName: "",
    contactName: "",
    email: "",
    phone: "",
    prefecture: "",
    password: "",
    confirmPassword: "",
  });

  const register = useMutation({
    mutationFn: async (data: typeof form) => {
      const res = await apiRequest("POST", "/api/saiyou/register", {
        companyName: data.companyName,
        contactName: data.contactName,
        email: data.email,
        phone: data.phone,
        prefecture: data.prefecture,
        password: data.password,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      setLocation("/home");
    },
    onError: (err: any) => {
      toast({ variant: "destructive", title: "登録失敗", description: err.message || "登録に失敗しました" });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreed) {
      toast({ variant: "destructive", title: "確認", description: "利用規約・プライバシーポリシーに同意してください" });
      return;
    }
    if (form.password !== form.confirmPassword) {
      toast({ variant: "destructive", title: "確認", description: "パスワードが一致しません" });
      return;
    }
    if (form.password.length < 6) {
      toast({ variant: "destructive", title: "確認", description: "パスワードは6文字以上で入力してください" });
      return;
    }
    register.mutate(form);
  };

  const update = (field: string, value: string) => setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-2/5 hero-gradient relative flex-col justify-between p-10">
        <div className="hero-grid absolute inset-0 pointer-events-none" />
        <div className="relative">
          <img src="/logo-white.png" alt="KEI SAIYOU" className="h-10 w-auto" />
        </div>
        <div className="relative space-y-6">
          <p className="text-3xl font-extrabold text-white leading-snug">
            軽貨物ドライバー採用は<br />これだけでいい
          </p>
          <ul className="space-y-3 text-white/90 text-sm">
            {[
              "無料で求人を掲載申請できる",
              "応募が来たらメールでリアルタイム通知",
              "¥3,000（税別）/ 応募のシンプル料金",
            ].map((t) => (
              <li key={t} className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-white/25 flex items-center justify-center text-white text-[10px] font-bold shrink-0">✓</span>
                {t}
              </li>
            ))}
          </ul>
        </div>
        <div className="relative text-white/40 text-xs">© 合同会社SIN JAPAN</div>
      </div>

      <div className="flex-1 overflow-y-auto flex items-start justify-center bg-white px-6 py-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex justify-center mb-8">
            <img src="/logo-keisaiyou.png" alt="KEI SAIYOU" className="h-10 w-auto" />
          </div>
          <h1 className="text-2xl font-bold mb-1">企業登録</h1>
          <p className="text-sm text-muted-foreground mb-8">KEI SAIYOUに企業アカウントを作成（無料）</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="companyName">会社名 / 屋号 <span className="text-destructive">*</span></Label>
              <Input id="companyName" value={form.companyName} onChange={(e) => update("companyName", e.target.value)} placeholder="例: 〇〇運送株式会社" required className="h-11" data-testid="input-register-company" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactName">担当者名 <span className="text-destructive">*</span></Label>
              <Input id="contactName" value={form.contactName} onChange={(e) => update("contactName", e.target.value)} placeholder="例: 山田 太郎" required className="h-11" data-testid="input-register-contact-name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">メールアドレス <span className="text-destructive">*</span></Label>
              <Input id="email" type="email" value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="info@example.co.jp" required className="h-11" data-testid="input-register-email" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">電話番号 <span className="text-destructive">*</span></Label>
              <Input id="phone" type="tel" value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="03-0000-0000" required className="h-11" data-testid="input-register-phone" />
            </div>
            <div className="space-y-2">
              <Label>都道府県 <span className="text-destructive">*</span></Label>
              <Select onValueChange={(v) => update("prefecture", v)} required>
                <SelectTrigger className="h-11" data-testid="select-prefecture">
                  <SelectValue placeholder="都道府県を選択" />
                </SelectTrigger>
                <SelectContent>
                  {PREFECTURES.map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">パスワード <span className="text-destructive">*</span></Label>
              <Input id="password" type="password" value={form.password} onChange={(e) => update("password", e.target.value)} placeholder="6文字以上" required className="h-11" data-testid="input-register-password" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">パスワード（確認）<span className="text-destructive">*</span></Label>
              <Input id="confirmPassword" type="password" value={form.confirmPassword} onChange={(e) => update("confirmPassword", e.target.value)} placeholder="もう一度入力" required className="h-11" data-testid="input-register-confirm-password" />
            </div>

            <div className="flex items-start gap-3 pt-1">
              <Checkbox id="agree" checked={agreed} onCheckedChange={(v) => setAgreed(v === true)} data-testid="checkbox-agree" />
              <Label htmlFor="agree" className="text-sm text-muted-foreground leading-snug cursor-pointer">
                <Link href="/terms" className="text-primary font-medium">利用規約</Link>・<Link href="/privacy" className="text-primary font-medium">プライバシーポリシー</Link>に同意する
              </Label>
            </div>

            <Button type="submit" className="w-full h-11 text-base" disabled={register.isPending || !agreed} data-testid="button-register-submit">
              {register.isPending ? "登録中..." : (<><UserPlus className="w-4 h-4 mr-2" />無料で登録する</>)}
            </Button>
          </form>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            既にアカウントをお持ちの方は{" "}
            <Link href="/login" className="text-primary font-semibold" data-testid="link-to-login">ログイン</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
