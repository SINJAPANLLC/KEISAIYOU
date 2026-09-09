import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { SeoArticle } from "@shared/schema";
import DashboardLayout from "@/components/dashboard-layout";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2, X } from "lucide-react";

type Form = { title: string; slug: string; category: string; excerpt: string; content: string; imageUrl: string; status: "draft" | "published"; publishedAt: string; seoTitle: string; metaDescription: string; canonicalUrl: string };
const empty = (): Form => ({ title: "", slug: "", category: "コラム", excerpt: "", content: "", imageUrl: "", status: "draft", publishedAt: "", seoTitle: "", metaDescription: "", canonicalUrl: "" });
const fromArticle = (a: SeoArticle): Form => ({ title: a.title, slug: a.slug, category: a.category || "コラム", excerpt: a.excerpt || "", content: a.content, imageUrl: a.imageUrl || "", status: a.status === "published" ? "published" : "draft", publishedAt: a.publishedAt ? new Date(a.publishedAt).toISOString().slice(0, 16) : "", seoTitle: a.seoTitle || "", metaDescription: a.metaDescription || "", canonicalUrl: a.canonicalUrl || "" });

export default function AdminBlog() {
  const client = useQueryClient();
  const { toast } = useToast();
  const [editing, setEditing] = useState<SeoArticle | null>(null);
  const [form, setForm] = useState<Form>(empty());
  const { data: articles = [], isLoading } = useQuery<SeoArticle[]>({ queryKey: ["/api/admin/blog"], queryFn: () => apiRequest("GET", "/api/admin/blog").then(r => r.json()) });
  const save = useMutation({
    mutationFn: () => apiRequest(editing ? "PATCH" : "POST", editing ? `/api/admin/blog/${editing.id}` : "/api/admin/blog", { ...form, publishedAt: form.publishedAt || null, excerpt: form.excerpt || null, imageUrl: form.imageUrl || null, seoTitle: form.seoTitle || null, metaDescription: form.metaDescription || null, canonicalUrl: form.canonicalUrl || null }).then(r => r.json()),
    onSuccess: () => { client.invalidateQueries({ queryKey: ["/api/admin/blog"] }); toast({ title: "ブログ記事を保存しました" }); setEditing(null); setForm(empty()); },
    onError: async (error: any) => toast({ title: "保存に失敗しました", description: error?.message, variant: "destructive" }),
  });
  const remove = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/blog/${id}`),
    onSuccess: () => { client.invalidateQueries({ queryKey: ["/api/admin/blog"] }); toast({ title: "記事を削除しました" }); },
  });
  const field = (key: keyof Form) => ({ value: form[key], onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm(f => ({ ...f, [key]: e.target.value })) });
  const beginNew = () => { setEditing(null); setForm(empty()); };
  const cancel = () => { setEditing(null); setForm(empty()); };
  return <DashboardLayout>
    <div className="mx-auto max-w-6xl p-5 md:p-8">
      <div className="mb-6 flex items-center justify-between"><div><h1 className="text-2xl font-bold">ブログ管理</h1><p className="mt-1 text-sm text-muted-foreground">公開記事の作成・編集・SEO設定</p></div><Button onClick={beginNew}><Plus className="mr-2 h-4 w-4" />新規記事</Button></div>
      {(editing !== null || form.title || form.content) && <form className="mb-8 space-y-5 rounded-xl border bg-card p-5" onSubmit={e => { e.preventDefault(); save.mutate(); }}>
        <div className="flex items-center justify-between"><h2 className="font-bold">{editing ? "記事を編集" : "新規記事"}</h2><Button type="button" variant="ghost" size="icon" onClick={cancel}><X className="h-4 w-4" /></Button></div>
        <div className="grid gap-4 md:grid-cols-2">
          <div><Label>タイトル *</Label><Input {...field("title")} required /></div><div><Label>スラッグ *</Label><Input {...field("slug")} required placeholder="keikamotsu-recruiting" /></div>
          <div><Label>カテゴリ *</Label><Input {...field("category")} required /></div><div><Label>アイキャッチ画像URL</Label><Input {...field("imageUrl")} type="url" /></div>
          <div><Label>公開状態 *</Label><Select value={form.status} onValueChange={(value: "draft" | "published") => setForm(f => ({ ...f, status: value }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="draft">下書き</SelectItem><SelectItem value="published">公開</SelectItem></SelectContent></Select></div>
          <div><Label>公開日時</Label><Input {...field("publishedAt")} type="datetime-local" /></div>
          <div><Label>SEOタイトル</Label><Input {...field("seoTitle")} maxLength={200} /></div><div><Label>canonical URL</Label><Input {...field("canonicalUrl")} type="url" /></div>
        </div>
        <div><Label>抜粋</Label><Textarea {...field("excerpt")} maxLength={1000} /></div>
        <div><Label>メタディスクリプション</Label><Textarea {...field("metaDescription")} maxLength={300} /></div>
        <div><Label>本文 *（Markdown見出し対応）</Label><Textarea {...field("content")} required className="min-h-72 font-mono" /></div>
        <Button type="submit" disabled={save.isPending}>{save.isPending ? "保存中..." : "保存する"}</Button>
      </form>}
      <div className="overflow-hidden rounded-xl border"><table className="w-full text-sm"><thead className="bg-muted text-left"><tr><th className="p-3">タイトル</th><th className="p-3">状態</th><th className="p-3">公開日</th><th className="p-3" /></tr></thead><tbody>
        {isLoading ? <tr><td colSpan={4} className="p-5 text-center">読み込み中...</td></tr> : articles.map(a => <tr key={a.id} className="border-t"><td className="p-3"><div className="font-medium">{a.title}</div><div className="text-xs text-muted-foreground">/blog/{a.slug}</div></td><td className="p-3">{a.status === "published" ? "公開" : "下書き"}</td><td className="p-3">{a.publishedAt ? new Date(a.publishedAt).toLocaleDateString("ja-JP") : "-"}</td><td className="flex gap-2 p-3"><Button size="icon" variant="ghost" onClick={() => { setEditing(a); setForm(fromArticle(a)); }}><Pencil className="h-4 w-4" /></Button><Button size="icon" variant="ghost" onClick={() => { if (confirm("この記事を削除しますか？")) remove.mutate(a.id); }}><Trash2 className="h-4 w-4 text-destructive" /></Button></td></tr>)}
        {!isLoading && articles.length === 0 && <tr><td colSpan={4} className="p-5 text-center text-muted-foreground">記事がありません。</td></tr>}
      </tbody></table></div>
    </div>
  </DashboardLayout>;
}