import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, KeyRound, CheckCircle } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function ResetPassword() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [success, setSuccess] = useState(false);

  const params = new URLSearchParams(window.location.search);
  const token = params.get("token");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast({ variant: "destructive", title: "エラー", description: "パスワードは6文字以上で入力してください" });
      return;
    }
    if (password !== confirmPassword) {
      toast({ variant: "destructive", title: "エラー", description: "パスワードが一致しません" });
      return;
    }
    setIsPending(true);
    try {
      await apiRequest("POST", "/api/reset-password", { token, password });
      setSuccess(true);
    } catch (error: any) {
      toast({ variant: "destructive", title: "エラー", description: error.message || "パスワードリセットに失敗しました" });
    } finally {
      setIsPending(false);
    }
  };

  const LeftPanel = () => (
    <div className="hidden lg:flex lg:w-2/5 hero-gradient relative flex-col justify-between p-10">
      <div className="hero-grid absolute inset-0 pointer-events-none" />
      <div className="relative">
        <img src="/logo-white.png" alt="KEI SAIYOU" className="h-10 w-auto" />
      </div>
      <div className="relative space-y-6">
        <p className="text-3xl font-extrabold text-white leading-snug">
          軽貨物ドライバー採用は<br />これだけでいい
        </p>
      </div>
      <div className="relative text-white/40 text-xs">© 合同会社SIN JAPAN</div>
    </div>
  );

  if (!token) {
    return (
      <div className="min-h-screen flex">
        <LeftPanel />
        <div className="flex-1 flex items-center justify-center bg-white px-6 py-12">
          <div className="w-full max-w-md text-center space-y-4">
            <p className="text-muted-foreground" data-testid="text-invalid-token">無効なリセットリンクです。</p>
            <Link href="/forgot-password">
              <Button variant="outline" data-testid="button-request-again">
                パスワードリセットを再リクエスト
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      <LeftPanel />
      <div className="flex-1 flex items-center justify-center bg-white px-6 py-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex justify-center mb-8">
            <img src="/logo-keisaiyou.png" alt="KEI SAIYOU" className="h-10 w-auto" />
          </div>

          {success ? (
            <div className="text-center space-y-5">
              <div className="w-16 h-16 mx-auto rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold">パスワードを再設定しました</h1>
              <p className="text-sm text-muted-foreground" data-testid="text-reset-success">
                新しいパスワードでログインしてください。
              </p>
              <Link href="/login">
                <Button className="mt-2" data-testid="button-go-to-login">
                  ログインページへ
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-bold mb-1">パスワード再設定</h1>
              <p className="text-sm text-muted-foreground mb-8">新しいパスワードを入力してください</p>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="password">新しいパスワード</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="6文字以上で入力"
                    required
                    minLength={6}
                    className="h-11"
                    data-testid="input-reset-password"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">パスワード確認</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="パスワードを再入力"
                    required
                    minLength={6}
                    className="h-11"
                    data-testid="input-reset-confirm-password"
                  />
                </div>
                <Button type="submit" className="w-full h-11" disabled={isPending} data-testid="button-reset-submit">
                  {isPending ? "処理中..." : (
                    <>
                      <KeyRound className="w-4 h-4 mr-2" />
                      パスワードを再設定
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
