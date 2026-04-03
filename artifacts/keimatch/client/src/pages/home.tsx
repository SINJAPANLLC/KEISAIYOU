import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowRight, CheckCircle2, Zap, Bell, CreditCard,
  FileText, MapPin, Users, Building2, ChevronRight
} from "lucide-react";
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
              軽貨物特化 採用プラットフォーム
            </p>
            <h1
              className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white leading-tight"
              style={{ letterSpacing: "-0.02em" }}
              data-testid="text-hero-title"
            >
              軽貨物ドライバー採用は、<br className="hidden sm:block" />
              これだけでいい。
            </h1>
            <p className="mt-6 text-base sm:text-lg text-white/80 leading-relaxed max-w-xl mx-auto" data-testid="text-hero-subtitle">
              求人を登録するだけで Indeed に自動掲載。<br />
              応募が来たら LINE・メールで即通知。<br />
              課金は採用成果ベース、<strong className="text-white">3,000円 / 件</strong>のシンプルな料金体系。
            </p>
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

      {/* ─── HOW IT WORKS ─── */}
      <section className="py-16 sm:py-24 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground" style={{ letterSpacing: "-0.01em" }}>
              4ステップで採用が完結
            </h2>
            <p className="mt-3 text-muted-foreground">面倒な手続き不要。登録からIndeed掲載まで最短1日。</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                step: "01",
                icon: <FileText className="w-6 h-6 text-primary" />,
                title: "求人を登録",
                desc: "会社情報・エリア・職種・給与などを入力するだけ。数分で完了。",
              },
              {
                step: "02",
                icon: <Zap className="w-6 h-6 text-primary" />,
                title: "Indeed に自動掲載",
                desc: "XMLフィードで求人がIndeedへ自動公開。追加作業ゼロ。",
              },
              {
                step: "03",
                icon: <Bell className="w-6 h-6 text-primary" />,
                title: "応募を即通知",
                desc: "応募が届いたらLINE・メールでリアルタイム通知。見逃しなし。",
              },
              {
                step: "04",
                icon: <CreditCard className="w-6 h-6 text-primary" />,
                title: "成果課金",
                desc: "応募通知1件につき3,000円。採用できなければ費用なし。",
              },
            ].map(({ step, icon, title, desc }) => (
              <Card key={step} className="relative overflow-hidden border border-border">
                <CardContent className="p-6">
                  <p className="text-5xl font-black text-primary/10 leading-none mb-4 select-none">{step}</p>
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    {icon}
                  </div>
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
                icon: <MapPin className="w-8 h-8 text-primary" />,
                title: "軽貨物特化",
                points: [
                  "軽貨物・運送業に最適化した求人フォーム",
                  "都道府県・職種・雇用形態で細かく設定",
                  "Indeedの軽貨物カテゴリに最適化されたXML配信",
                ],
              },
              {
                icon: <Bell className="w-8 h-8 text-primary" />,
                title: "即時通知で機会損失ゼロ",
                points: [
                  "応募からLINE通知まで数秒",
                  "メールでも並行通知",
                  "ダッシュボードで応募者一覧を一元管理",
                ],
              },
              {
                icon: <CreditCard className="w-8 h-8 text-primary" />,
                title: "シンプルな課金",
                points: [
                  "初期費用・月額費用ゼロ",
                  "応募通知1件 3,000円のみ",
                  "Square決済で安全・自動課金",
                ],
              },
            ].map(({ icon, title, points }) => (
              <Card key={title}>
                <CardContent className="p-6">
                  <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-5">
                    {icon}
                  </div>
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
                  "Indeed XML自動配信",
                  "LINE・メール即時通知",
                  "応募者ダッシュボード",
                  "Square自動課金",
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
                  <Users className="w-4 h-4 mr-2" />
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
                <ChevronRight className="w-4 h-4 ml-1" />
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
