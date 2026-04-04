import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Mail, CheckCircle } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function ForgotPassword() {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsPending(true);
    try {
      await apiRequest("POST", "/api/forgot-password", { email });
      setSent(true);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "エラー",
        description: error.message || "送信に失敗しました",
      });
    } finally {
      setIsPending(false);
    }
  };

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
            {["求人をAI登録するだけ（1分）", "応募が来たらメールですぐ通知", "初期費用０・月額費用０"].map((t) => (
              <li key={t} className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-white/25 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">✓</span>
                {t}
              </li>
            ))}
          </ul>
        </div>
        <div className="relative text-white/40 text-xs">© 合同会社SIN JAPAN</div>
      </div>

      <div className="flex-1 flex items-center justify-center bg-white px-6 py-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex justify-center mb-8">
            <img src="/logo-keisaiyou.png" alt="KEI SAIYOU" className="h-10 w-auto" />
          </div>

          {sent ? (
            <div className="text-center space-y-5">
              <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-2xl font-bold">メールを送信しました</h1>
              <p className="text-sm text-muted-foreground leading-relaxed" data-testid="text-reset-sent">
                <strong>{email}</strong> にパスワードリセット用のリンクをお送りしました。<br />
                メールに記載のリンクからパスワードを再設定してください。
              </p>
              <p className="text-xs text-muted-foreground">
                届かない場合は迷惑メールフォルダもご確認ください。
              </p>
              <Link href="/login">
                <Button variant="outline" className="mt-2" data-testid="button-back-to-login">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  ログインに戻る
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-bold mb-1">パスワードをお忘れの方</h1>
              <p className="text-sm text-muted-foreground mb-8">
                ご登録のメールアドレスを入力してください。パスワードリセット用のリンクをお送りします。
              </p>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email">メールアドレス</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="info@example.co.jp"
                    required
                    className="h-11"
                    data-testid="input-forgot-email"
                  />
                </div>
                <Button type="submit" className="w-full h-11" disabled={isPending} data-testid="button-forgot-submit">
                  {isPending ? "送信中..." : (
                    <>
                      <Mail className="w-4 h-4 mr-2" />
                      リセットメールを送信
                    </>
                  )}
                </Button>
                <div className="text-center">
                  <Link href="/login" className="text-sm text-primary font-medium" data-testid="link-back-to-login">
                    <ArrowLeft className="w-3 h-3 inline mr-1" />
                    ログインに戻る
                  </Link>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
