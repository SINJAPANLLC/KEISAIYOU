import { Link } from "wouter";

export default function Footer() {
  return (
    <footer className="bg-primary mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="md:flex-1">
            <div className="mb-3">
              <span className="text-2xl font-extrabold text-white tracking-tight" style={{ letterSpacing: "-0.02em" }}>
                KEI SAIYOU
              </span>
            </div>
            <div className="text-sm text-primary-foreground/80 space-y-1">
              <p className="font-semibold text-white">合同会社SIN JAPAN</p>
              <p>〒243-0303 神奈川県愛甲郡愛川町中津7287</p>
              <p>TEL 046-212-2325　FAX 046-212-2326</p>
              <p>Mail info@sinjapan.jp</p>
            </div>
          </div>
          <div className="flex gap-8 sm:gap-16 md:gap-20 md:self-end md:pb-2">
            <div>
              <h3 className="text-sm font-semibold text-white mb-3">サポート</h3>
              <ul className="space-y-2 text-sm text-primary-foreground/80">
                <li><Link href="/guide" className="hover:text-white transition-colors" data-testid="link-guide">ご利用ガイド</Link></li>
                <li><Link href="/faq" className="hover:text-white transition-colors" data-testid="link-faq">よくある質問</Link></li>
                <li><Link href="/contact" className="hover:text-white transition-colors" data-testid="link-contact">お問い合わせ</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white mb-3">会社情報</h3>
              <ul className="space-y-2 text-sm text-primary-foreground/80">
                <li><Link href="/company-info" className="hover:text-white transition-colors" data-testid="link-company-info">会社情報</Link></li>
                <li><Link href="/terms" className="hover:text-white transition-colors" data-testid="link-terms">利用規約</Link></li>
                <li><Link href="/privacy" className="hover:text-white transition-colors" data-testid="link-privacy">プライバシーポリシー</Link></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-white/20 text-center text-sm text-primary-foreground/70">
          &copy; 2026 SIN JAPAN LLC All rights reserved.
        </div>
      </div>
    </footer>
  );
}
