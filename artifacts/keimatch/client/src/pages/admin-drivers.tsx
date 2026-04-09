import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import DashboardLayout from "@/components/dashboard-layout";
import {
  Car, Phone, Mail, MapPin, Calendar, ChevronLeft, ChevronRight,
  Users, Search, ExternalLink, Copy, CheckCircle2, Loader2, RefreshCw,
} from "lucide-react";

type Driver = {
  id: number;
  name: string;
  phone: string;
  email: string | null;
  prefecture: string | null;
  address: string | null;
  birth_date: string | null;
  gender: string | null;
  license_type: string | null;
  has_black_number: boolean | null;
  owns_vehicle: boolean | null;
  experience: string | null;
  experience_years: string | null;
  employment_type: string | null;
  desired_area: string | null;
  available_from: string | null;
  pr_message: string | null;
  source: string | null;
  status: string;
  memo: string | null;
  created_at: string;
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  new:        { label: "新規",     color: "bg-blue-100 text-blue-700 border-blue-200" },
  contacted:  { label: "連絡済",   color: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  interested: { label: "興味あり", color: "bg-green-100 text-green-700 border-green-200" },
  hired:      { label: "採用決定", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  rejected:   { label: "不採用",   color: "bg-gray-100 text-gray-500 border-gray-200" },
};

const FORM_URL = `${window.location.origin}/driver-register`;

export default function AdminDrivers() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Driver | null>(null);
  const [editStatus, setEditStatus] = useState("");
  const [memo, setMemo] = useState("");
  const [copied, setCopied] = useState(false);
  const limit = 20;

  const syncMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/admin/airtable/sync-drivers"),
    onSuccess: (data: any) => {
      toast({ title: `Airtable同期完了`, description: `${data.count}件のデータを同期しました` });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/drivers"] });
    },
    onError: () => toast({ title: "同期失敗", variant: "destructive" }),
  });

  const { data, isLoading } = useQuery<{ drivers: Driver[]; total: number }>({
    queryKey: ["/api/admin/drivers", page, search, statusFilter],
    queryFn: () =>
      apiRequest("GET", `/api/admin/drivers?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}&status=${statusFilter}`)
        .then((r) => r.json()),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status, memo }: { id: number; status: string; memo: string }) =>
      apiRequest("PATCH", `/api/admin/drivers/${id}`, { status, memo }).then((r) => r.json()),
    onSuccess: () => {
      toast({ title: "更新しました" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/drivers"] });
      setSelected(null);
    },
    onError: () => toast({ variant: "destructive", title: "更新に失敗しました" }),
  });

  const drivers = data?.drivers ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / limit);

  const openDetail = (d: Driver) => {
    setSelected(d);
    setEditStatus(d.status);
    setMemo(d.memo || "");
  };

  const copyUrl = async () => {
    await navigator.clipboard.writeText(FORM_URL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const st = (status: string) =>
    STATUS_LABELS[status] ?? { label: status, color: "bg-gray-100 text-gray-500 border-gray-200" };

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 max-w-6xl mx-auto w-full flex-1">

        {/* Header */}
        <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#d05a2a] flex items-center justify-center shrink-0">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">求職者管理</h1>
              <p className="text-sm text-muted-foreground">登録ドライバー {total}件</p>
            </div>
          </div>

          {/* Form URL section */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-lg px-3 py-1.5">
              <span className="text-xs text-orange-700 font-mono truncate max-w-[200px] md:max-w-xs">{FORM_URL}</span>
              <button
                onClick={copyUrl}
                className="text-orange-600 hover:text-orange-800 transition-colors shrink-0"
                title="URLをコピー"
              >
                {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <a href="/driver-register" target="_blank" rel="noopener noreferrer">
              <Button size="sm" className="bg-[#d05a2a] hover:bg-[#b84d24] gap-1.5 text-sm">
                <ExternalLink className="w-3.5 h-3.5" />
                フォームを開く
              </Button>
            </a>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 text-sm border-green-300 text-green-700 hover:bg-green-50"
              onClick={() => syncMutation.mutate()}
              disabled={syncMutation.isPending}
            >
              {syncMutation.isPending
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : <RefreshCw className="w-3.5 h-3.5" />}
              Airtable同期
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="名前・電話番号・都道府県で検索"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="ステータス" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全て</SelectItem>
              {Object.entries(STATUS_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
            <Loader2 className="w-5 h-5 animate-spin" /> 読み込み中...
          </div>
        ) : drivers.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Car className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="font-medium">求職者が見つかりません</p>
            <p className="text-sm mt-1">フォームURLをINDEEDの応募者に共有しましょう</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/80">
                    <th className="text-left px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">名前</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">電話番号</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide hidden sm:table-cell">都道府県</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide hidden md:table-cell">希望</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide hidden md:table-cell">黒N</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">ステータス</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide hidden lg:table-cell">登録日</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {drivers.map((d) => {
                    const s = st(d.status);
                    const isSelected = selected?.id === d.id;
                    return (
                      <tr
                        key={d.id}
                        className={`hover:bg-orange-50/50 cursor-pointer transition-colors ${isSelected ? "bg-orange-50" : ""}`}
                        onClick={() => openDetail(d)}
                      >
                        <td className="px-4 py-3 font-medium text-gray-900">{d.name}</td>
                        <td className="px-4 py-3 text-gray-600 font-mono text-xs">{d.phone}</td>
                        <td className="px-4 py-3 text-gray-600 hidden sm:table-cell">{d.prefecture || <span className="text-gray-300">—</span>}</td>
                        <td className="px-4 py-3 text-gray-600 hidden md:table-cell text-xs">{d.employment_type || <span className="text-gray-300">—</span>}</td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          {d.has_black_number
                            ? <span className="text-emerald-600 font-medium text-xs">あり</span>
                            : <span className="text-gray-300 text-xs">なし</span>}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${s.color}`}>
                            {s.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-400 text-xs hidden lg:table-cell">
                          {new Date(d.created_at).toLocaleDateString("ja-JP")}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-5">
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm text-muted-foreground">{page} / {totalPages}</span>
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Side Panel */}
      <Sheet open={!!selected} onOpenChange={(o) => { if (!o) setSelected(null); }}>
        <SheetContent side="right" className="w-full sm:w-[440px] overflow-y-auto p-0">
          {selected && (
            <>
              {/* Panel Header */}
              <SheetHeader className="px-5 pt-5 pb-4 border-b border-gray-100 sticky top-0 bg-white z-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                      <Car className="w-5 h-5 text-[#d05a2a]" />
                    </div>
                    <div>
                      <SheetTitle className="text-base leading-tight">{selected.name}</SheetTitle>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border mt-1 ${st(editStatus).color}`}>
                        {st(editStatus).label}
                      </span>
                    </div>
                  </div>
                </div>
              </SheetHeader>

              <div className="px-5 py-4 space-y-5">
                {/* Contact */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">連絡先</p>
                  <div className="space-y-2">
                    <a href={`tel:${selected.phone}`} className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800">
                      <Phone className="w-4 h-4 shrink-0" />
                      <span className="font-mono">{selected.phone}</span>
                    </a>
                    {selected.email && (
                      <a href={`mailto:${selected.email}`} className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800">
                        <Mail className="w-4 h-4 shrink-0" />
                        <span className="truncate">{selected.email}</span>
                      </a>
                    )}
                    {selected.prefecture && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="w-4 h-4 shrink-0 text-gray-400" />
                        <span>{selected.prefecture}{selected.address ? `・${selected.address}` : ""}</span>
                      </div>
                    )}
                    {selected.birth_date && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="w-4 h-4 shrink-0 text-gray-400" />
                        <span>{selected.birth_date}{selected.gender ? `（${selected.gender}）` : ""}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Details grid */}
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">経験・資格</p>
                  <div className="grid grid-cols-2 gap-2 bg-gray-50 rounded-xl p-4">
                    {([
                      ["免許", selected.license_type],
                      ["経験年数", selected.experience_years],
                      ["黒ナンバー", selected.has_black_number ? "取得済" : "なし"],
                      ["車両所有", selected.owns_vehicle ? "あり" : "なし"],
                    ] as [string, string | null | boolean][]).map(([k, v]) => (
                      <div key={k}>
                        <span className="text-xs text-gray-400">{k}</span>
                        <p className="text-sm font-medium text-gray-800">{v || "—"}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">希望条件</p>
                  <div className="grid grid-cols-2 gap-2 bg-gray-50 rounded-xl p-4">
                    {([
                      ["雇用形態", selected.employment_type],
                      ["希望エリア", selected.desired_area],
                      ["開始可能", selected.available_from],
                      ["流入元", selected.source],
                    ] as [string, string | null][]).map(([k, v]) => (
                      <div key={k}>
                        <span className="text-xs text-gray-400">{k}</span>
                        <p className="text-sm font-medium text-gray-800">{v || "—"}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {selected.pr_message && (
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">自己PR</p>
                    <div className="bg-blue-50 rounded-xl p-4 text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                      {selected.pr_message}
                    </div>
                  </div>
                )}

                {/* Status + Memo */}
                <div className="border-t border-gray-100 pt-4 space-y-4">
                  <div>
                    <Label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">ステータス変更</Label>
                    <Select value={editStatus} onValueChange={setEditStatus}>
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(STATUS_LABELS).map(([k, v]) => (
                          <SelectItem key={k} value={k}>{v.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-xs font-semibold text-gray-400 uppercase tracking-wide">メモ（管理者のみ）</Label>
                    <Textarea
                      value={memo}
                      onChange={(e) => setMemo(e.target.value)}
                      rows={3}
                      placeholder="対応状況などを記入..."
                      className="mt-2 resize-none"
                    />
                  </div>

                  <Button
                    className="w-full bg-[#d05a2a] hover:bg-[#b84d24] font-semibold"
                    onClick={() => updateMutation.mutate({ id: selected.id, status: editStatus, memo })}
                    disabled={updateMutation.isPending}
                  >
                    {updateMutation.isPending
                      ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />保存中...</>
                      : "保存する"}
                  </Button>
                </div>

                <p className="text-center text-xs text-gray-300">
                  登録日: {new Date(selected.created_at).toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric" })}
                </p>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </DashboardLayout>
  );
}
