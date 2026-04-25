import { Link } from "wouter";

export default function Footer() {
  return (
    <footer className="relative overflow-hidden" style={{
      background: "linear-gradient(135deg, hsl(20,85%,48%) 0%, hsl(20,85%,56%) 40%, hsl(28,90%,60%) 70%, hsl(18,80%,50%) 100%)"
    }}>
      {/* grid overlay */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: "linear-gradient(rgba(255,255,255,.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.06) 1px, transparent 1px)",
        backgroundSize: "48px 48px"
      }} />
      {/* top accent line */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-white/20" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="flex flex-col md:flex-row gap-10 md:gap-16">

          {/* brand + address */}
          <div className="md:flex-1">
            <div className="mb-5">
              <img src="/logo-white.png" alt="KEI SAIYOU" className="h-10 w-auto drop-shadow" />
            </div>
            <div className="text-sm text-white/75 space-y-1.5 leading-relaxed">
              <p className="font-semibold text-white text-base">合同会社SIN JAPAN</p>
              <p>〒243-0303 神奈川県愛甲郡愛川町中津7287</p>
              <p>TEL 046-212-2325　FAX 046-212-2326</p>
              <p>Mail info@keisaiyou-sinjapan.com</p>
            </div>
          </div>

          {/* nav links */}
          <div className="flex gap-10 sm:gap-16 md:gap-20 md:self-start md:pt-1">
            <div>
              <h3 className="text-xs font-bold text-white/60 tracking-widest uppercase mb-4">サポート</h3>
              <ul className="space-y-2.5 text-sm text-white/75">
                <li><Link href="/guide" className="hover:text-white transition-colors" data-testid="link-guide">ご利用ガイド</Link></li>
                <li><Link href="/faq" className="hover:text-white transition-colors" data-testid="link-faq">よくある質問</Link></li>
                <li><Link href="/contact" className="hover:text-white transition-colors" data-testid="link-contact">お問い合わせ</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-xs font-bold text-white/60 tracking-widest uppercase mb-4">会社情報</h3>
              <ul className="space-y-2.5 text-sm text-white/75">
                <li><Link href="/company-info" className="hover:text-white transition-colors" data-testid="link-company-info">会社情報</Link></li>
                <li><Link href="/terms" className="hover:text-white transition-colors" data-testid="link-terms">利用規約</Link></li>
                <li><Link href="/privacy" className="hover:text-white transition-colors" data-testid="link-privacy">プライバシーポリシー</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-xs font-bold text-white/60 tracking-widest uppercase mb-4">関連サービス</h3>
              <ul className="space-y-2.5 text-sm text-white/75">
                <li><a href="https://keimatch-sinjapan.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">KEI MATCH</a></li>
                <li><a href="https://tramatch-sinjapan.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">TRA MATCH</a></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-white/15 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/50">
          <span>&copy; 2026 SIN JAPAN LLC All rights reserved.</span>
          <span className="hidden sm:block">軽貨物ドライバー 採用プラットフォーム</span>
        </div>
      </div>
    </footer>
  );
}
