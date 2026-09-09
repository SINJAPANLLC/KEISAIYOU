import { Link, useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import type { SeoArticle } from "@shared/schema";
import SeoHead from "@/components/seo/seo-head";
import StructuredData from "@/components/seo/structured-data";
import Breadcrumb from "@/components/seo/breadcrumb";
import { Calendar, ArrowRight } from "lucide-react";

function SafeArticleContent({ content }: { content: string }) {
  return <div className="space-y-4 leading-8">
    {content.split(/\r?\n/).map((line, index) => {
      const text = line.replace(/^#{1,3}\s+/, "").trim();
      if (!text) return null;
      if (line.startsWith("### ")) return <h3 key={index} className="mt-7 text-xl font-bold">{text}</h3>;
      if (line.startsWith("## ")) return <h2 key={index} className="mt-9 text-2xl font-bold">{text}</h2>;
      if (line.startsWith("# ")) return <p key={index} className="text-lg font-semibold">{text}</p>;
      if (/^[-*]\s+/.test(line)) return <li key={index} className="ml-5 list-disc">{line.replace(/^[-*]\s+/, "")}</li>;
      return <p key={index}>{line}</p>;
    })}
  </div>;
}

export default function BlogArticle() {
  const [, params] = useRoute("/blog/:slug");
  const slug = params?.slug || "";
  const { data: article, isLoading, isError } = useQuery<SeoArticle>({
    queryKey: ["/api/blog", slug],
    queryFn: () => fetch(`/api/blog/${encodeURIComponent(slug)}`).then(async r => {
      if (!r.ok) throw new Error("Not found");
      return r.json();
    }),
    enabled: !!slug,
  });
  const { data: related = [] } = useQuery<SeoArticle[]>({
    queryKey: ["/api/blog", slug, "related"],
    queryFn: () => fetch(`/api/blog/${encodeURIComponent(slug)}/related`).then(r => r.ok ? r.json() : []),
    enabled: !!article,
  });
  if (isLoading) return <div className="container py-12 text-muted-foreground">読み込み中...</div>;
  if (isError || !article) return <div className="container py-12"><h1 className="text-2xl font-bold">記事が見つかりません</h1><Link href="/blog" className="mt-4 inline-block text-primary">ブログ一覧へ</Link></div>;
  const canonical = article.canonicalUrl || `https://keisaiyou-sinjapan.com/blog/${encodeURIComponent(article.slug)}`;
  const published = article.publishedAt || article.createdAt;
  return <article className="container max-w-3xl py-8 md:py-12">
    <SeoHead title={article.seoTitle || `${article.title} | KEI SAIYOU`} description={article.metaDescription || article.excerpt || article.title} canonical={canonical} ogType="article" />
    <StructuredData type="Article" data={{ headline: article.title, description: article.metaDescription || article.excerpt, mainEntityOfPage: canonical, datePublished: published ? new Date(published).toISOString() : undefined, image: article.imageUrl || undefined }} />
    <Breadcrumb items={[{ label: "ブログ", href: "/blog" }, { label: article.title }]} />
    <header className="border-b pb-7">
      <span className="text-sm font-medium text-primary">{article.category || "コラム"}</span>
      <h1 className="mt-3 text-3xl font-bold leading-tight md:text-4xl">{article.title}</h1>
      {published && <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground"><Calendar className="h-4 w-4" />{new Date(published).toLocaleDateString("ja-JP")}</p>}
    </header>
    {article.imageUrl && <img src={article.imageUrl} alt="" className="mt-7 max-h-[420px] w-full rounded-xl object-cover" />}
    {article.excerpt && <p className="mt-6 rounded-lg bg-muted p-5 leading-7 text-muted-foreground">{article.excerpt}</p>}
    <section className="mt-8"><SafeArticleContent content={article.content} /></section>
    <section className="mt-12 rounded-xl bg-primary p-7 text-primary-foreground">
      <h2 className="text-2xl font-bold">軽貨物ドライバーの採用を始めませんか？</h2>
      <p className="mt-2 text-primary-foreground/90">KEI SAIYOUなら初期費用・月額費用0円で求人を掲載できます。</p>
      <Link href="/register" className="mt-5 inline-flex items-center gap-2 rounded-md bg-white px-5 py-3 font-bold text-primary">無料で登録する <ArrowRight className="h-4 w-4" /></Link>
    </section>
    {related.length > 0 && <section className="mt-12">
      <h2 className="text-2xl font-bold">関連記事</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">{related.map(item => <Link key={item.id} href={`/blog/${encodeURIComponent(item.slug)}`} className="rounded-lg border p-4 hover:border-primary"><span className="text-xs text-primary">{item.category}</span><h3 className="mt-1 font-semibold">{item.title}</h3></Link>)}</div>
    </section>}
  </article>;
}