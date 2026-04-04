import { useState } from "react";
import { ChevronDown } from "lucide-react";

interface FaqItem {
  question: string;
  answer: string;
  category: string;
}

const faqItems: FaqItem[] = [
  {
    category: "アカウント",
    question: "登録後すぐに利用できますか？",
    answer: "新規登録後、管理者による承認が必要です。承認が完了次第、登録メールアドレスにてログインが可能になります。通常1〜2営業日以内に承認されます。",
  },
  {
    category: "アカウント",
    question: "パスワードを忘れた場合はどうすればよいですか？",
    answer: "ログインページの「パスワードを忘れた場合」から、登録メールアドレスを入力してください。パスワードリセット用のリンクをメールでお送りします。",
  },
  {
    category: "アカウント",
    question: "登録情報を変更したい場合は？",
    answer: "ログイン後、設定ページから会社情報・メールアドレスの変更が可能です。許可証の再アップロードも設定ページから行えます。",
  },
  {
    category: "求人・掲載",
    question: "求人の掲載費用はかかりますか？",
    answer: "求人の掲載自体は無料です。費用が発生するのは応募があったときのみで、1応募につき¥3,000（税別）です。応募がなければ費用は一切かかりません。",
  },
  {
    category: "求人・掲載",
    question: "求人は何件まで掲載できますか？",
    answer: "掲載件数に上限はありません。複数の求人を同時に掲載・管理することができます。",
  },
  {
    category: "求人・掲載",
    question: "掲載した求人をいつでも削除・編集できますか？",
    answer: "はい、ダッシュボードから求人の編集・削除・公開停止をいつでも行えます。",
  },
  {
    category: "応募・通知",
    question: "応募があったらどうやって知ることができますか？",
    answer: "登録したメールアドレスに即時通知メールをお送りします。応募者のプロフィールや連絡先も通知メールに記載されます。",
  },
  {
    category: "応募・通知",
    question: "応募後の流れはどうなりますか？",
    answer: "応募通知メールが届いたら、記載されている連絡先から直接応募者にご連絡ください。面談・採用のご判断はすべて貴社にてお決めいただけます。",
  },
  {
    category: "お支払い",
    question: "料金はいつ請求されますか？",
    answer: "応募が確定した時点でSquareによる自動決済が行われます。1応募につき¥3,000（税別）です。",
  },
  {
    category: "お支払い",
    question: "支払い方法は何に対応していますか？",
    answer: "クレジットカード決済（Square）に対応しています。Visa・Mastercard・JCBなど主要カードブランドをご利用いただけます。",
  },
  {
    category: "その他",
    question: "対応エリアはどこですか？",
    answer: "日本全国に対応しております。都道府県・エリアを指定した求人掲載が可能です。",
  },
  {
    category: "その他",
    question: "セキュリティ対策はどうなっていますか？",
    answer: "SSL暗号化通信を採用し、パスワードはハッシュ化して保存しています。また、届出書の確認により、信頼できる事業者のみにご利用いただけます。",
  },
];

function FaqAccordion({ item, index }: { item: FaqItem; index: number }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div
      className="border border-border rounded-xl overflow-hidden cursor-pointer transition-all hover:border-primary/40 hover:shadow-sm"
      onClick={() => setIsOpen(!isOpen)}
      data-testid={`card-faq-${index}`}
    >
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <p className="font-semibold text-sm sm:text-base">{item.question}</p>
            {isOpen && (
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{item.answer}</p>
            )}
          </div>
          <ChevronDown
            className={`w-5 h-5 text-primary flex-shrink-0 mt-0.5 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          />
        </div>
      </div>
    </div>
  );
}

export default function Faq() {
  const categories = Array.from(new Set(faqItems.map((item) => item.category)));

  return (
    <div>
      <div className="hero-gradient relative py-14">
        <div className="hero-grid absolute inset-0 pointer-events-none" />
        <div className="relative max-w-3xl mx-auto px-4 text-center text-white">
          <p className="text-xs font-bold tracking-[0.2em] uppercase text-white/60 mb-3">FAQ</p>
          <h1 className="text-3xl sm:text-4xl font-extrabold mb-3" data-testid="text-page-title">よくある質問</h1>
          <p className="text-white/80">KEI SAIYOUに関するよくあるご質問をまとめました</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-12">
        {categories.map((category) => (
          <div key={category} className="mb-10">
            <h2
              className="text-sm font-bold tracking-[0.1em] uppercase text-primary mb-4 pb-2 border-b border-primary/20"
              data-testid={`text-category-${category}`}
            >
              {category}
            </h2>
            <div className="space-y-3">
              {faqItems
                .filter((item) => item.category === category)
                .map((item, index) => (
                  <FaqAccordion key={index} item={item} index={faqItems.indexOf(item)} />
                ))}
            </div>
          </div>
        ))}

        <div className="mt-8 p-6 rounded-2xl bg-muted/50 text-center">
          <p className="font-semibold mb-2">解決しない場合は</p>
          <p className="text-sm text-muted-foreground mb-4">お気軽にお問い合わせください。担当者がご対応いたします。</p>
          <a
            href="/contact"
            className="inline-flex items-center justify-center px-6 py-2.5 rounded-full bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors"
          >
            お問い合わせはこちら
          </a>
        </div>
      </div>
    </div>
  );
}
