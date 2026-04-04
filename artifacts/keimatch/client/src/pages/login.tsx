import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogIn } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const [, setLocation] = useLocation();
  const { login, isAuthenticated, isAdmin } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (isAuthenticated) {
      setLocation(isAdmin ? "/admin" : "/home");
    }
  }, [isAuthenticated, isAdmin, setLocation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login.mutateAsync({ email, password });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "ログイン失敗",
        description: error.message || "メールアドレスまたはパスワードが正しくありません",
      });
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
          <h1 className="text-2xl font-bold mb-1">ログイン</h1>
          <p className="text-sm text-muted-foreground mb-8">KEI SAIYOUにログインしてください</p>

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
                data-testid="input-login-email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">パスワード</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="パスワードを入力"
                required
                className="h-11"
                data-testid="input-login-password"
              />
            </div>
            <div className="text-right -mt-2">
              <Link href="/forgot-password" className="text-sm text-primary font-medium" data-testid="link-forgot-password">
                パスワードを忘れた場合
              </Link>
            </div>
            <Button
              type="submit"
              className="w-full h-11 text-base"
              disabled={login.isPending}
              data-testid="button-login-submit"
            >
              {login.isPending ? "ログイン中..." : (
                <>
                  <LogIn className="w-4 h-4 mr-2" />
                  ログイン
                </>
              )}
            </Button>
          </form>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            アカウントをお持ちでない方は{" "}
            <Link href="/register" className="text-primary font-semibold" data-testid="link-to-register">
              無料会員登録
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
