import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import type { SeoArticle } from "@shared/schema";
import SeoHead from "@/components/seo/seo-head";
import Breadcrumb from "@/components/seo/breadcrumb";
import { Calendar, ArrowRight } from "lucide-react";

function articleDate(article: SeoArticle) {
  const value = article.publishedAt || article.createdAt;
  return value ? new Date(value).toLocaleDateString("ja-JP") : "";
}

export default function Blog() {
  const { data: articles = [], isLoading } = useQuery<SeoArticle[]>({
    queryKey: ["/api/blog"],
    queryFn: () => fetch("/api/blog").then(async r => {
      if (!r.ok) throw new Error("記事を取得できませんでした");
      return r.json();
    }),
  });

  return (
    <div className="container max-w-6xl py-8 md:py-12">
      <SeoHead title="軽貨物・運送採用ブログ | KEI SAIYOU" description="軽貨物ドライバー採用、運送業界の求人に役立つノウハウをお届けします。" canonical="https://keisaiyou-sinjapan.com/blog" />
      <Breadcrumb items={[{ label: "ブログ" }]} />
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">軽貨物・運送採用ブログ</h1>
        <p className="mt-3 text-muted-foreground">ドライバー採用と運送業界に役立つ情報をお届けします。</p>
      </header>
      {isLoading ? <p className="text-muted-foreground">読み込み中...</p> : articles.length === 0 ? (
        <p className="rounded-lg border p-8 text-center text-muted-foreground">公開中の記事はありません。</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map(article => (
            <Link href={`/blog/${encodeURIComponent(article.slug)}`} key={article.id} className="group overflow-hidden rounded-xl border bg-card transition-shadow hover:shadow-md">
              {article.imageUrl && <img src={article.imageUrl} alt="" className="h-44 w-full object-cover" />}
              <div className="p-5">
                <span className="text-xs font-medium text-primary">{article.category || "コラム"}</span>
                <h2 className="mt-2 line-clamp-2 text-lg font-bold group-hover:text-primary">{article.title}</h2>
                <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{article.excerpt || article.metaDescription || ""}</p>
                <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{articleDate(article)}</span>
                  <span className="flex items-center gap-1 text-primary">読む <ArrowRight className="h-3.5 w-3.5" /></span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}