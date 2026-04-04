import { Building2, MapPin, Phone, Mail, Target, Briefcase } from "lucide-react";

export default function CompanyInfo() {
  const companyData = [
    { label: "会社名", value: "合同会社SIN JAPAN" },
    { label: "所在地", value: "〒243-0303 神奈川県愛甲郡愛川町中津7287" },
    { label: "電話番号", value: "046-212-2325" },
    { label: "FAX", value: "046-212-2326" },
    { label: "メール", value: "info@sinjapan.jp" },
    { label: "事業内容", value: "軽貨物ドライバー採用プラットフォーム「KEI SAIYOU」の運営" },
  ];

  return (
    <div>
      <div className="hero-gradient relative py-14">
        <div className="hero-grid absolute inset-0 pointer-events-none" />
        <div className="relative max-w-4xl mx-auto px-4 text-center text-white">
          <p className="text-xs font-bold tracking-[0.2em] uppercase text-white/60 mb-3">COMPANY</p>
          <h1 className="text-3xl sm:text-4xl font-extrabold mb-3" data-testid="text-page-title">会社情報</h1>
          <p className="text-white/80">合同会社SIN JAPANについて</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12 space-y-8">
        <div className="bg-white border border-border rounded-2xl overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-border flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">会社概要</h2>
          </div>
          <div className="divide-y divide-border">
            {companyData.map((item, index) => (
              <div
                key={index}
                className="flex flex-col sm:flex-row px-6 py-4"
                data-testid={`row-company-${index}`}
              >
                <span className="font-medium text-sm w-36 flex-shrink-0 text-muted-foreground mb-1 sm:mb-0">{item.label}</span>
                <span className="text-sm">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-6">
          <div className="bg-white border border-border rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                <Target className="w-5 h-5 text-primary" />
              </div>
              <h2 className="text-lg font-semibold">ミッション</h2>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              軽貨物配送業界における採用の課題をテクノロジーの力で解決することを目指しています。運送会社が優秀なドライバーと出会い、継続的に成長できるプラットフォームを提供します。
            </p>
          </div>

          <div className="bg-white border border-border rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-primary" />
              </div>
              <h2 className="text-lg font-semibold">サービス概要</h2>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              KEI SAIYOUは、軽貨物ドライバーを採用したい運送会社向けの採用プラットフォームです。求人掲載・応募管理・採用通知をワンストップで提供し、採用コストを最小化します。
            </p>
          </div>
        </div>

        <div className="bg-muted/40 rounded-2xl p-6">
          <h2 className="text-lg font-semibold mb-4">お問い合わせ</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { icon: MapPin, label: "所在地", value: "〒243-0303 神奈川県愛甲郡愛川町中津7287" },
              { icon: Phone, label: "電話・FAX", value: "Tel: 046-212-2325\nFax: 046-212-2326" },
              { icon: Mail, label: "メール", value: "info@sinjapan.jp" },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">{label}</p>
                  <p className="text-sm whitespace-pre-line mt-0.5">{value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
