import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, Building2 } from "lucide-react";
import logoWhite from "@assets/logo-white.png";
import { useQuery } from "@tanstack/react-query";
import type { Announcement } from "@shared/schema";

const CATEGORY_BADGE: Record<string, { label: string; variant: "default" | "secondary" }> = {
  important: { label: "重要", variant: "default" },
  update: { label: "更新", variant: "secondary" },
  maintenance: { label: "メンテナンス", variant: "secondary" },
  campaign: { label: "キャンペーン", variant: "secondary" },
  general: { label: "お知らせ", variant: "secondary" },
};

function AnnouncementsSection() {
  const { data: announcements, isLoading } = useQuery<Announcement[]>({
    queryKey: ["/api/announcements"],
  });

  const formatDate = (dateVal: string | Date) => {
    const d = new Date(dateVal);
    return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;
  };

  const isNew = (dateVal: string | Date) => {
    const d = new Date(dateVal);
    const now = new Date();
    return (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24) <= 7;
  };

  if (!isLoading && (!announcements || announcements.length === 0)) return null;

  return (
    <section className="py-16 sm:py-20 bg-muted/50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <h2 className="text-2xl font-bold text-foreground mb-8">お知らせ</h2>
        <Card>
          <CardContent className="p-0 divide-y divide-border">
            {isLoading ? (
              <div className="p-4 space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              announcements!.map((item) => {
                const badge = CATEGORY_BADGE[item.category] || CATEGORY_BADGE.general;
                const newItem = isNew(item.createdAt);
                return (
                  <div key={item.id} className="flex items-start gap-4 p-4" data-testid={`announcement-lp-${item.id}`}>
                    <Badge variant={newItem ? "default" : badge.variant} className="shrink-0 mt-0.5">
                      {newItem ? "新着" : badge.label}
                    </Badge>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">{formatDate(item.createdAt)}</p>
                      <p className="text-base font-semibold text-foreground">{item.title}</p>
                      {item.content && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{item.content}</p>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen overflow-x-hidden">

      {/* ─── HERO ─── */}
      <section className="bg-primary">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-20 sm:py-28">
          <div className="text-center max-w-3xl mx-auto">
            <p className="text-sm font-semibold text-white/70 tracking-widest uppercase mb-4">
              軽貨物ドライバー 採用プラットフォーム
            </p>
            <h1
              className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white leading-tight"
              style={{ letterSpacing: "-0.02em" }}
              data-testid="text-hero-title"
            >
              軽貨物ドライバー採用は<br className="hidden sm:block" />
              これだけでいい
            </h1>
            <div className="mt-6 flex justify-center">
              <img src={logoWhite} alt="KEI SAIYOU" className="h-12 sm:h-14 w-auto rounded" />
            </div>
            <p className="mt-5 text-lg sm:text-xl font-bold text-white" data-testid="text-hero-free">
              初期費用０・月額費用０
            </p>
            <p className="mt-1 text-sm text-white/80" data-testid="text-hero-free-sub">
              応募が来るまで一切費用はかかりません
            </p>
            <ul className="mt-6 space-y-2 text-base sm:text-lg text-white/85 leading-relaxed max-w-xl mx-auto text-left inline-block" data-testid="text-hero-subtitle">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 shrink-0 text-white/70" />
                求人をAI登録するだけ（1分）
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 shrink-0 text-white/70" />
                応募が来たらメールですぐ通知
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 shrink-0 text-white/70" />
                料金は<strong className="text-white">3,000円 / 応募</strong>のシンプルな料金プラン
              </li>
            </ul>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="/register">
                <Button
                  size="lg"
                  className="bg-white text-primary hover:bg-white/90 font-bold w-full sm:w-auto sm:min-w-[220px] text-base shadow-lg"
                  data-testid="button-hero-register"
                >
                  <Building2 className="w-4 h-4 mr-2" />
                  企業登録・無料で始める
                </Button>
              </Link>
              <Link href="/login">
                <Button
                  size="lg"
                  variant="outline"
                  className="text-white border-white/40 bg-white/10 w-full sm:w-auto sm:min-w-[180px] text-base"
                  data-testid="button-hero-login"
                >
                  ログイン
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── LOGO WALL ─── */}
      <section className="py-12 bg-white border-y border-border/50">
        <style>{`
          .logo-slider{height:110px;overflow:hidden;position:relative;width:100%;-webkit-mask-image:linear-gradient(to right,transparent 0%,#000 12%,#000 88%,transparent 100%);mask-image:linear-gradient(to right,transparent 0%,#000 12%,#000 88%,transparent 100%);}
          .logo-track{display:flex;}
          .logo-track-1{animation:logoScroll1 32s linear infinite;}
          .logo-slide{width:180px;height:110px;display:flex;align-items:center;justify-content:center;flex:0 0 auto;padding:0 16px;}
          .logo-slide img{max-width:140px;max-height:70px;object-fit:contain;filter:grayscale(30%);opacity:0.85;transition:opacity .2s;}
          .logo-slide img:hover{opacity:1;filter:none;}
          @keyframes logoScroll1{0%{transform:translateX(0);}100%{transform:translateX(calc(-180px * 10));}}
          @media(max-width:768px){
            .logo-slide{width:140px;height:90px;}
            .logo-slider{height:90px;}
            @keyframes logoScroll1{100%{transform:translateX(calc(-140px * 10));}}
          }
        `}</style>
        {(() => {
          const logos = [
            "https://s3-ap-northeast-1.amazonaws.com/s3.peraichi.com/userData/5b45aaad-02a4-4454-911d-14fb0a0000c5/img/47db33b0-d7f4-013e-9799-0a58a9feac02/%E3%82%BF%E3%82%99%E3%82%A6%E3%83%B3%E3%83%AD%E3%83%BC%E3%83%88%E3%82%99%20(1).jpeg",
            "https://s3-ap-northeast-1.amazonaws.com/s3.peraichi.com/userData/5b45aaad-02a4-4454-911d-14fb0a0000c5/img/517bff70-d7f4-013e-979c-0a58a9feac02/%E3%82%BF%E3%82%99%E3%82%A6%E3%83%B3%E3%83%AD%E3%83%BC%E3%83%88%E3%82%99%20(1).png",
            "https://s3-ap-northeast-1.amazonaws.com/s3.peraichi.com/userData/5b45aaad-02a4-4454-911d-14fb0a0000c5/img/5938c4f0-d7f4-013e-979f-0a58a9feac02/%E3%82%BF%E3%82%99%E3%82%A6%E3%83%B3%E3%83%AD%E3%83%BC%E3%83%88%E3%82%99%20(2).jpeg",
            "https://s3-ap-northeast-1.amazonaws.com/s3.peraichi.com/userData/5b45aaad-02a4-4454-911d-14fb0a0000c5/img/60df44a0-d7f4-013e-97a0-0a58a9feac02/%E3%82%BF%E3%82%99%E3%82%A6%E3%83%B3%E3%83%AD%E3%83%BC%E3%83%88%E3%82%99%20(2).png",
            "https://s3-ap-northeast-1.amazonaws.com/s3.peraichi.com/userData/5b45aaad-02a4-4454-911d-14fb0a0000c5/img/66db27b0-d7f4-013e-97a2-0a58a9feac02/%E3%82%BF%E3%82%99%E3%82%A6%E3%83%B3%E3%83%AD%E3%83%BC%E3%83%88%E3%82%99%20(3).jpeg",
            "https://s3-ap-northeast-1.amazonaws.com/s3.peraichi.com/userData/5b45aaad-02a4-4454-911d-14fb0a0000c5/img/6d8d1910-d7f4-013e-97a3-0a58a9feac02/%E3%82%BF%E3%82%99%E3%82%A6%E3%83%B3%E3%83%AD%E3%83%BC%E3%83%88%E3%82%99%20(3).png",
            "https://s3-ap-northeast-1.amazonaws.com/s3.peraichi.com/userData/5b45aaad-02a4-4454-911d-14fb0a0000c5/img/728486c0-d7f4-013e-97a6-0a58a9feac02/%E3%82%BF%E3%82%99%E3%82%A6%E3%83%B3%E3%83%AD%E3%83%BC%E3%83%88%E3%82%99%20(4).png",
            "https://s3-ap-northeast-1.amazonaws.com/s3.peraichi.com/userData/5b45aaad-02a4-4454-911d-14fb0a0000c5/img/7cf28db0-d7f4-013e-97a8-0a58a9feac02/%E3%82%BF%E3%82%99%E3%82%A6%E3%83%B3%E3%83%AD%E3%83%BC%E3%83%88%E3%82%99%20(5).png",
            "https://s3-ap-northeast-1.amazonaws.com/s3.peraichi.com/userData/5b45aaad-02a4-4454-911d-14fb0a0000c5/img/883e8b30-d7f4-013e-97a9-0a58a9feac02/%E3%82%BF%E3%82%99%E3%82%A6%E3%83%B3%E3%83%AD%E3%83%BC%E3%83%88%E3%82%99.jpeg",
            "https://s3-ap-northeast-1.amazonaws.com/s3.peraichi.com/userData/5b45aaad-02a4-4454-911d-14fb0a0000c5/img/916e7710-d7f4-013e-97ab-0a58a9feac02/%E3%82%BF%E3%82%99%E3%82%A6%E3%83%B3%E3%83%AD%E3%83%BC%E3%83%88%E3%82%99.png",
          ];
          return (
            <div className="logo-slider">
              <div className="logo-track logo-track-1" style={{ width: "calc(180px * 20)" }}>
                {[...logos, ...logos].map((src, i) => (
                  <div key={`logo-${i}`} className="logo-slide"><img src={src} alt={`企業ロゴ${i + 1}`} /></div>
                ))}
              </div>
            </div>
          );
        })()}
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section className="py-16 sm:py-24 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground" style={{ letterSpacing: "-0.01em" }}>
              2ステップで採用が完結
            </h2>
            <p className="mt-3 text-muted-foreground">最短1分で求人を登録。あとは応募を待つだけ。</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
            {[
              {
                step: "01",
                title: "求人をAI登録（1分）",
                desc: "会社情報を入力するとAIが求人文を自動生成。面倒な文章作りは不要です。",
              },
              {
                step: "02",
                title: "応募が来たらメールで即通知",
                desc: "応募が届いた瞬間にメールでお知らせ。ダッシュボードで応募者を確認できます。",
              },
            ].map(({ step, title, desc }) => (
              <Card key={step} className="relative overflow-hidden border border-border">
                <CardContent className="p-6">
                  <p className="text-5xl font-black text-primary/10 leading-none mb-4 select-none">{step}</p>
                  <h3 className="font-bold text-foreground text-base mb-2">{title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FEATURES ─── */}
      <section className="py-16 sm:py-24 bg-muted/40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground" style={{ letterSpacing: "-0.01em" }}>
              KEI SAIYOU が選ばれる理由
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: "初期費用０・月額費用０",
                points: [
                  "アカウント登録は完全無料",
                  "求人掲載中も費用はかかりません",
                  "応募が来るまで一切費用は発生しません",
                ],
              },
              {
                title: "応募を見逃さない通知",
                points: [
                  "応募が届いた瞬間にメールで通知",
                  "ダッシュボードで応募者を一元管理",
                  "採否を簡単に管理",
                ],
              },
              {
                title: "シンプルな応募課金",
                points: [
                  "料金は3,000円 / 応募 のみ",
                  "応募がなければ費用なし",
                  "複雑なプランは一切なし",
                ],
              },
            ].map(({ title, points }) => (
              <Card key={title}>
                <CardContent className="p-6">
                  <h3 className="text-lg font-bold text-foreground mb-4">{title}</h3>
                  <ul className="space-y-2">
                    {points.map((p) => (
                      <li key={p} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                        {p}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PRICING ─── */}
      <section className="py-16 sm:py-24 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4" style={{ letterSpacing: "-0.01em" }}>
            シンプルな料金体系
          </h2>
          <p className="text-muted-foreground mb-12">複雑なプランなし。成果が出たときだけ費用が発生します。</p>
          <Card className="border-2 border-primary max-w-sm mx-auto shadow-lg">
            <CardContent className="p-8">
              <p className="text-sm font-semibold text-primary tracking-widest uppercase mb-2">ベーシックプラン</p>
              <p className="text-5xl font-black text-foreground mb-1" style={{ letterSpacing: "-0.04em" }}>
                ¥3,000
              </p>
              <p className="text-muted-foreground text-sm mb-8">応募通知 1件あたり</p>
              <ul className="text-left space-y-3 mb-8">
                {[
                  "初期費用・月額費用なし",
                  "メール即時通知",
                  "応募者ダッシュボード",
                  "請求履歴管理",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-foreground">
                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/register">
                <Button className="w-full" size="lg" data-testid="button-pricing-register">
                  <Building2 className="w-4 h-4 mr-2" />
                  無料で企業登録
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="bg-primary py-16 sm:py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4" style={{ letterSpacing: "-0.02em" }}>
            まずは求人を登録してみる
          </h2>
          <p className="text-white/80 mb-8 text-base">
            初期費用・月額費用ゼロ。応募が来るまで一切の費用はかかりません。
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/register">
              <Button
                size="lg"
                className="bg-white text-primary hover:bg-white/90 font-bold w-full sm:w-auto sm:min-w-[220px]"
                data-testid="button-cta-register"
              >
                企業登録 – 無料で始める
              </Button>
            </Link>
            <Link href="/contact">
              <Button
                size="lg"
                variant="outline"
                className="text-white border-white/40 bg-white/10 w-full sm:w-auto sm:min-w-[180px]"
                data-testid="button-cta-contact"
              >
                お問い合わせ
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ─── ANNOUNCEMENTS ─── */}
      <AnnouncementsSection />
    </div>
  );
}
