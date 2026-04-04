import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mail, Phone, MapPin, Clock } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function Contact() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [category, setCategory] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    if (!category) {
      toast({ title: "エラー", description: "お問い合わせ種別を選択してください", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      await apiRequest("POST", "/api/contact", {
        companyName: formData.get("company") as string,
        name: formData.get("name") as string,
        email: formData.get("email") as string,
        phone: (formData.get("phone") as string) || undefined,
        category,
        message: formData.get("message") as string,
      });
      toast({ title: "送信完了", description: "お問い合わせを受け付けました。2営業日以内にご返信いたします。" });
      form.reset();
      setCategory("");
    } catch (error: any) {
      toast({ title: "送信エラー", description: error?.message || "送信に失敗しました。時間をおいて再度お試しください。", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div className="hero-gradient relative py-14">
        <div className="hero-grid absolute inset-0 pointer-events-none" />
        <div className="relative max-w-5xl mx-auto px-4 text-center text-white">
          <p className="text-xs font-bold tracking-[0.2em] uppercase text-white/60 mb-3">CONTACT</p>
          <h1 className="text-3xl sm:text-4xl font-extrabold mb-3" data-testid="text-page-title">お問い合わせ</h1>
          <p className="text-white/80">ご不明な点がございましたらお気軽にお問い合わせください</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <div className="bg-white border border-border rounded-2xl p-6 sm:p-8 shadow-sm">
              <h2 className="text-lg font-semibold mb-6">お問い合わせフォーム</h2>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="company">会社名 / 屋号</Label>
                    <Input id="company" name="company" placeholder="例: 〇〇運送" required data-testid="input-company" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="name">お名前</Label>
                    <Input id="name" name="name" placeholder="例: 山田 太郎" required data-testid="input-name" />
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">メールアドレス</Label>
                    <Input id="email" name="email" type="email" placeholder="例: info@example.com" required data-testid="input-email" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">電話番号</Label>
                    <Input id="phone" name="phone" type="tel" placeholder="例: 03-1234-5678" data-testid="input-phone" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">お問い合わせ種別</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger data-testid="select-category">
                      <SelectValue placeholder="選択してください" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="job">求人掲載について</SelectItem>
                      <SelectItem value="application">応募・通知について</SelectItem>
                      <SelectItem value="billing">お支払いについて</SelectItem>
                      <SelectItem value="account">アカウントについて</SelectItem>
                      <SelectItem value="technical">技術的なお問い合わせ</SelectItem>
                      <SelectItem value="other">その他</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">お問い合わせ内容</Label>
                  <Textarea id="message" name="message" placeholder="お問い合わせ内容をご記入ください" rows={6} required data-testid="input-message" />
                </div>
                <Button type="submit" disabled={isSubmitting} className="w-full h-11 text-base" data-testid="button-submit">
                  {isSubmitting ? "送信中..." : "送信する"}
                </Button>
              </form>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white border border-border rounded-2xl p-5 shadow-sm">
              <h3 className="font-semibold mb-4">連絡先情報</h3>
              <div className="space-y-4 text-sm">
                {[
                  { icon: MapPin, label: "所在地", value: "〒243-0303\n神奈川県愛甲郡愛川町中津7287" },
                  { icon: Phone, label: "電話", value: "046-212-2325" },
                  { icon: Mail, label: "メール", value: "info@keisaiyou-sinjapan.com" },
                  { icon: Clock, label: "営業時間", value: "24時間受付" },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{label}</p>
                      <p className="text-muted-foreground whitespace-pre-line">{value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-muted/50 rounded-2xl p-5">
              <h3 className="font-semibold mb-2">よくある質問</h3>
              <p className="text-sm text-muted-foreground mb-3">よくある質問はFAQページをご覧ください。</p>
              <a href="/faq" className="text-sm text-primary font-medium hover:underline">FAQページへ →</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
