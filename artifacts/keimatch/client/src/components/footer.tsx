import { Link } from "wouter";
import logoImage from "@assets/logo-keisaiyou.png";

export default function Footer() {
  return (
    <footer className="bg-white border-t border-border text-foreground py-20 lg:py-24">
      <div className="max-w-[1440px] mx-auto px-6 lg:px-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 lg:gap-8 mb-16">
          {/* brand + address */}
          <div className="md:col-span-5 lg:col-span-4 flex flex-col">
            <div className="mb-8">
              <img src={logoImage} alt="KEI SAIYOU" className="h-7 lg:h-8 w-auto object-contain" />
            </div>
            <div className="text-sm text-foreground/60 space-y-2 leading-relaxed font-light">
              <p className="font-medium text-foreground text-base tracking-wide mb-4">合同会社SIN JAPAN</p>
              <p>〒243-0303 神奈川県愛甲郡愛川町中津7287</p>
              <p>TEL 046-212-2325　FAX 046-212-2326</p>
              <p>Mail info@sinjapan.jp</p>
            </div>
          </div>

          {/* nav links */}
          <div className="md:col-span-7 lg:col-span-7 lg:col-start-6 grid grid-cols-1 sm:grid-cols-3 gap-10">
            <div>
              <h3 className="text-[10px] font-bold text-foreground/40 tracking-[0.2em] uppercase mb-6">Support</h3>
              <ul className="space-y-4 text-sm text-foreground/70 font-light">
                <li><Link href="/guide" className="hover:text-primary transition-colors" data-testid="link-guide">ご利用ガイド</Link></li>
                <li><Link href="/faq" className="hover:text-primary transition-colors" data-testid="link-faq">よくある質問</Link></li>
                <li><Link href="/contact" className="hover:text-primary transition-colors" data-testid="link-contact">お問い合わせ</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-[10px] font-bold text-foreground/40 tracking-[0.2em] uppercase mb-6">Company</h3>
              <ul className="space-y-4 text-sm text-foreground/70 font-light">
                <li><Link href="/company-info" className="hover:text-primary transition-colors" data-testid="link-company-info">会社情報</Link></li>
                <li><Link href="/terms" className="hover:text-primary transition-colors" data-testid="link-terms">利用規約</Link></li>
                <li><Link href="/privacy" className="hover:text-primary transition-colors" data-testid="link-privacy">プライバシーポリシー</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-[10px] font-bold text-foreground/40 tracking-[0.2em] uppercase mb-6">Services</h3>
              <ul className="space-y-4 text-sm text-foreground/70 font-light">
                <li><a href="https://keimatch-sinjapan.com" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">KEI MATCH</a></li>
                <li><a href="https://tramatch-sinjapan.com" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">TRA MATCH</a></li>
                <li><a href="https://chat-van.com/lp" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">Chat VAN</a></li>
                <li><a href="https://chat-logi.com/lp" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">Chat LOGI</a></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] text-foreground/40 uppercase tracking-widest">
          <span>&copy; 2026 SIN JAPAN LLC All rights reserved.</span>
          <span className="hidden sm:block">Kei Saiyou Platform</span>
        </div>
      </div>
    </footer>
  );
}
