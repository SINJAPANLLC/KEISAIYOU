import OpenAI from "openai";
import pg from "pg";

type ArticleTopic = {
  topic: string;
  keywords: string;
  category: ArticleCategory;
};

const ARTICLE_CATEGORIES = ["driver-recruitment", "transport-company"] as const;
type ArticleCategory = (typeof ARTICLE_CATEGORIES)[number];

// Keep this list finite and deterministic. Once it is exhausted, a topic is
// requested from OpenAI, but it is still checked against the database below.
const SEO_TOPICS: ArticleTopic[] = [
  { topic: "軽貨物ドライバー採用を成功させる求人票の書き方", keywords: "軽貨物, ドライバー採用, 求人票, 採用", category: "driver-recruitment" },
  { topic: "運送会社がドライバー不足を解消する採用チャネルの選び方", keywords: "運送会社, ドライバー不足, 採用チャネル, 求人", category: "transport-company" },
  { topic: "軽貨物ドライバーの応募を増やす仕事内容と待遇の伝え方", keywords: "軽貨物ドライバー, 応募, 仕事内容, 待遇", category: "driver-recruitment" },
  { topic: "運送会社の採用面接で確認したいドライバーの適性", keywords: "運送会社, 採用面接, ドライバー, 適性", category: "transport-company" },
  { topic: "未経験から軽貨物ドライバーを採用するときの教育方法", keywords: "軽貨物, 未経験, ドライバー採用, 教育", category: "driver-recruitment" },
  { topic: "運送会社の採用コストを抑えながら応募を増やす方法", keywords: "運送会社, 採用コスト, 応募, 採用活動", category: "transport-company" },
  { topic: "軽貨物ドライバーが長く働ける会社の求人条件", keywords: "軽貨物ドライバー, 求人条件, 定着, 働き方", category: "driver-recruitment" },
  { topic: "運送会社のドライバー定着率を高めるオンボーディング", keywords: "運送会社, ドライバー定着, オンボーディング, 人材", category: "transport-company" },
  { topic: "女性ドライバー採用を進める軽貨物事業者の職場づくり", keywords: "女性ドライバー, 軽貨物, 採用, 職場環境", category: "driver-recruitment" },
  { topic: "シニアドライバーを運送会社で採用するときのポイント", keywords: "シニア, ドライバー採用, 運送会社, 働き方", category: "transport-company" },
  { topic: "軽貨物ドライバー求人で業務委託と正社員を正しく説明する方法", keywords: "軽貨物, ドライバー求人, 業務委託, 正社員", category: "driver-recruitment" },
  { topic: "運送会社が採用前に整えるべき給与と評価制度", keywords: "運送会社, 採用, 給与制度, 評価制度", category: "transport-company" },
  { topic: "軽貨物ドライバー求人の勤務地と配送エリアの見せ方", keywords: "軽貨物ドライバー, 求人, 配送エリア, 勤務地", category: "driver-recruitment" },
  { topic: "運送会社の採用ブランディングで信頼を伝える方法", keywords: "運送会社, 採用ブランディング, 求人, 信頼", category: "transport-company" },
  { topic: "軽貨物ドライバー採用で応募者に伝える車両準備と費用", keywords: "軽貨物, ドライバー採用, 車両, 応募", category: "driver-recruitment" },
  { topic: "運送会社が採用活動で活用できる社員紹介制度", keywords: "運送会社, 社員紹介, ドライバー採用, 採用活動", category: "transport-company" },
  { topic: "軽貨物ドライバーの求人応募から面接までの離脱を減らす方法", keywords: "軽貨物ドライバー, 求人応募, 面接, 採用改善", category: "driver-recruitment" },
  { topic: "運送会社の採用担当者が知っておきたい求人広告の改善指標", keywords: "運送会社, 求人広告, 採用指標, ドライバー", category: "transport-company" },
  { topic: "軽貨物ドライバー採用で入社後のミスマッチを防ぐ確認事項", keywords: "軽貨物, ドライバー採用, ミスマッチ, 求人", category: "driver-recruitment" },
  { topic: "地域の運送会社が地元ドライバーを採用するための施策", keywords: "運送会社, 地域採用, ドライバー, 求人施策", category: "transport-company" },
  { topic: "軽貨物ドライバーの採用に適した求人情報の写真と構成", keywords: "軽貨物ドライバー, 求人情報, 写真, 採用", category: "driver-recruitment" },
  { topic: "運送会社の採用担当者向けドライバー応募者対応マニュアル", keywords: "運送会社, 採用担当者, 応募者対応, ドライバー", category: "transport-company" },
  { topic: "軽貨物ドライバーの収入例を求人で分かりやすく示す方法", keywords: "軽貨物, ドライバー, 収入例, 求人", category: "driver-recruitment" },
  { topic: "運送会社が採用後の安全教育を定着させる仕組み", keywords: "運送会社, 安全教育, ドライバー採用, 定着", category: "transport-company" },
];

const DAILY_ARTICLE_COUNT = 1;
const JST_TIME_ZONE = "Asia/Tokyo";

function getOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY || process.env.AI_INTEGRATIONS_OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OpenAI API key not configured");
  }
  return new OpenAI({
    apiKey,
    ...(process.env.OPENAI_API_KEY
      ? {}
      : process.env.AI_INTEGRATIONS_OPENAI_BASE_URL
        ? { baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL }
        : {}),
  });
}

function jstDateString(date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: JST_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const value = (type: string) => parts.find((part) => part.type === type)?.value || "";
  return `${value("year")}-${value("month")}-${value("day")}`;
}

function jstParts(date = new Date()): { year: number; month: number; day: number; hour: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: JST_TIME_ZONE,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    hour12: false,
    hourCycle: "h23",
  }).formatToParts(date);
  const value = (type: string) => Number(parts.find((part) => part.type === type)?.value);
  return { year: value("year"), month: value("month"), day: value("day"), hour: value("hour") };
}

function generateSlug(title: string, articleDate: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^\w\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF\s-]/g, "")
    .replace(/\s+/g, "-")
    .substring(0, 60);
  const rand = Math.random().toString(36).substring(2, 8);
  return `${articleDate}-${rand}-${base || "article"}`;
}

function parseJsonObject(text: string): Record<string, unknown> | null {
  const start = text.indexOf("{");
  if (start < 0) return null;
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < text.length; i += 1) {
    const character = text[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (character === "\\") escaped = true;
      else if (character === "\"") inString = false;
      continue;
    }
    if (character === "\"") {
      inString = true;
    } else if (character === "{") {
      depth += 1;
    } else if (character === "}" && --depth === 0) {
      try {
        const parsed = JSON.parse(text.slice(start, i + 1));
        return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : null;
      } catch {
        return null;
      }
    }
  }
  return null;
}

function isArticleCategory(value: unknown): value is ArticleCategory {
  return typeof value === "string" && (ARTICLE_CATEGORIES as readonly string[]).includes(value);
}

async function selectNovelTopic(client: pg.Client, recentTitles: string[], usedTopics: Set<string>): Promise<ArticleTopic | null> {
  try {
    const completion = await getOpenAI().chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `あなたはKEI SAIYOU（軽貨物・運送会社のドライバー採用プラットフォーム）の編集者です。
最近の記事タイトルと重複しない、ドライバー採用または運送会社の採用に役立つ新しい記事テーマを1つ考えてください。
JSONだけを返してください。形式: {"topic":"記事テーマ","keywords":"SEOキーワードをカンマ区切り","category":"driver-recruitment または transport-company"}`,
        },
        {
          role: "user",
          content: `最近の記事タイトル:\n${recentTitles.slice(0, 30).join("\n") || "なし"}\n\n既存テーマと完全一致しないテーマを作成してください。`,
        },
      ],
      max_tokens: 300,
      response_format: { type: "json_object" },
    });
    const parsed = parseJsonObject(completion.choices[0]?.message?.content || "");
    const topic = typeof parsed?.topic === "string" ? parsed.topic.trim() : "";
    const keywords = typeof parsed?.keywords === "string" ? parsed.keywords.trim() : "";
    const category = parsed?.category;
    if (!topic || !keywords || !isArticleCategory(category) || usedTopics.has(topic)) return null;
    // The client argument is intentional: topic selection happens under the
    // same session lock as the eventual insert.
    void client;
    return { topic, keywords, category };
  } catch (error) {
    console.error("[Auto Article] Failed to generate a novel topic:", error);
    return null;
  }
}

async function generateSingleArticle(
  client: pg.Client,
  selectedTopic: ArticleTopic,
  articleDate: string,
  articleIndex: number,
): Promise<boolean> {
  try {
    const completion = await getOpenAI().chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `あなたはSEOに強い採用・物流業界専門のコラムライターです。「KEI SAIYOU」という軽貨物ドライバー採用・運送会社の採用プラットフォームのコラム記事を作成してください。

記事の要件：
1. SEOに最適化されたタイトル（# 見出し）を付ける
2. 読者を引き込む導入文（200文字程度）
3. 本文（## と ### の見出しで構造化、合計2000〜3000文字）
   - 軽貨物ドライバーまたは運送会社の採用担当者に実用的な内容にする
   - 具体例、採用データの読み方、応募者対応のポイントを含める
   - テーマに沿うSEOキーワードを自然に使う
   - KEI SAIYOUの求人掲載・応募機能を自然に紹介する
4. まとめ・結論

マークダウン形式で出力し、HTMLタグは使わないでください。見出しに「H2:」「H3:」のプレフィックスは付けないでください。

最後に次の形式でメタ情報を出力してください：
---META---
{"metaDescription":"160文字以内のSEO用ディスクリプション","faq":[{"question":"質問1","answer":"回答1"},{"question":"質問2","answer":"回答2"},{"question":"質問3","answer":"回答3"}]}`,
        },
        {
          role: "user",
          content: `テーマ: ${selectedTopic.topic}\nキーワード: ${selectedTopic.keywords}\n備考: KEI SAIYOUをドライバー採用の選択肢として自然に紹介してください。`,
        },
      ],
      max_tokens: 4000,
    });

    const rawContent = completion.choices[0]?.message?.content || "";
    const markerIndex = rawContent.indexOf("---META---");
    const articleContent = (markerIndex >= 0 ? rawContent.slice(0, markerIndex) : rawContent).trim();
    const metadata = parseJsonObject(markerIndex >= 0 ? rawContent.slice(markerIndex + "---META---".length) : "");
    const metaDescription = typeof metadata?.metaDescription === "string" ? metadata.metaDescription.trim() : "";
    const faq = Array.isArray(metadata?.faq) ? JSON.stringify(metadata.faq) : null;
    const titleMatch = articleContent.match(/^#\s+(.+)$/m);
    const title = (titleMatch?.[1] || selectedTopic.topic).trim();

    // Do not publish malformed model output. In particular, an empty
    // description would produce an article which cannot be indexed properly.
    if (!title || !articleContent || !metaDescription) {
      console.error(`[Auto Article] [${articleIndex + 1}] Model returned incomplete article data`);
      return false;
    }

    const slug = generateSlug(title, articleDate);
    const wordCount = articleContent.replace(/[#*\-\n\s]/g, "").length;
    await client.query(
      `INSERT INTO seo_articles
        (topic, keywords, title, slug, meta_description, content, status, auto_generated, category, word_count, faq, published_at)
       VALUES ($1, $2, $3, $4, $5, $6, 'published', TRUE, $7, $8, $9, NOW())
       RETURNING id`,
      [selectedTopic.topic, selectedTopic.keywords, title, slug, metaDescription, articleContent, selectedTopic.category, wordCount, faq],
    );
    console.log(`[Auto Article] [${articleIndex + 1}] Successfully generated and published: ${title}`);
    return true;
  } catch (error) {
    console.error(`[Auto Article] [${articleIndex + 1}] Failed to generate article:`, error);
    return false;
  }
}

export async function runDailyArticleGeneration(): Promise<boolean> {
  const connectionString = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("[Auto Article] Database connection is not configured");
    return false;
  }

  const client = new pg.Client({ connectionString });
  const articleDate = jstDateString();
  const lockKey = `kei-saiyou:auto-article:${articleDate}`;
  let lockHeld = false;
  try {
    await client.connect();
    const lockResult = await client.query<{ locked: boolean }>(
      "SELECT pg_try_advisory_lock(hashtextextended($1, 0)) AS locked",
      [lockKey],
    );
    if (!lockResult.rows[0]?.locked) {
      console.log(`[Auto Article] Another process owns today's generation lock (${articleDate}), skipping.`);
      return false;
    }
    lockHeld = true;

    // This deliberately uses PostgreSQL's timezone conversion rather than
    // the server's local date. The session lock remains held for this query,
    // topic selection, every OpenAI request, and the insert.
    const countResult = await client.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count
       FROM seo_articles
       WHERE auto_generated = TRUE
         AND ((created_at AT TIME ZONE 'UTC') AT TIME ZONE '${JST_TIME_ZONE}')::date = $1::date`,
      [articleDate],
    );
    const todayCount = Number(countResult.rows[0]?.count || 0);
    if (todayCount >= DAILY_ARTICLE_COUNT) {
      console.log(`[Auto Article] Today's article already generated (${articleDate}), skipping.`);
      return true;
    }

    const articlesResult = await client.query<{ topic: string; title: string }>(
      `SELECT topic, title
       FROM seo_articles
       WHERE status IN ('draft', 'published')
       ORDER BY created_at DESC`,
    );
    const usedTopics = new Set(articlesResult.rows.map((article) => article.topic));
    const fixedTopic = SEO_TOPICS.find((topic) => !usedTopics.has(topic.topic));
    const selectedTopic = fixedTopic || await selectNovelTopic(
      client,
      articlesResult.rows.map((article) => article.title),
      usedTopics,
    );
    if (!selectedTopic) {
      console.log("[Auto Article] No unique topic is available; skipping today's article.");
      return false;
    }

    console.log(`[Auto Article] Generating today's article (${articleDate}): ${selectedTopic.topic}`);
    const generated = await generateSingleArticle(client, selectedTopic, articleDate, todayCount);
    if (generated) await pingGoogleSitemap();
    return generated;
  } catch (error) {
    console.error("[Auto Article] Failed during daily generation:", error);
    return false;
  } finally {
    if (lockHeld) {
      try {
        await client.query("SELECT pg_advisory_unlock(hashtextextended($1, 0))", [lockKey]);
      } catch (error) {
        console.error("[Auto Article] Failed to release generation lock:", error);
      }
    }
    await client.end().catch((error) => {
      console.error("[Auto Article] Failed to close generation database client:", error);
    });
  }
}

export async function pingGoogleSitemap(): Promise<void> {
  try {
    const baseUrl = process.env.SITE_URL || "https://keisaiyou-sinjapan.com";
    const sitemapUrl = encodeURIComponent(`${baseUrl}/sitemap.xml`);
    const response = await fetch(`https://www.google.com/ping?sitemap=${sitemapUrl}`);
    if (response.ok) {
      console.log("[Sitemap Ping] Successfully pinged Google with sitemap update");
    } else {
      console.log(`[Sitemap Ping] Google responded with status ${response.status}`);
    }
  } catch (error) {
    console.log("[Sitemap Ping] Failed to ping Google (non-critical):", error);
  }
}

function millisecondsUntilNextJstSix(): number {
  const now = new Date();
  const current = jstParts(now);
  const nextDay = current.hour >= 6 ? 1 : 0;
  // JST has no daylight-saving transitions, so this UTC conversion is stable.
  const nextSixUtc = Date.UTC(current.year, current.month - 1, current.day + nextDay, 6 - 9, 0, 0);
  return Math.max(1000, nextSixUtc - now.getTime());
}

export function scheduleAutoArticleGeneration(): void {
  // The production scheduler calls this once shortly after startup. This
  // startup attempt also makes a deployment self-healing if the 06:00 timer
  // was missed during a restart.
  void runDailyArticleGeneration();

  const scheduleNextRun = () => {
    const delay = millisecondsUntilNextJstSix();
    console.log(`[Auto Article] Next generation scheduled in ${Math.round(delay / 60000)} minutes (06:00 JST).`);
    setTimeout(async () => {
      await runDailyArticleGeneration();
      scheduleNextRun();
    }, delay);
  };
  scheduleNextRun();
}