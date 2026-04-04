import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, Building2, ArrowRight } from "lucide-react";
import logoWhite from "@assets/logo-white.png";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
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

function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { el.classList.add("revealed"); obs.disconnect(); } },
      { threshold: 0.12 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return ref;
}

const LOGO_URLS_1 = [
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

const LOGO_URLS_2 = [
  "https://s3-ap-northeast-1.amazonaws.com/s3.peraichi.com/userData/5b45aaad-02a4-4454-911d-14fb0a0000c5/img/1c9b1920-d996-013e-3faf-0a58a9feac02/70617d441cf711e88062963aecd2c947.jpg",
  "https://s3-ap-northeast-1.amazonaws.com/s3.peraichi.com/userData/5b45aaad-02a4-4454-911d-14fb0a0000c5/img/095c3f70-d994-013e-82c3-0a58a9feac02/m_logo.png",
  "https://s3-ap-northeast-1.amazonaws.com/s3.peraichi.com/userData/5b45aaad-02a4-4454-911d-14fb0a0000c5/img/0f974c20-d994-013e-82c4-0a58a9feac02/nikko-logo.jpg",
  "https://s3-ap-northeast-1.amazonaws.com/s3.peraichi.com/userData/5b45aaad-02a4-4454-911d-14fb0a0000c5/img/1412ad40-d994-013e-82c6-0a58a9feac02/tmp-75613e906c3e5ab6ea00c4f39150e44f-cff486a9ddccba3a97b5c4297fb3c057.jpg",
];

export default function Home() {
  const howRef = useScrollReveal();
  const featRef = useScrollReveal();
  const pricRef = useScrollReveal();

  return (
    <div className="min-h-screen overflow-x-hidden">

      {/* ─── HERO ─── */}
      <section className="hero-gradient relative overflow-hidden">
        <div className="hero-grid absolute inset-0 pointer-events-none" />
        {/* decorative orbs */}
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-white/5 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-64 h-64 rounded-full bg-white/5 blur-3xl pointer-events-none" />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-24 sm:py-32">
          <div className="text-center max-w-3xl mx-auto">
            <p className="inline-block text-xs font-bold text-white/60 tracking-[0.2em] uppercase mb-6 border border-white/20 rounded-full px-4 py-1 backdrop-blur-sm bg-white/5">
              軽貨物ドライバー 採用プラットフォーム
            </p>
            <h1
              className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white leading-[1.1] tracking-tight"
              data-testid="text-hero-title"
            >
              軽貨物ドライバー採用は<br className="hidden sm:block" />
              これだけでいい
            </h1>
            <div className="mt-8 flex justify-center">
              <img src={logoWhite} alt="KEI SAIYOU" className="h-12 sm:h-14 w-auto drop-shadow-lg" />
            </div>
            <p className="mt-6 text-xl sm:text-2xl font-bold text-white" data-testid="text-hero-free">
              初期費用０・月額費用０
            </p>
            <p className="mt-1 text-sm text-white/70" data-testid="text-hero-free-sub">
              応募が来るまで一切費用はかかりません
            </p>
            <ul className="mt-7 space-y-3 text-base sm:text-lg text-white/90 max-w-md mx-auto text-left inline-block" data-testid="text-hero-subtitle">
              {[
                "求人をAI登録するだけ（1分）",
                "応募が来たらメールですぐ通知",
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3">
                  <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                  </span>
                  {item}
                </li>
              ))}
              <li className="flex items-start gap-3">
                <span className="w-5 h-5 mt-0.5 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                </span>
                <span>
                  料金は<strong className="text-white font-black">3,000円（税別）&nbsp;/&nbsp;応募</strong>、成果報酬型
                </span>
              </li>
            </ul>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="/register">
                <Button
                  size="lg"
                  className="bg-white text-primary hover:bg-white/95 font-bold w-full sm:w-auto sm:min-w-[230px] text-base shadow-xl shadow-black/20 transition-all duration-200 hover:scale-105"
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
                  className="text-white border-white/30 bg-white/10 backdrop-blur-sm hover:bg-white/20 w-full sm:w-auto sm:min-w-[180px] text-base transition-all duration-200"
                  data-testid="button-hero-login"
                >
                  ログイン
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── LOGO WALL 1 ─── */}
      <section className="py-10 bg-white border-b border-border/40">
        <div className="lw-slider">
          <div className="lw-track lw-track-a" style={{ width: `${180 * LOGO_URLS_1.length * 2}px` }}>
            {[...LOGO_URLS_1, ...LOGO_URLS_1].map((src, i) => (
              <div key={`lw1-${i}`} className="lw-slide"><img src={src} alt={`企業ロゴ${i + 1}`} /></div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section className="py-20 sm:py-28 bg-white">
        <div ref={howRef} className="reveal max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <p className="text-xs font-bold text-primary tracking-widest uppercase mb-3">HOW IT WORKS</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
              2ステップで採用が完結
            </h2>
            <p className="mt-3 text-muted-foreground">最短1分で求人を登録。あとは応募を待つだけ。</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
            {[
              { step: "01", title: "求人をAI登録（1分）", desc: "会社情報を入力するとAIが求人文を自動生成。面倒な文章作りは不要です。", delay: "" },
              { step: "02", title: "応募が来たらメールで即通知", desc: "応募が届いた瞬間にメールでお知らせ。ダッシュボードで応募者を確認できます。", delay: "reveal-delay-1" },
            ].map(({ step, title, desc, delay }) => (
              <Card key={step} className={`step-card relative overflow-hidden border-0 shadow-md bg-white ${delay}`}>
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary to-orange-400" />
                <CardContent className="p-8">
                  <p className="text-6xl font-black leading-none mb-5 select-none step-accent">{step}</p>
                  <h3 className="font-bold text-foreground text-lg mb-2">{title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FEATURES ─── */}
      <section className="py-20 sm:py-28 bg-gradient-to-b from-orange-50/60 to-white">
        <div ref={featRef} className="reveal max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <p className="text-xs font-bold text-primary tracking-widest uppercase mb-3">WHY KEI SAIYOU</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
              KEI SAIYOU が選ばれる理由
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                title: "初期費用０・月額費用０",
                points: ["アカウント登録は完全無料", "求人掲載中も費用はかかりません", "応募が来るまで一切費用は発生しません"],
                delay: "",
              },
              {
                title: "応募を見逃さない通知",
                points: ["応募が届いた瞬間にメールで通知", "ダッシュボードで応募者を一元管理", "採否を簡単に管理"],
                delay: "reveal-delay-1",
              },
              {
                title: "シンプルな応募課金",
                points: ["料金は3,000円（税別）/ 応募 のみ", "応募がなければ費用なし", "複雑なプランは一切なし"],
                delay: "reveal-delay-2",
              },
            ].map(({ title, points, delay }) => (
              <Card key={title} className={`feat-card border-0 shadow-sm bg-white ${delay}`}>
                <CardContent className="p-7">
                  <h3 className="text-lg font-bold text-foreground mb-5">{title}</h3>
                  <ul className="space-y-3">
                    {points.map((p) => (
                      <li key={p} className="flex items-start gap-2.5 text-sm text-muted-foreground">
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
      <section className="py-20 sm:py-28 bg-white">
        <div ref={pricRef} className="reveal max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-xs font-bold text-primary tracking-widest uppercase mb-3">PRICING</p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight mb-3">
            シンプルな料金体系
          </h2>
          <p className="text-muted-foreground mb-14">複雑なプランなし。成果が出たときだけ費用が発生します。</p>
          <div className="price-card rounded-2xl bg-white max-w-sm mx-auto overflow-hidden">
            <div className="h-1.5 bg-gradient-to-r from-primary via-orange-400 to-primary bg-[length:200%_100%] animate-[shimmer_3s_linear_infinite]" />
            <div className="p-10">
              <span className="price-badge inline-block rounded-full px-4 py-1 text-xs font-bold text-white bg-primary mb-4">
                ベーシックプラン
              </span>
              <p className="text-6xl font-black text-foreground mb-1 tracking-tight">¥3,000</p>
              <p className="text-muted-foreground text-sm mb-9">応募通知 1件あたり（税別）</p>
              <ul className="text-left space-y-3.5 mb-9">
                {["初期費用・月額費用なし", "メール即時通知", "応募者ダッシュボード", "請求履歴管理"].map((item) => (
                  <li key={item} className="flex items-center gap-2.5 text-sm text-foreground">
                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/register">
                <Button className="w-full h-12 text-base font-bold shadow-lg shadow-primary/30 transition-all hover:scale-[1.02]" size="lg" data-testid="button-pricing-register">
                  <Building2 className="w-4 h-4 mr-2" />
                  無料で企業登録
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── LOGO WALL 2 ─── */}
      <section className="py-10 bg-white border-y border-border/40">
        <div className="lw-slider">
          <div className="lw-track lw-track-b" style={{ width: `${180 * LOGO_URLS_2.length * 6}px` }}>
            {[...LOGO_URLS_2, ...LOGO_URLS_2, ...LOGO_URLS_2, ...LOGO_URLS_2, ...LOGO_URLS_2, ...LOGO_URLS_2].map((src, i) => (
              <div key={`lw2-${i}`} className="lw-slide"><img src={src} alt={`企業ロゴ${i + 1}`} /></div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="relative hero-gradient overflow-hidden py-20 sm:py-28">
        <div className="hero-grid absolute inset-0 pointer-events-none" />
        <div className="cta-orb-1 absolute -top-24 -right-24 w-80 h-80 rounded-full bg-white/8 blur-3xl pointer-events-none" />
        <div className="cta-orb-2 absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-white/8 blur-3xl pointer-events-none" />
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-5">
            まずは求人を登録してみる
          </h2>
          <p className="text-white/75 mb-10 text-base max-w-md mx-auto leading-relaxed">
            初期費用・月額費用ゼロ。応募が来るまで一切の費用はかかりません。
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/register">
              <Button
                size="lg"
                className="bg-white text-primary hover:bg-white/95 font-bold w-full sm:w-auto sm:min-w-[230px] text-base shadow-xl shadow-black/20 transition-all duration-200 hover:scale-105"
                data-testid="button-cta-register"
              >
                企業登録 – 無料で始める
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link href="/contact">
              <Button
                size="lg"
                variant="outline"
                className="text-white border-white/30 bg-white/10 backdrop-blur-sm hover:bg-white/20 w-full sm:w-auto sm:min-w-[180px] text-base transition-all duration-200"
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
