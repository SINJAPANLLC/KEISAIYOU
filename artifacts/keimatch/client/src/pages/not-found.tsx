import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
      <div className="mb-6">
        <img src="/logo-keisaiyou.png" alt="KEI SAIYOU" className="h-10 w-auto mx-auto mb-8" />
        <div
          className="text-[120px] sm:text-[160px] font-extrabold leading-none"
          style={{
            background: "linear-gradient(135deg, hsl(20,85%,56%), hsl(28,90%,65%))",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          404
        </div>
        <h1 className="text-2xl font-bold mt-2 mb-3" data-testid="text-not-found-title">
          ページが見つかりません
        </h1>
        <p className="text-muted-foreground text-sm max-w-sm mx-auto leading-relaxed">
          お探しのページは存在しないか、移動・削除された可能性があります。
        </p>
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        <Link href="/">
          <Button className="gap-2">
            <Home className="w-4 h-4" />
            トップページへ
          </Button>
        </Link>
        <Link href="/contact">
          <Button variant="outline">お問い合わせ</Button>
        </Link>
      </div>
    </div>
  );
}
