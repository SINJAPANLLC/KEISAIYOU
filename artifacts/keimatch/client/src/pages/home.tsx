import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { Announcement } from "@shared/schema";
import SeoHead from "@/components/seo/seo-head";
import StructuredData from "@/components/seo/structured-data";

const CATEGORY_BADGE: Record<string, { label: string }> = {
  important: { label: "重要" },
  update: { label: "更新" },
  maintenance: { label: "メンテ" },
  campaign: { label: "企画" },
  general: { label: "告知" },
};

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

function AnnouncementsSection() {
  const { data: announcements, isLoading } = useQuery<Announcement[]>({
    queryKey: ["/api/announcements"],
  });

  const formatDate = (dateVal: string | Date) => {
    const d = new Date(dateVal);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
  };

  const isNew = (dateVal: string | Date) => {
    const d = new Date(dateVal);
    const now = new Date();
    return (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24) <= 7;
  };

  return (
    <section className="bg-white py-24 lg:py-32 px-6 lg:px-12 border-t border-border">
      <div className="max-w-[1440px] mx-auto w-full grid grid-cols-12 gap-8">
        <div className="col-span-12 lg:col-span-4">
          <p className="text-primary/60 text-[10px] tracking-[0.3em] uppercase mb-8 flex items-center gap-4">
            <span className="w-12 h-px bg-primary/20"></span>
            News & Updates
          </p>
          <h2 className="text-foreground text-3xl font-light tracking-tight mb-12">お知らせ</h2>
        </div>
        <div className="col-span-12 lg:col-span-8 lg:col-start-5">
          <div className="flex flex-col border-t border-border">
            {isLoading ? (
               <div className="space-y-6 pt-8">
                 {Array.from({length: 3}).map((_, i) => (
                   <Skeleton key={i} className="h-16 w-full rounded-none bg-muted/50" />
                 ))}
               </div>
            ) : announcements && announcements.length > 0 ? (
               announcements.map((item) => {
                 const badge = CATEGORY_BADGE[item.category] || CATEGORY_BADGE.general;
                 const newItem = isNew(item.createdAt);
                 return (
                   <div key={item.id} className="py-8 border-b border-border flex flex-col sm:flex-row sm:items-start gap-4 hover:bg-black/[0.02] transition-colors px-4 -mx-4 group" data-testid={`announcement-lp-${item.id}`}>
                      <div className="flex items-center gap-6 shrink-0 sm:w-48 pt-1">
                        <p className="text-xs font-medium tabular-nums tracking-widest text-foreground/50">{formatDate(item.createdAt)}</p>
                        <span className={`px-2 py-0.5 text-[10px] tracking-widest border ${newItem ? 'bg-primary text-white border-primary' : 'bg-transparent border-border text-foreground/70'}`}>
                          {newItem ? "新着" : badge.label}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-base font-medium text-foreground group-hover:text-primary transition-colors truncate">{item.title}</p>
                        {item.content && (
                          <p className="text-sm text-foreground/60 mt-3 line-clamp-1 font-light leading-relaxed">{item.content}</p>
                        )}
                      </div>
                   </div>
                 )
               })
            ) : (
              <div className="py-12 text-foreground/40 font-light text-sm">お知らせはありません。</div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen bg-white selection:bg-primary selection:text-white">
      <SeoHead
        title="KEI SAIYOU｜軽貨物ドライバー採用に特化したプラットフォーム"
        description="KEI SAIYOUは軽貨物・運送会社のドライバー採用に特化したプラットフォームです。初期費用・月額費用ゼロ。応募が来たら即通知、3,300円／応募のシンプルな料金プラン。"
        canonical="https://keisaiyou-sinjapan.com/"
      />
      <StructuredData type="Organization" />
      <StructuredData type="LocalBusiness" />
      <StructuredData type="WebSite" />

      {/* ─── HERO (Editorial Campaign) ─── */}
      <section className="relative w-full h-[calc(100svh-5rem)] min-h-[640px] xl:min-h-[760px] bg-primary overflow-hidden flex flex-col justify-end pt-24 lg:pt-28">
        {/* BRAND LINE / SUBTITLE */}
        <div className="hero-enter-label absolute top-[10%] lg:top-[9%] left-0 w-full px-6 lg:px-12 z-20 pointer-events-none">
          <div className="flex flex-col gap-2 border-l-2 border-white pl-4">
            <p className="text-white font-medium tracking-widest text-xs lg:text-sm drop-shadow-sm">
              軽貨物ドライバー採用プラットフォーム
            </p>
            <p className="text-white/80 font-light tracking-[0.2em] text-[10px] uppercase">
              Kei Saiyou Platform
            </p>
          </div>
        </div>

        {/* HUGE HTML TEXT BEHIND SUBJECT */}
        <div className="hero-enter-copy absolute inset-x-0 top-[22%] sm:top-[21%] lg:top-[15%] z-0 px-5 sm:px-3 lg:px-8 pointer-events-none select-none">
           <h1 className="text-[6.15rem] sm:text-[clamp(5.5rem,15vw,13rem)] font-black text-white leading-[0.93] sm:leading-[0.96] tracking-[-0.08em] whitespace-nowrap flex flex-col items-center text-center opacity-95">
             <span>応募が</span>
             <span className="relative top-2 mt-2">来るまで</span>
             <span className="mt-7 flex items-end justify-center gap-[0.74em] sm:gap-[0.42em] text-[9.1rem] sm:text-[clamp(8rem,20vw,18rem)] leading-[0.8] tracking-[-0.08em]">
                <span>0</span>
                <span className="relative left-[0.08em] sm:left-0 pb-[0.03em] text-[0.72em] font-bold leading-none">円</span>
             </span>
           </h1>
        </div>

        {/* FULL-BODY SUBJECT ASSET */}
        <div className="absolute bottom-0 left-[54%] sm:left-1/2 -translate-x-1/2 w-[92%] sm:w-[72%] lg:w-[43%] xl:w-[46%] max-w-[700px] h-[74svh] sm:h-[84svh] lg:h-[85%] xl:h-[88%] z-10 pointer-events-none">
           <div className="hero-enter-figure w-full h-full flex justify-center">
             <img
                src="/keisaiyou-woman-full.png"
                alt="KEI SAIYOUを利用する笑顔の女性ドライバーの全身写真"
                className="w-full h-full object-contain object-bottom"
             />
           </div>
        </div>

        {/* FOREGROUND CTA */}
        <div className="hero-enter-cta relative z-20 w-full px-6 lg:px-12 pb-8 sm:pb-12 lg:pb-12 xl:pb-16 flex flex-col items-start max-w-[1440px] mx-auto mt-auto">
           <Link href="/register">
             <Button size="lg" className="bg-white text-primary hover:bg-white/90 h-16 sm:h-20 px-8 sm:px-12 text-base sm:text-lg font-bold rounded-none flex items-center justify-between gap-6 group w-full sm:w-auto transition-transform hover:-translate-y-0.5">
               無料で求人を掲載する
               <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
             </Button>
           </Link>
        </div>
      </section>

      {/* ─── PRICING ─── */}
      <section className="bg-white py-24 lg:py-32 px-6 lg:px-12 border-b border-border">
        <div className="max-w-[1440px] mx-auto w-full grid grid-cols-1 md:grid-cols-3 gap-16 lg:gap-12">
           <div className="flex flex-col border-l border-primary/20 pl-6 lg:pl-10">
             <span className="text-[10px] font-bold tracking-[0.2em] text-primary mb-3 uppercase">Posting Fee</span>
             <h3 className="text-xl lg:text-2xl font-normal tracking-tight text-foreground mb-6">掲載費</h3>
             <div className="flex items-baseline gap-2">
               <span className="text-6xl lg:text-7xl font-light tabular-nums tracking-tighter text-foreground leading-none">0</span>
               <span className="text-xl font-normal text-foreground/80">円</span>
             </div>
           </div>
           <div className="flex flex-col border-l border-primary/20 pl-6 lg:pl-10">
             <span className="text-[10px] font-bold tracking-[0.2em] text-primary mb-3 uppercase">Monthly Fee</span>
             <h3 className="text-xl lg:text-2xl font-normal tracking-tight text-foreground mb-6">システム月額費</h3>
             <div className="flex items-baseline gap-2">
               <span className="text-6xl lg:text-7xl font-light tabular-nums tracking-tighter text-foreground leading-none">0</span>
               <span className="text-xl font-normal text-foreground/80">円</span>
             </div>
           </div>
           <div className="flex flex-col border-l-4 border-primary pl-6 lg:pl-10">
             <span className="text-[10px] font-bold tracking-[0.2em] text-primary mb-3 uppercase">Cost Per Application</span>
             <h3 className="text-xl lg:text-2xl font-bold tracking-tight text-primary mb-6">応募課金</h3>
             <div className="flex items-baseline gap-2 mb-3">
               <span className="text-6xl lg:text-7xl font-bold tabular-nums tracking-tighter text-primary leading-none">3,000</span>
               <span className="text-xl font-bold text-primary">円</span>
             </div>
             <p className="text-xs text-foreground/50 tracking-wide font-medium">※1応募あたり・税別</p>
           </div>
        </div>
      </section>

      {/* ─── EDITORIAL STATEMENT ─── */}
      <section id="concept" className="bg-white overflow-hidden relative border-b border-primary/15">
        <div className="max-w-[1440px] mx-auto w-full grid grid-cols-1 lg:grid-cols-12 min-h-[680px] lg:min-h-[760px]">
          <div className="lg:col-span-7 flex flex-col justify-center px-6 py-24 lg:px-12 lg:py-32 relative z-10">
            <p className="text-primary text-[10px] font-bold tracking-[0.28em] uppercase mb-12 flex items-center gap-4">
              <span>01 / Simple Hiring</span>
              <span className="w-20 sm:w-32 h-px bg-primary/50"></span>
            </p>
            <h2 className="text-[clamp(3rem,5vw,5.5rem)] font-black leading-[1.08] tracking-tighter text-foreground mb-12">
              <span className="block">採用を</span>
              <span className="block lg:whitespace-nowrap">もっとシンプルに</span>
            </h2>
            <p className="text-foreground text-base sm:text-lg font-medium leading-[1.9] max-w-md">
              掲載費用は0円。必要なときに募集でき、<br className="hidden sm:block" />
              応募が来るまで費用はかかりません。
            </p>
            <div className="mt-16 pt-6 border-t border-primary/30 max-w-md flex gap-10 sm:gap-16">
              <div>
                <p className="text-[9px] font-bold tracking-[0.22em] text-primary uppercase mb-2">Posting Fee</p>
                <p className="text-2xl font-black text-foreground">0円</p>
              </div>
              <div>
                <p className="text-[9px] font-bold tracking-[0.22em] text-primary uppercase mb-2">Monthly Fee</p>
                <p className="text-2xl font-black text-foreground">0円</p>
              </div>
            </div>
          </div>
          <div className="lg:col-span-5 relative min-h-[520px] lg:min-h-0">
            <div className="absolute inset-0 bg-primary"></div>
            <div className="absolute inset-0 flex flex-col justify-between p-8 sm:p-12 lg:p-14 text-white overflow-hidden">
              <p className="text-[10px] font-bold tracking-[0.3em] uppercase">Simple Hiring</p>
              <div>
                <p className="text-[clamp(10rem,24vw,22rem)] font-black leading-[0.7] tracking-tighter opacity-95">01</p>
                <p className="mt-10 max-w-xs text-xl sm:text-2xl font-bold leading-relaxed">
                  必要なときに、<br />
                  必要な採用だけ。
                </p>
              </div>
            </div>
            <p className="absolute right-5 bottom-6 text-white text-[9px] font-bold tracking-[0.28em] uppercase [writing-mode:vertical-rl]">
              Make hiring simpler.
            </p>
          </div>
        </div>
      </section>

      {/* ─── FEATURES ─── */}
      <section className="bg-white py-24 lg:py-32 px-6 lg:px-12 border-t border-border">
        <div className="max-w-[1440px] mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-12">
          <div className="lg:col-span-5 lg:pr-12">
            <p className="text-primary text-[10px] font-bold tracking-[0.3em] uppercase mb-10 flex items-center gap-4">
              <span>Features</span>
              <span className="w-20 h-px bg-primary/40"></span>
            </p>
            <h2 className="text-foreground text-[clamp(2.25rem,3.5vw,4.25rem)] font-black leading-[1.12] tracking-tighter">
              <span className="block lg:whitespace-nowrap">採用を加速する</span>
              <span className="block">3つの機能</span>
            </h2>
          </div>
          <div className="lg:col-span-7">
            <div className="grid grid-cols-[3.5rem_1fr] sm:grid-cols-[5rem_12rem_1fr] gap-x-5 sm:gap-x-8 border-t border-primary/25 py-8 lg:py-10 items-start">
              <span className="text-primary font-light text-3xl tracking-tighter leading-none">01</span>
              <h3 className="text-foreground text-lg sm:text-xl font-bold tracking-tight">AI求人生成</h3>
              <p className="col-start-2 sm:col-start-3 mt-3 sm:mt-0 text-foreground/65 leading-relaxed max-w-md">
                最小限の入力で求人文を作成し、すぐに掲載を開始できます。
              </p>
            </div>
            <div className="grid grid-cols-[3.5rem_1fr] sm:grid-cols-[5rem_12rem_1fr] gap-x-5 sm:gap-x-8 border-t border-primary/25 py-8 lg:py-10 items-start">
              <span className="text-primary font-light text-3xl tracking-tighter leading-none">02</span>
              <h3 className="text-foreground text-lg sm:text-xl font-bold tracking-tight">リアルタイム通知</h3>
              <p className="col-start-2 sm:col-start-3 mt-3 sm:mt-0 text-foreground/65 leading-relaxed max-w-md">
                応募が届いた瞬間にメールで通知し、すぐに確認できます。
              </p>
            </div>
            <div className="grid grid-cols-[3.5rem_1fr] sm:grid-cols-[5rem_12rem_1fr] gap-x-5 sm:gap-x-8 border-y border-primary/25 py-8 lg:py-10 items-start">
              <span className="text-primary font-light text-3xl tracking-tighter leading-none">03</span>
              <h3 className="text-foreground text-lg sm:text-xl font-bold tracking-tight">応募者管理</h3>
              <p className="col-start-2 sm:col-start-3 mt-3 sm:mt-0 text-foreground/65 leading-relaxed max-w-md">
                応募者とのやり取りとステータスを、一つの画面で管理できます。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── LOGO WALL ─── */}
      <section className="bg-white py-16 overflow-hidden border-t border-border">
        <div className="lw-slider" style={{ maskImage: 'linear-gradient(to right, transparent 0%, #000 10%, #000 90%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to right, transparent 0%, #000 10%, #000 90%, transparent 100%)' }}>
          <div className="lw-track lw-track-b" style={{ width: `${200 * LOGO_URLS_2.length * 6}px` }}>
            {[...LOGO_URLS_2, ...LOGO_URLS_2, ...LOGO_URLS_2, ...LOGO_URLS_2, ...LOGO_URLS_2, ...LOGO_URLS_2].map((src, i) => (
              <div key={`lw2-${i}`} className="lw-slide"><img src={src} alt={`企業ロゴ${i + 1}`} className="opacity-75 hover:opacity-100" /></div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── ANNOUNCEMENTS ─── */}
      <AnnouncementsSection />

      {/* ─── FINAL CTA ─── */}
      <section className="bg-primary py-32 lg:py-48 px-6 lg:px-12 text-center flex flex-col items-center border-t border-primary/10">
         <p className="text-white/60 text-[10px] tracking-[0.3em] uppercase mb-10">Start Recruiting</p>
         <h2 className="text-white text-4xl md:text-5xl lg:text-6xl font-normal tracking-tight leading-[1.3] mb-16">
           さあ、採用を<br className="sm:hidden" />はじめましょう。
         </h2>
         <Link href="/register">
           <Button size="lg" className="bg-white text-primary hover:bg-white/90 h-16 sm:h-20 px-10 sm:px-14 text-base sm:text-lg font-bold rounded-none transition-transform hover:-translate-y-1 flex items-center justify-center gap-6 w-full sm:w-auto group" data-testid="button-cta-register">
             無料で求人を掲載する
             <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
           </Button>
         </Link>
         <Link href="/contact" className="mt-12 text-white/70 hover:text-white text-sm tracking-widest transition-colors font-medium" data-testid="button-cta-contact">
           お問い合わせはこちら
         </Link>
      </section>
    </div>
  );
}
