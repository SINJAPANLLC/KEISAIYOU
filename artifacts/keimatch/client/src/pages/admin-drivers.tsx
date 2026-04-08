import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Car, Phone, Mail, MapPin, Calendar, ChevronLeft, ChevronRight, Users, Search } from "lucide-react";

type Driver = {
  id: number;
  name: string;
  phone: string;
  email: string | null;
  prefecture: string | null;
  address: string | null;
  birthDate: string | null;
  gender: string | null;
  licenseType: string | null;
  hasBlackNumber: boolean | null;
  ownsVehicle: boolean | null;
  experience: string | null;
  experienceYears: string | null;
  employmentType: string | null;
  desiredArea: string | null;
  availableFrom: string | null;
  prMessage: string | null;
  source: string | null;
  status: string;
  memo: string | null;
  createdAt: string;
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  new:        { label: "新規", color: "bg-blue-100 text-blue-700" },
  contacted:  { label: "連絡済", color: "bg-yellow-100 text-yellow-700" },
  interested: { label: "興味あり", color: "bg-green-100 text-green-700" },
  hired:      { label: "採用決定", color: "bg-emerald-100 text-emerald-700" },
  rejected:   { label: "不採用", color: "bg-gray-100 text-gray-500" },
};

export default function AdminDrivers() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Driver | null>(null);
  const [memo, setMemo] = useState("");
  const limit = 20;

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
    setMemo(d.memo || "");
  };

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-[#d05a2a] flex items-center justify-center">
          <Users className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">求職者一覧</h1>
          <p className="text-sm text-muted-foreground">登録ドライバー {total}件</p>
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
        <div className="text-center py-16 text-muted-foreground">読み込み中...</div>
      ) : drivers.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Car className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>求職者が見つかりません</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">名前</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">電話番号</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden sm:table-cell">都道府県</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden md:table-cell">雇用形態希望</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden md:table-cell">黒N</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">ステータス</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden lg:table-cell">登録日</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {drivers.map((d) => {
                  const st = STATUS_LABELS[d.status] ?? { label: d.status, color: "bg-gray-100 text-gray-500" };
                  return (
                    <tr key={d.id} className="border-b border-gray-50 hover:bg-orange-50/40 cursor-pointer" onClick={() => openDetail(d)}>
                      <td className="px-4 py-3 font-medium text-gray-900">{d.name}</td>
                      <td className="px-4 py-3 text-gray-600">{d.phone}</td>
                      <td className="px-4 py-3 text-gray-600 hidden sm:table-cell">{d.prefecture || "-"}</td>
                      <td className="px-4 py-3 text-gray-600 hidden md:table-cell">{d.employmentType || "-"}</td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        {d.hasBlackNumber ? <span className="text-emerald-600 font-medium">あり</span> : <span className="text-gray-400">なし</span>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${st.color}`}>{st.label}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 hidden lg:table-cell">
                        {new Date(d.createdAt).toLocaleDateString("ja-JP")}
                      </td>
                      <td className="px-4 py-3">
                        <Button variant="ghost" size="sm" className="text-xs">詳細</Button>
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

      {/* Detail Dialog */}
      <Dialog open={!!selected} onOpenChange={(o) => { if (!o) setSelected(null); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Car className="w-5 h-5 text-[#d05a2a]" />
              {selected?.name}
            </DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="w-4 h-4 shrink-0" />
                  <a href={`tel:${selected.phone}`} className="text-blue-600 underline">{selected.phone}</a>
                </div>
                {selected.email && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="w-4 h-4 shrink-0" />
                    <a href={`mailto:${selected.email}`} className="text-blue-600 underline truncate">{selected.email}</a>
                  </div>
                )}
                {selected.prefecture && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="w-4 h-4 shrink-0" />
                    <span>{selected.prefecture}{selected.address ? `・${selected.address}` : ""}</span>
                  </div>
                )}
                {selected.birthDate && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="w-4 h-4 shrink-0" />
                    <span>{selected.birthDate}</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 bg-gray-50 rounded-xl p-4">
                {[
                  ["性別", selected.gender],
                  ["免許", selected.licenseType],
                  ["経験年数", selected.experienceYears],
                  ["黒ナンバー", selected.hasBlackNumber ? "取得済" : "なし"],
                  ["車両所有", selected.ownsVehicle ? "あり" : "なし"],
                  ["希望雇用", selected.employmentType],
                  ["希望エリア", selected.desiredArea],
                  ["開始可能", selected.availableFrom],
                  ["流入元", selected.source],
                ].filter(([, v]) => v).map(([k, v]) => (
                  <div key={k as string}>
                    <span className="text-xs text-muted-foreground">{k}</span>
                    <p className="font-medium">{v as string}</p>
                  </div>
                ))}
              </div>

              {selected.prMessage && (
                <div className="bg-blue-50 rounded-xl p-4">
                  <p className="text-xs text-muted-foreground mb-1">自己PR</p>
                  <p className="text-gray-800 whitespace-pre-wrap">{selected.prMessage}</p>
                </div>
              )}

              <div>
                <p className="text-xs text-muted-foreground mb-1">ステータス変更</p>
                <Select
                  value={selected.status}
                  onValueChange={(v) => setSelected({ ...selected, status: v })}
                >
                  <SelectTrigger>
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
                <p className="text-xs text-muted-foreground mb-1">メモ（管理者のみ表示）</p>
                <Textarea
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  rows={3}
                  placeholder="対応状況などを記入..."
                  className="resize-none"
                />
              </div>

              <Button
                className="w-full bg-[#d05a2a] hover:bg-[#b84d24]"
                onClick={() => updateMutation.mutate({ id: selected.id, status: selected.status, memo })}
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? "保存中..." : "保存する"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
