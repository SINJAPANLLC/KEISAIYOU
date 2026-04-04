import { UserPlus, FileEdit, Globe, Bell, Phone, CreditCard, ArrowRight, HelpCircle } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function Guide() {
  const steps = [
    {
      icon: UserPlus,
      number: "01",
      title: "企業登録（無料）",
      description: "会社名・担当者情報・貨物軽自動車運送事業届出書をアップロードして登録。管理者承認後すぐに使い始められます。",
      note: "通常1〜2営業日以内に承認",
    },
    {
      icon: FileEdit,
      number: "02",
      title: "求人を作成する",
      description: "募集エリア・勤務形態・報酬・仕事内容を入力するだけ。AIがわかりやすい求人文章を自動生成します。",
      note: "入力時間は約1分",
    },
    {
      icon: Globe,
      number: "03",
      title: "求人を公開",
      description: "作成した求人を即日公開。掲載件数の上限はなく、複数エリア・複数条件の求人を同時に掲載できます。",
      note: "掲載費用は無料",
    },
    {
      icon: Bell,
      number: "04",
      title: "応募通知メールが届く",
      description: "ドライバーから応募が来ると、登録メールアドレスに即時通知。応募者のプロフィールと連絡先がメールに記載されます。",
      note: "見逃しゼロの即時通知",
    },
    {
      icon: Phone,
      number: "05",
      title: "応募者に直接連絡",
      description: "通知メールに記載の連絡先から応募者に直接連絡し、面談・採用のご判断をしてください。プラットフォーム上の仲介は不要です。",
      note: "直接やりとりで採用スピードUP",
    },
    {
      icon: CreditCard,
      number: "06",
      title: "お支払い",
      description: "応募が届くたびに、1応募につき¥3,000（税込）のみ。初期費用・月額費用は一切かかりません。応募がなければ費用はゼロです。",
      note: "¥3,000 / 応募のシンプル料金",
    },
  ];

  return (
    <div>
      <div className="hero-gradient relative py-14">
        <div className="hero-grid absolute inset-0 pointer-events-none" />
        <div className="relative max-w-4xl mx-auto px-4 text-center text-white">
          <p className="text-xs font-bold tracking-[0.2em] uppercase text-white/60 mb-3">GUIDE</p>
          <h1 className="text-3xl sm:text-4xl font-extrabold mb-3" data-testid="text-page-title">ご利用ガイド</h1>
          <p className="text-white/80">KEI SAIYOUの使い方をステップごとにご説明します</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="relative">
          <div className="hidden sm:block absolute left-[38px] top-10 bottom-10 w-0.5 bg-gradient-to-b from-primary/40 via-primary/20 to-transparent" />

          <div className="space-y-6">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div
                  key={index}
                  className="relative flex gap-5 sm:gap-6"
                  data-testid={`card-step-${index}`}
                >
                  <div className="flex-shrink-0 flex flex-col items-center">
                    <div className="w-[78px] h-[78px] rounded-2xl hero-gradient flex flex-col items-center justify-center shadow-md">
                      <span className="text-[10px] font-bold text-white/70 tracking-widest">{step.number}</span>
                      <Icon className="w-6 h-6 text-white mt-0.5" />
                    </div>
                  </div>

                  <div className="flex-1 bg-white border border-border rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                    <h3 className="text-lg font-bold mb-1.5">{step.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-3">{step.description}</p>
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary bg-primary/8 px-3 py-1 rounded-full border border-primary/20">
                      {step.note}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-14 hero-gradient relative rounded-3xl overflow-hidden p-8 sm:p-10 text-center">
          <div className="hero-grid absolute inset-0 pointer-events-none" />
          <div className="relative">
            <p className="text-white/70 text-sm font-semibold tracking-wider uppercase mb-3">まずは無料で始めよう</p>
            <p className="text-2xl sm:text-3xl font-extrabold text-white mb-6">
              初期費用０・月額費用０<br className="sm:hidden" />で採用をスタート
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <Link href="/register">
                <Button
                  className="bg-white text-primary hover:bg-white/90 font-bold px-8 h-11 rounded-full shadow"
                  data-testid="button-register"
                >
                  企業登録・無料で始める
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link href="/faq">
                <Button
                  variant="outline"
                  className="border-white/40 text-white hover:bg-white/10 h-11 rounded-full"
                  data-testid="button-faq"
                >
                  <HelpCircle className="w-4 h-4 mr-2" />
                  よくある質問
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
