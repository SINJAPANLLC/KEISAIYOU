import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckCircle2, Loader2, Car, ChevronRight } from "lucide-react";

const PREFECTURES = [
  "北海道","青森県","岩手県","宮城県","秋田県","山形県","福島県",
  "茨城県","栃木県","群馬県","埼玉県","千葉県","東京都","神奈川県",
  "新潟県","富山県","石川県","福井県","山梨県","長野県","岐阜県",
  "静岡県","愛知県","三重県","滋賀県","京都府","大阪府","兵庫県",
  "奈良県","和歌山県","鳥取県","島根県","岡山県","広島県","山口県",
  "徳島県","香川県","愛媛県","高知県","福岡県","佐賀県","長崎県",
  "熊本県","大分県","宮崎県","鹿児島県","沖縄県",
];

const LICENSE_TYPES = [
  "普通自動車（AT限定）","普通自動車","準中型","中型","大型","その他",
];

const EMPLOYMENT_TYPES = [
  "業務委託（個人事業主）","正社員","パート・アルバイト","どれでも可",
];

const EXPERIENCE_YEARS = [
  "未経験","半年未満","半年〜1年","1〜3年","3〜5年","5年以上",
];

const GENDER_OPTIONS = ["男性","女性","その他","回答しない"];

type Form = {
  name: string;
  phone: string;
  email: string;
  prefecture: string;
  address: string;
  birthDate: string;
  gender: string;
  licenseType: string;
  hasBlackNumber: boolean;
  ownsVehicle: boolean;
  experience: string;
  experienceYears: string;
  employmentType: string;
  desiredArea: string;
  availableFrom: string;
  prMessage: string;
};

const initialForm: Form = {
  name: "",
  phone: "",
  email: "",
  prefecture: "",
  address: "",
  birthDate: "",
  gender: "",
  licenseType: "",
  hasBlackNumber: false,
  ownsVehicle: false,
  experience: "",
  experienceYears: "",
  employmentType: "",
  desiredArea: "",
  availableFrom: "",
  prMessage: "",
};

export default function DriverRegister() {
  const { toast } = useToast();
  const [form, setForm] = useState<Form>(initialForm);
  const [submitted, setSubmitted] = useState(false);

  const up = (key: keyof Form, val: any) => setForm((p) => ({ ...p, [key]: val }));

  const mutation = useMutation({
    mutationFn: (data: Form) =>
      apiRequest("POST", "/api/driver-register", data).then((r) => {
        if (!r.ok) return r.json().then((e) => Promise.reject(e));
        return r.json();
      }),
    onSuccess: () => setSubmitted(true),
    onError: (e: any) => {
      toast({
        variant: "destructive",
        title: "送信エラー",
        description: e.message || "送信に失敗しました。もう一度お試しください。",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast({ variant: "destructive", title: "お名前を入力してください" });
      return;
    }
    if (!form.phone.trim()) {
      toast({ variant: "destructive", title: "電話番号を入力してください" });
      return;
    }
    mutation.mutate(form);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 className="w-10 h-10 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold mb-3 text-gray-900">登録ありがとうございます！</h1>
          <p className="text-muted-foreground text-sm leading-relaxed mb-2">
            ご登録を受け付けました。
          </p>
          <p className="text-muted-foreground text-sm leading-relaxed mb-6">
            担当者よりご連絡させていただく場合がございます。<br />
            しばらくお待ちください。
          </p>
          <div className="p-4 rounded-xl bg-orange-50 border border-orange-100 text-sm text-orange-700 text-left leading-relaxed">
            <p className="font-semibold mb-1">次のステップ</p>
            <p>登録情報をもとに、あなたの希望条件に合った<br />お仕事情報をご案内いたします。</p>
          </div>
          <p className="mt-8 text-[10px] text-muted-foreground">Powered by KEI SAIYOU</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
      {/* Header */}
      <div className="bg-white border-b border-orange-100 shadow-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#d05a2a] flex items-center justify-center shrink-0">
            <Car className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground leading-none">KEI SAIYOU</div>
            <div className="text-sm font-bold text-gray-900 leading-tight">ドライバー求職者登録</div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Hero */}
        <div className="bg-gradient-to-r from-[#d05a2a] to-orange-400 rounded-2xl p-6 mb-8 text-white">
          <h1 className="text-xl font-bold mb-2">軽貨物ドライバーのお仕事を探していますか？</h1>
          <p className="text-sm text-orange-100 leading-relaxed">
            情報を登録するだけ。ログイン不要・無料で利用できます。<br />
            あなたの条件に合った企業からご連絡をお送りします。
          </p>
          <div className="flex gap-3 mt-4">
            {["登録無料","ログイン不要","全国対応"].map((t) => (
              <span key={t} className="text-xs bg-white/20 rounded-full px-3 py-1 font-medium">{t}</span>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 基本情報 */}
          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#d05a2a] text-white text-xs flex items-center justify-center font-bold">1</span>
              基本情報
            </h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">お名前 <span className="text-red-500">*</span></Label>
                <Input
                  id="name"
                  placeholder="山田 太郎"
                  value={form.name}
                  onChange={(e) => up("name", e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="phone">電話番号 <span className="text-red-500">*</span></Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="090-0000-0000"
                  value={form.phone}
                  onChange={(e) => up("phone", e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="email">メールアドレス</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="example@email.com"
                  value={form.email}
                  onChange={(e) => up("email", e.target.value)}
                  className="mt-1"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>性別</Label>
                  <Select value={form.gender} onValueChange={(v) => up("gender", v)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="選択" />
                    </SelectTrigger>
                    <SelectContent>
                      {GENDER_OPTIONS.map((g) => (
                        <SelectItem key={g} value={g}>{g}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="birthDate">生年月日</Label>
                  <Input
                    id="birthDate"
                    type="date"
                    value={form.birthDate}
                    onChange={(e) => up("birthDate", e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
              <div>
                <Label>居住都道府県</Label>
                <Select value={form.prefecture} onValueChange={(v) => up("prefecture", v)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="都道府県を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    {PREFECTURES.map((p) => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="address">住所（市区町村以降）</Label>
                <Input
                  id="address"
                  placeholder="例：大阪市中央区..."
                  value={form.address}
                  onChange={(e) => up("address", e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          </section>

          {/* 経験・資格 */}
          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#d05a2a] text-white text-xs flex items-center justify-center font-bold">2</span>
              経験・資格
            </h2>
            <div className="space-y-4">
              <div>
                <Label>保有免許</Label>
                <Select value={form.licenseType} onValueChange={(v) => up("licenseType", v)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="選択してください" />
                  </SelectTrigger>
                  <SelectContent>
                    {LICENSE_TYPES.map((l) => (
                      <SelectItem key={l} value={l}>{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>軽貨物配送の経験年数</Label>
                <Select value={form.experienceYears} onValueChange={(v) => up("experienceYears", v)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="選択してください" />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPERIENCE_YEARS.map((y) => (
                      <SelectItem key={y} value={y}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-3 pt-1">
                <div className="flex items-center gap-3">
                  <Checkbox
                    id="hasBlackNumber"
                    checked={form.hasBlackNumber}
                    onCheckedChange={(v) => up("hasBlackNumber", !!v)}
                  />
                  <Label htmlFor="hasBlackNumber" className="cursor-pointer">黒ナンバー（事業用ナンバー）を取得済み</Label>
                </div>
                <div className="flex items-center gap-3">
                  <Checkbox
                    id="ownsVehicle"
                    checked={form.ownsVehicle}
                    onCheckedChange={(v) => up("ownsVehicle", !!v)}
                  />
                  <Label htmlFor="ownsVehicle" className="cursor-pointer">軽バン・軽トラックを所有している</Label>
                </div>
              </div>
            </div>
          </section>

          {/* 希望条件 */}
          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#d05a2a] text-white text-xs flex items-center justify-center font-bold">3</span>
              希望条件
            </h2>
            <div className="space-y-4">
              <div>
                <Label>希望雇用形態</Label>
                <Select value={form.employmentType} onValueChange={(v) => up("employmentType", v)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="選択してください" />
                  </SelectTrigger>
                  <SelectContent>
                    {EMPLOYMENT_TYPES.map((e) => (
                      <SelectItem key={e} value={e}>{e}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="desiredArea">希望勤務エリア</Label>
                <Input
                  id="desiredArea"
                  placeholder="例：大阪市内、関西全域など"
                  value={form.desiredArea}
                  onChange={(e) => up("desiredArea", e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="availableFrom">勤務開始可能時期</Label>
                <Input
                  id="availableFrom"
                  placeholder="例：即日、来月から、3ヶ月後など"
                  value={form.availableFrom}
                  onChange={(e) => up("availableFrom", e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          </section>

          {/* 自己PR */}
          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#d05a2a] text-white text-xs flex items-center justify-center font-bold">4</span>
              自己PR・備考（任意）
            </h2>
            <Textarea
              placeholder="経験や強み、希望する働き方などを自由にご記入ください"
              value={form.prMessage}
              onChange={(e) => up("prMessage", e.target.value)}
              rows={5}
              className="resize-none"
            />
          </section>

          {/* Submit */}
          <div className="pb-8">
            <Button
              type="submit"
              disabled={mutation.isPending}
              className="w-full h-14 text-base font-bold bg-[#d05a2a] hover:bg-[#b84d24] rounded-xl"
            >
              {mutation.isPending ? (
                <><Loader2 className="w-5 h-5 mr-2 animate-spin" />送信中...</>
              ) : (
                <><ChevronRight className="w-5 h-5 mr-1" />無料で登録する</>
              )}
            </Button>
            <p className="text-center text-xs text-muted-foreground mt-3">
              登録することで<a href="/terms" className="underline">利用規約</a>・<a href="/privacy" className="underline">プライバシーポリシー</a>に同意したものとみなします
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
