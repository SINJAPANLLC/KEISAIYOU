json({ success: true });
    } catch (error) {
      res.json({ success: true });
    }
  });

  // Public blog API. These endpoints deliberately never reveal drafts.
  app.get("/api/blog", async (_req, res) => {
    try {
      res.json(await storage.getPublishedSeoArticles());
    } catch {
      res.status(500).json({ message: "ブログ記事の取得に失敗しました" });
    }
  });

  app.get("/api/blog/:slug", async (req, res) => {
    try {
      const article = await storage.getSeoArticleBySlug(routeParam(req, "slug"));
      if (!article || article.status !== "published") {
        return res.status(404).json({ message: "記事が見つかりません" });
      }
      res.json(article);
    } catch {
      res.status(500).json({ message: "ブログ記事の取得に失敗しました" });
    }
  });

  app.get("/api/blog/:slug/related", async (req, res) => {
    try {
      const article = await storage.getSeoArticleBySlug(routeParam(req, "slug"));
      if (!article || article.status !== "published") {
        return res.status(404).json({ message: "記事が見つかりません" });
      }
      res.json(await storage.getRelatedSeoArticles(article.id, article.category || "kyukakyusha", 3));
    } catch {
      res.status(500).json({ message: "関連記事の取得に失敗しました" });
    }
  });

  app.get("/api/youtube-videos", async (_req, res) => {
    try {
      const limit = parseInt(_req.query.limit as string) || 6;
      const videos = await storage.getVisibleYoutubeVideos(limit);
      res.json(videos);
    } catch (error) {
      res.status(500).json({ message: "動画の取得に失敗しました" });
    }
  });

  app.post("/api/admin/youtube/fetch", requireAdmin, async (_req, res) => {
    try {
      const apiKey = process.env.YOUTUBE_API_KEY;
      const channelId = process.env.YOUTUBE_CHANNEL_ID;
      if (!apiKey || !channelId) {
        return res.status(400).json({ message: "YOUTUBE_API_KEY と YOUTUBE_CHANNEL_ID の環境変数を設定してください" });
      }

      const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&maxResults=20&order=date&type=video&key=${apiKey}`;
      const searchRes = await fetch(searchUrl);
      if (!searchRes.ok) {
        const errBody = await searchRes.text();
        return res.status(500).json({ message: `YouTube API エラー: ${errBody}` });
      }
      const searchData = await searchRes.json() as any;
      const items = searchData.items || [];

      let savedCount = 0;
      for (const item of items) {
        const videoId = item.id?.videoId;
        if (!videoId) continue;
        await storage.upsertYoutubeVideo({
          videoId,
          title: item.snippet?.title || "",
          description: item.snippet?.description || "",
          thumbnailUrl: item.snippet?.thumbnails?.high?.url || item.snippet?.thumbnails?.medium?.url || "",
          publishedAt: item.snippet?.publishedAt ? new Date(item.snippet.publishedAt) : null,
          channelTitle: item.snippet?.channelTitle || "",
          duration: null,
          viewCount: 0,
          isVisible: true,
        });
        savedCount++;
      }

      res.json({ message: `${savedCount}件の動画を取得しました`, count: savedCount });
    } catch (error) {
      res.status(500).json({ message: "YouTube動画の取得に失敗しました" });
    }
  });

  app.get("/api/admin/youtube-videos", requireAdmin, async (_req, res) => {
    try {
      const videos = await storage.getYoutubeVideos();
      res.json(videos);
    } catch (error) {
      res.status(500).json({ message: "動画の取得に失敗しました" });
    }
  });

  app.patch("/api/admin/youtube-videos/:id/visibility", requireAdmin, async (req, res) => {
    try {
      const { isVisible } = req.body;
      const video = await storage.updateYoutubeVideoVisibility(routeParam(req, "id"), isVisible);
      if (!video) return res.status(404).json({ message: "動画が見つかりません" });
      res.json(video);
    } catch (error) {
      res.status(500).json({ message: "更新に失敗しました" });
    }
  });

  app.delete("/api/admin/youtube-videos/:id", requireAdmin, async (req, res) => {
    try {
      await storage.deleteYoutubeVideo(routeParam(req, "id"));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "削除に失敗しました" });
    }
  });

  app.post("/api/admin/youtube/auto-publish", requireAdmin, async (_req, res) => {
    try {
      const { runDailyAutoPublish } = await import("./youtube-auto-publisher");
      const result = await runDailyAutoPublish();
      res.json({ message: `${result.started}本の動画生成を開始しました`, ...result });
    } catch (error: any) {
      res.status(500).json({ message: error?.message || "自動投稿の開始に失敗しました" });
    }
  });

  app.post("/api/admin/youtube/auto-publish-single", requireAdmin, async (req, res) => {
    try {
      const { topic } = req.body;
      if (!topic) return res.status(400).json({ message: "トピックを指定してください" });
      const { processAutoPublishJob } = await import("./youtube-auto-publisher");
      const job = await storage.createYoutubeAutoPublishJob({ topic, status: "pending" });
      processAutoPublishJob(job.id).catch((err: any) =>
        console.error(`[YouTube Auto] Single job ${job.id} error:`, err?.message)
      );
      res.json({ message: "動画生成を開始しました", jobId: job.id });
    } catch (error: any) {
      res.status(500).json({ message: error?.message || "動画生成の開始に失敗しました" });
    }
  });

  app.get("/api/admin/youtube/auto-publish-jobs", requireAdmin, async (_req, res) => {
    try {
      const jobs = await storage.getYoutubeAutoPublishJobs(50);
      res.json(jobs);
    } catch (error) {
      res.status(500).json({ message: "ジョブの取得に失敗しました" });
    }
  });

  // Admin: Email Campaigns
  app.get("/api/admin/email-campaigns", requireAdmin, async (_req, res) => {
    try {
      const campaigns = await storage.getEmailCampaigns();
      res.json(campaigns);
    } catch (error) {
      res.status(500).json({ message: "キャンペーンの取得に失敗しました" });
    }
  });

  app.get("/api/admin/email-campaigns/:id", requireAdmin, async (req, res) => {
    try {
      const campaign = await storage.getEmailCampaign(routeParam(req, "id"));
      if (!campaign) return res.status(404).json({ message: "キャンペーンが見つかりません" });
      res.json(campaign);
    } catch (error) {
      res.status(500).json({ message: "キャンペーンの取得に失敗しました" });
    }
  });

  app.post("/api/admin/email-campaigns", requireAdmin, async (req, res) => {
    try {
      const { name, subject, body, recipients, totalCount } = req.body;
      if (!name || !subject || !body || !recipients) {
        return res.status(400).json({ message: "必須項目を入力してください" });
      }
      const recipientList = recipients.split("\n").map((e: string) => e.trim()).filter((e: string) => e && e.includes("@"));
      const campaign = await storage.createEmailCampaign({
        name,
        subject,
        body,
        recipients,
        totalCount: totalCount || recipientList.length,
        status: "draft",
      });
      res.json(campaign);
    } catch (error) {
      res.status(500).json({ message: "キャンペーンの作成に失敗しました" });
    }
  });

  app.patch("/api/admin/email-campaigns/:id", requireAdmin, async (req, res) => {
    try {
      const campaign = await storage.updateEmailCampaign(routeParam(req, "id"), req.body);
      if (!campaign) return res.status(404).json({ message: "キャンペーンが見つかりません" });
      res.json(campaign);
    } catch (error) {
      res.status(500).json({ message: "キャンペーンの更新に失敗しました" });
    }
  });

  app.delete("/api/admin/email-campaigns/:id", requireAdmin, async (req, res) => {
    try {
      await storage.deleteEmailCampaign(routeParam(req, "id"));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "キャンペーンの削除に失敗しました" });
    }
  });

  app.post("/api/admin/email-campaigns/:id/send", requireAdmin, async (req, res) => {
    try {
      const campaign = await storage.getEmailCampaign(routeParam(req, "id"));
      if (!campaign) return res.status(404).json({ message: "キャンペーンが見つかりません" });
      if (campaign.status === "sending") return res.status(400).json({ message: "送信中です" });

      const recipientList = campaign.recipients.split("\n").map(e => e.trim()).filter(e => e && e.includes("@"));
      if (recipientList.length === 0) return res.status(400).json({ message: "送信先がありません" });

      await storage.updateEmailCampaign(campaign.id, {
        status: "sending",
        totalCount: recipientList.length,
        sentCount: 0,
        failedCount: 0,
        sentAt: new Date(),
      });

      res.json({ message: `${recipientList.length}件のメール送信を開始しました` });

      (async () => {
        let sentCount = 0;
        let failedCount = 0;
        for (const email of recipientList) {
          try {
            const result = await sendEmail(email, campaign.subject, campaign.body);
            if (result.success) {
              sentCount++;
            } else {
              failedCount++;
              console.error(`Email failed to ${email}: ${result.error}`);
            }
          } catch (err) {
            failedCount++;
            console.error(`Email error to ${email}:`, err);
          }
          await storage.updateEmailCampaign(campaign.id, { sentCount, failedCount });
          await new Promise(r => setTimeout(r, 500));
        }
        await storage.updateEmailCampaign(campaign.id, {
          status: failedCount === recipientList.length ? "failed" : "completed",
          sentCount,
          failedCount,
        });
      })();
    } catch (error) {
      res.status(500).json({ message: "送信の開始に失敗しました" });
    }
  });

  // Admin: Email Leads
  app.get("/api/admin/email-leads", requireAdmin, async (req, res) => {
    try {
      const status = req.query.status as string | undefined;
      const limit = parseInt(req.query.limit as string) || 100;
      const offset = parseInt(req.query.offset as string) || 0;
      const leads = await storage.getEmailLeads(status || undefined, limit, offset);
      const total = await storage.getEmailLeadCount(status || undefined);
      const todaySent = await storage.getTodaySentLeadCount();
      const newCount = await storage.getEmailLeadCount("new");
      const sentCount = await storage.getEmailLeadCount("sent");
      const failedCount = await storage.getEmailLeadCount("failed");
      res.json({ leads, total, todaySent, newCount, sentCount, failedCount });
    } catch (error) {
      res.status(500).json({ message: "リードの取得に失敗しました" });
    }
  });

  app.delete("/api/admin/email-leads/:id", requireAdmin, async (req, res) => {
    try {
      await storage.deleteEmailLead(routeParam(req, "id"));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "リードの削除に失敗しました" });
    }
  });

  app.post("/api/admin/email-leads/crawl", requireAdmin, async (req, res) => {
    try {
      const count = req.body?.count ? parseInt(req.body.count) : undefined;
      const { crawlLeadsWithAI } = await import("./lead-crawler");
      res.json({ message: "クロールを開始しました。バックグラウンドで実行中です。" });
      crawlLeadsWithAI(count).catch(err => console.error("[Lead Crawler] Manual crawl failed:", err));
    } catch (error: any) {
      console.error("[Lead Crawler] Crawl endpoint error:", error?.message || error, error?.stack);
      res.status(500).json({ message: "クロールの開始に失敗しました: " + (error?.message || "不明なエラー") });
    }
  });

  app.post("/api/admin/email-leads/crawl-url", requireAdmin, async (req, res) => {
    try {
      const { url } = req.body;
      if (!url) return res.status(400).json({ message: "URLを入力してください" });
      const { crawlLeadsFromUrl } = await import("./lead-crawler");
      const found = await crawlLeadsFromUrl(url);
      res.json({ message: `${found}件のリードを取得しました`, found });
    } catch (error) {
      res.status(500).json({ message: "URLクロールに失敗しました" });
    }
  });

  app.post("/api/admin/email-leads/send-now", requireAdmin, async (req, res) => {
    try {
      const { sendDailyLeadEmails } = await import("./lead-crawler");
      res.json({ message: "メール送信を開始しました。バックグラウンドで実行中です。" });
      sendDailyLeadEmails().catch(err => console.error("[Lead Email] Manual send failed:", err));
    } catch (error) {
      res.status(500).json({ message: "送信の開始に失敗しました" });
    }
  });

  app.post("/api/admin/email-leads/import", requireAdmin, async (req, res) => {
    try {
      const { leads } = req.body;
      if (!leads || !Array.isArray(leads) || leads.length === 0) {
        return res.status(400).json({ message: "インポートデータがありません" });
      }
      let added = 0;
      for (const lead of leads) {
        if (!lead.email || !lead.companyName) continue;
        const existing = await storage.getEmailLeadByEmail(lead.email);
        if (existing) continue;
        const created = await storage.createEmailLead({
          companyName: lead.companyName,
          email: lead.email,
          fax: lead.fax || null,
          phone: lead.phone || null,
          website: lead.website || null,
          address: lead.address || null,
          industry: lead.industry || "軽貨物配送",
          source: "manual_import",
          status: "new",
        });
        if (created) added++;
      }
      res.json({ message: `${added}件のリードをインポートしました`, added });
    } catch (error) {
      res.status(500).json({ message: "インポートに失敗しました" });
    }
  });

  app.patch("/api/admin/email-leads/settings", requireAdmin, async (req, res) => {
    try {
      const { subject, body } = req.body;
      if (subject) await storage.setAdminSetting("lead_email_subject", subject);
      if (body) await storage.setAdminSetting("lead_email_body", body);
      res.json({ message: "設定を保存しました" });
    } catch (error) {
      res.status(500).json({ message: "設定の保存に失敗しました" });
    }
  });

  app.get("/api/admin/email-leads/settings", requireAdmin, async (_req, res) => {
    try {
      const subject = await storage.getAdminSetting("lead_email_subject");
      const body = await storage.getAdminSetting("lead_email_body");
      res.json({ subject: subject || "", body: body || "" });
    } catch (error) {
      res.status(500).json({ message: "設定の取得に失敗しました" });
    }
  });

  app.post("/api/admin/email-campaigns/test-send", requireAdmin, async (req, res) => {
    try {
      const { to, subject, body } = req.body;
      if (!to || !subject || !body) return res.status(400).json({ message: "必須項目を入力してください" });
      const result = await sendEmail(to, subject, body);
      if (result.success) {
        res.json({ message: "テストメールを送信しました" });
      } else {
        res.status(500).json({ message: result.error || "送信に失敗しました" });
      }
    } catch (error) {
      res.status(500).json({ message: "テスト送信に失敗しました" });
    }
  });

  // Admin: SEO Articles
  app.get("/api/admin/seo-articles", requireAdmin, async (req, res) => {
    try {
      const articles = await storage.getSeoArticles();
      res.json(articles);
    } catch (error) {
      res.status(500).json({ message: "記事の取得に失敗しました" });
    }
  });

  function generateSlug(title: string): string {
    const base = title
      .toLowerCase()
      .replace(/[^\w\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF\s-]/g, "")
      .replace(/\s+/g, "-")
      .substring(0, 60);
    const dateStr = new Date().toISOString().slice(0, 10);
    const rand = Math.random().toString(36).substring(2, 6);
    return `${dateStr}-${rand}-${base || "article"}`;
  }

  app.post("/api/admin/seo-articles/generate", requireAdmin, async (req, res) => {
    try {
      const { topic, keywords, notes, autoPublish, category } = req.body;
      if (!topic) {
        return res.status(400).json({ message: "テーマは必須です" });
      }
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `あなたはSEOに強い軽貨物配送業界専門のコラムライターです。「KEI MATCH」という軽貨物案件マッチングプラットフォームのコラム記事を作成してください。

記事の要件：
1. SEOに最適化されたタイトル（# 見出し）- キーワードを含む
2. 読者を引き込む導入文（200文字程度）
3. 本文（## と ### の見出しで構造化、合計2000〜3000文字）
  - 具体的なデータや事例を含める
  - 読者にとって実用的な情報を提供
  - 自然にキーワードを含める（キーワード密度2-3%）
  - KEI MATCHのサービスを自然に紹介
4. まとめ・結論

重要な出力ルール：
- マークダウン形式で出力してください
- 見出しは ## や ### のマークダウン記法のみを使い、「H2:」「H3:」のようなプレフィックスは絶対に付けないでください
- HTMLタグは使わないでください（<h2>、<h3>、<p>などは不可）
- 正しい例: ## 軽貨物配送とは
- 間違った例: ## H2: 軽貨物配送とは

最後にJSON形式でメタ情報を出力してください：
---META---
{"metaDescription": "160文字以内のSEO用ディスクリプション", "faq": [{"question": "質問1", "answer": "回答1"}, {"question": "質問2", "answer": "回答2"}, {"question": "質問3", "answer": "回答3"}]}`
          },
          {
            role: "user",
            content: `テーマ: ${topic}\nキーワード: ${keywords || "なし"}\n備考: ${notes || "なし"}`
          }
        ],
        max_tokens: 4000,
      });
      const rawContent = completion.choices[0]?.message?.content || "";
      let content = rawContent;
      let metaDescription = "";
      let faq: string | null = null;
      const metaMatch = rawContent.match(/---META---\s*(\{[\s\S]*?\})/);
      if (metaMatch) {
        content = rawContent.replace(/---META---[\s\S]*$/, "").trim();
        try {
          const meta = JSON.parse(metaMatch[1]);
          metaDescription = meta.metaDescription || "";
          if (meta.faq && Array.isArray(meta.faq)) {
            faq = JSON.stringify(meta.faq);
          }
        } catch {}
      }
      const titleMatch = content.match(/^#\s+(.+)$/m);
      const title = titleMatch ? titleMatch[1] : topic;
      const slug = generateSlug(title);
      const wordCount = content.replace(/[#*\-\n\s]/g, "").length;

      const article = await storage.createSeoArticle({
        topic,
        keywords: keywords || null,
        title,
        slug,
        metaDescription: metaDescription || null,
        content,
        status: autoPublish ? "published" : "draft",
        autoGenerated: false,
        category: category || "kyukakyusha",
        wordCount,
        faq,
      });
      if (autoPublish) {
        pingGoogleSitemap();
      }
      res.json(article);
    } catch (error) {
      console.error("SEO article generation error:", error);
      res.status(500).json({ message: "記事の生成に失敗しました" });
    }
  });

  app.patch("/api/admin/seo-articles/:id", requireAdmin, async (req, res) => {
    const parsed = insertSeoArticleSchema.partial().strict().safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: fromError(parsed.error).toString() });
    }
    try {
      const updated = await storage.updateSeoArticle(routeParam(req, "id") as string, parsed.data);
      if (!updated) {
        return res.status(404).json({ message: "記事が見つかりません" });
      }
      if (parsed.data.status === "published") {
        pingGoogleSitemap();
      }
      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: "記事の更新に失敗しました" });
    }
  });

  app.delete("/api/admin/seo-articles/:id", requireAdmin, async (req, res) => {
    try {
      const deleted = await storage.deleteSeoArticle(routeParam(req, "id") as string);
      if (!deleted) {
        return res.status(404).json({ message: "記事が見つかりません" });
      }
      res.json({ message: "記事を削除しました" });
    } catch (error) {
      res.status(500).json({ message: "記事の削除に失敗しました" });
    }
  });

  const blogArticleSchema = z.object({
    title: z.string().trim().min(1).max(200),
    slug: z.string().trim().min(1).max(200).regex(/^[a-z0-9\u3040-\u30ff\u3400-\u9fff-]+$/i, "スラッグは英数字、日本語、ハイフンで入力してください"),
    category: z.string().trim().min(1).max(100),
    excerpt: z.string().trim().max(1000).nullable().optional(),
    content: z.string().trim().min(1).max(100000),
    imageUrl: z.string().trim().url().max(2000).nullable().optional(),
    status: z.enum(["draft", "published"]),
    publishedAt: z.coerce.date().nullable().optional(),
    seoTitle: z.string().trim().max(200).nullable().optional(),
    metaDescription: z.string().trim().max(300).nullable().optional(),
    canonicalUrl: z.string().trim().url().max(2000).nullable().optional(),
  }).strict();

  const normalizeBlogArticle = (data: z.infer<typeof blogArticleSchema>) => ({
    ...data,
    excerpt: data.excerpt || null,
    imageUrl: data.imageUrl || null,
    seoTitle: data.seoTitle || null,
    metaDescription: data.metaDescription || null,
    canonicalUrl: data.canonicalUrl || null,
    publishedAt: data.status === "published" ? (data.publishedAt || new Date()) : data.publishedAt || null,
    topic: data.title,
    keywords: null,
    autoGenerated: false,
    wordCount: data.content.replace(/\s/g, "").length,
    faq: null,
  });

  app.get("/api/admin/blog", requireAdmin, async (_req, res) => {
    try {
      res.json(await storage.getSeoArticles());
    } catch {
      res.status(500).json({ message: "ブログ記事の取得に失敗しました" });
    }
  });

  app.post("/api/admin/blog", requireAdmin, async (req, res) => {
    const parsed = blogArticleSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: fromError(parsed.error).toString() });
    try {
      const duplicate = await storage.getSeoArticleBySlug(parsed.data.slug);
      if (duplicate) return res.status(409).json({ message: "このスラッグは既に使用されています" });
      const article = await storage.createSeoArticle(normalizeBlogArticle(parsed.data));
      if (article.status === "published") pingGoogleSitemap();
      res.status(201).json(article);
    } catch {
      res.status(500).json({ message: "ブログ記事の作成に失敗しました" });
    }
  });

  app.patch("/api/admin/blog/:id", requireAdmin, async (req, res) => {
    const parsed = blogArticleSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: fromError(parsed.error).toString() });
    try {
      const duplicate = await storage.getSeoArticleBySlug(parsed.data.slug);
      if (duplicate && duplicate.id !== routeParam(req, "id")) return res.status(409).json({ message: "このスラッグは既に使用されています" });
      const article = await storage.updateSeoArticle(routeParam(req, "id"), normalizeBlogArticle(parsed.data));
      if (!article) return res.status(404).json({ message: "記事が見つかりません" });
      if (article.status === "published") pingGoogleSitemap();
      res.json(article);
    } catch {
      res.status(500).json({ message: "ブログ記事の更新に失敗しました" });
    }
  });

  app.delete("/api/admin/blog/:id", requireAdmin, async (req, res) => {
    try {
      if (!await storage.deleteSeoArticle(routeParam(req, "id"))) return res.status(404).json({ message: "記事が見つかりません" });
      pingGoogleSitemap();
      res.json({ message: "ブログ記事を削除しました" });
    } catch {
      res.status(500).json({ message: "ブログ記事の削除に失敗しました" });
    }
  });

  // Admin: Settings
  app.get("/api/admin/settings", requireAdmin, async (req, res) => {
    try {
      const settings = await storage.getAllAdminSettings();
      const settingsMap: Record<string, string> = {};
      for (const s of settings) {
        settingsMap[s.key] = s.value;
      }
      res.json(settingsMap);
    } catch (error) {
      res.status(500).json({ message: "設定の取得に失敗しました" });
    }
  });

  app.post("/api/admin/settings", requireAdmin, async (req, res) => {
    try {
      const entries = Object.entries(req.body) as [string, string][];
      for (const [key, value] of entries) {
        await storage.setAdminSetting(key, value);
      }
      res.json({ message: "設定を保存しました" });
    } catch (error) {
      res.status(500).json({ message: "設定の保存に失敗しました" });
    }
  });

  const prefectureToRomaji: Record<string, string> = {
    "北海道": "hokkaido", "青森": "aomori", "岩手": "iwate", "宮城": "miyagi",
    "秋田": "akita", "山形": "yamagata", "福島": "fukushima",
    "茨城": "ibaraki", "栃木": "tochigi", "群馬": "gunma", "埼玉": "saitama",
    "千葉": "chiba", "東京": "tokyo", "神奈川": "kanagawa",
    "新潟": "niigata", "富山": "toyama", "石川": "ishikawa", "福井": "fukui",
    "山梨": "yamanashi", "長野": "nagano", "岐阜": "gifu", "静岡": "shizuoka",
    "愛知": "aichi", "三重": "mie",
    "滋賀": "shiga", "京都": "kyoto", "大阪": "osaka", "兵庫": "hyogo",
    "奈良": "nara", "和歌山": "wakayama",
    "鳥取": "tottori", "島根": "shimane", "岡山": "okayama", "広島": "hiroshima",
    "山口": "yamaguchi",
    "徳島": "tokushima", "香川": "kagawa", "愛媛": "ehime", "高知": "kochi",
    "福岡": "fukuoka", "佐賀": "saga", "長崎": "nagasaki", "熊本": "kumamoto",
    "大分": "oita", "宮崎": "miyazaki", "鹿児島": "kagoshima", "沖縄": "okinawa",
  };

  function getPrefectureRomaji(prefecture: string): string {
    const short = prefecture.replace(/[都府県]$/, "");
    return prefectureToRomaji[short] || short;
  }

  app.get("/api/admin/agents/stats", requireAdmin, async (req, res) => {
    try {
      const stats = await storage.getAgentStats();
      res.json(stats);
    } catch (error) {
      console.error("Agent stats error:", error);
      res.status(500).json({ message: "エージェント統計の取得に失敗しました" });
    }
  });

  app.get("/api/admin/agents", requireAdmin, async (req, res) => {
    try {
      const allAgents = await storage.getAgents();
      res.json(allAgents);
    } catch (error) {
      res.status(500).json({ message: "代理店一覧の取得に失敗しました" });
    }
  });

  app.get("/api/admin/agents/:id", requireAdmin, async (req, res) => {
    try {
      const agent = await storage.getAgent(routeParam(req, "id"));
      if (!agent) return res.status(404).json({ message: "代理店が見つかりません" });
      res.json(agent);
    } catch (error) {
      res.status(500).json({ message: "代理店の取得に失敗しました" });
    }
  });

  app.post("/api/admin/agents", requireAdmin, async (req, res) => {
    try {
      const parsed = insertAgentSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "入力内容に誤りがあります", errors: parsed.error.errors });
      }

      const prefectureRomaji = getPrefectureRomaji(parsed.data.prefecture);
      const loginEmail = parsed.data.email || `agent-${prefectureRomaji}@keisaiyou-sinjapan.com`;
      const defaultPassword = `agent${Date.now().toString(36)}`;
      const hashedPassword = await bcrypt.hash(defaultPassword, 10);
      const username = `agent_${prefectureRomaji}_${Date.now()}`;

      const existingUser = await storage.getUserByEmail(loginEmail);
      let userId: string | undefined;
      let passwordToReturn: string | undefined;

      if (!existingUser) {
        const newUser = await storage.createUser({
          username,
          password: hashedPassword,
          companyName: parsed.data.companyName,
          contactName: parsed.data.contactName || "",
          phone: parsed.data.phone || "",
          email: loginEmail,
          userType: "carrier",
          role: "user",
          address: parsed.data.address || "",
        });
        await storage.approveUser(newUser.id);
        userId = newUser.id;
        passwordToReturn = defaultPassword;
      }

      const agent = await storage.createAgent({
        ...parsed.data,
        userId: userId || null,
        loginEmail: userId ? loginEmail : null,
      });

      await storage.createAuditLog({
        userId: (req as any).user?.id,
        userName: (req as any).user?.contactName || (req as any).user?.companyName,
        action: "create",
        targetType: "agent",
        targetId: agent.id,
        details: `代理店「${agent.companyName}」(${agent.prefecture})を登録${userId ? ` / アカウント作成 (${loginEmail})` : ""}`,
        ipAddress: req.ip,
      });
      res.status(201).json({ ...agent, generatedPassword: passwordToReturn });
    } catch (error: any) {
      console.error("Agent creation error:", error);
      res.status(500).json({ message: "代理店の登録に失敗しました" });
    }
  });

  app.patch("/api/admin/agents/:id", requireAdmin, async (req, res) => {
    try {
      const updateSchema = insertAgentSchema.partial();
      const parsed = updateSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "入力内容に誤りがあります", errors: parsed.error.errors });
      }
      const agent = await storage.updateAgent(routeParam(req, "id") as string, parsed.data);
      if (!agent) return res.status(404).json({ message: "代理店が見つかりません" });

      if (agent.userId) {
        const userUpdate: Record<string, any> = {};
        if (parsed.data.companyName !== undefined) userUpdate.companyName = parsed.data.companyName;
        if (parsed.data.contactName !== undefined) userUpdate.contactName = parsed.data.contactName;
        if (parsed.data.phone !== undefined) userUpdate.phone = parsed.data.phone;
        if (parsed.data.address !== undefined) userUpdate.address = parsed.data.address;
        if (Object.keys(userUpdate).length > 0) {
          await storage.updateUserProfile(agent.userId, userUpdate);
        }
      }

      await storage.createAuditLog({
        userId: (req as any).user?.id,
        userName: (req as any).user?.contactName || (req as any).user?.companyName,
        action: "update",
        targetType: "agent",
        targetId: agent.id,
        details: `代理店「${agent.companyName}」(${agent.prefecture})を更新`,
        ipAddress: req.ip,
      });
      res.json(agent);
    } catch (error) {
      res.status(500).json({ message: "代理店の更新に失敗しました" });
    }
  });

  app.delete("/api/admin/agents/:id", requireAdmin, async (req, res) => {
    try {
      const agent = await storage.getAgent(routeParam(req, "id"));
      if (!agent) return res.status(404).json({ message: "代理店が見つかりません" });
      await storage.deleteAgent(routeParam(req, "id") as string);
      await storage.createAuditLog({
        userId: (req as any).user?.id,
        userName: (req as any).user?.contactName || (req as any).user?.companyName,
        action: "delete",
        targetType: "agent",
        targetId: routeParam(req, "id") as string,
        details: `代理店「${agent.companyName}」(${agent.prefecture})を削除`,
        ipAddress: req.ip,
      });
      res.json({ message: "代理店を削除しました" });
    } catch (error) {
      res.status(500).json({ message: "代理店の削除に失敗しました" });
    }
  });

  app.post("/api/admin/agents/:id/create-account", requireAdmin, async (req, res) => {
    try {
      const agentId = routeParam(req, "id") as string;
      const agent = await storage.getAgent(agentId);
      if (!agent) return res.status(404).json({ message: "代理店が見つかりません" });
      if (agent.userId) return res.status(400).json({ message: "この代理店にはすでにアカウントがあります" });

      const prefectureRomaji = getPrefectureRomaji(agent.prefecture);
      const loginEmail = agent.email || `agent-${prefectureRomaji}@keisaiyou-sinjapan.com`;
      const defaultPassword = `agent${Date.now().toString(36)}`;
      const hashedPassword = await bcrypt.hash(defaultPassword, 10);
      const username = `agent_${prefectureRomaji}_${Date.now()}`;

      const existingUser = await storage.getUserByEmail(loginEmail);
      if (existingUser) {
        return res.status(400).json({ message: `メールアドレス「${loginEmail}」は既に使用されています。別のメールアドレスを設定してください。` });
      }

      const newUser = await storage.createUser({
        username,
        password: hashedPassword,
        companyName: agent.companyName,
        contactName: agent.contactName || "",
        phone: agent.phone || "",
        email: loginEmail,
        userType: "carrier",
        role: "user",
        address: agent.address || "",
      });
      await storage.approveUser(newUser.id);
      await storage.updateAgent(agent.id, { userId: newUser.id, loginEmail });
      await storage.createAuditLog({
        userId: (req as any).user?.id,
        userName: (req as any).user?.contactName || (req as any).user?.companyName,
        action: "create",
        targetType: "agent_account",
        targetId: agent.id,
        details: `代理店「${agent.companyName}」のログインアカウントを作成 (${loginEmail})`,
        ipAddress: req.ip,
      });
      res.json({ loginEmail, generatedPassword: defaultPassword });
    } catch (error: any) {
      console.error("Agent account creation error:", error);
      res.status(500).json({ message: "アカウント作成に失敗しました" });
    }
  });

  app.post("/api/admin/agents/:id/reset-password", requireAdmin, async (req, res) => {
    try {
      const agent = await storage.getAgent(routeParam(req, "id") as string);
      if (!agent) return res.status(404).json({ message: "代理店が見つかりません" });
      if (!agent.userId) return res.status(400).json({ message: "この代理店にはアカウントがありません" });

      const newPassword = `agent${Date.now().toString(36)}`;
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await storage.updateUserPassword(agent.userId, hashedPassword);
      await storage.createAuditLog({
        userId: (req as any).user?.id,
        userName: (req as any).user?.contactName || (req as any).user?.companyName,
        action: "update",
        targetType: "agent_account",
        targetId: agent.id,
        details: `代理店「${agent.companyName}」のパスワードをリセット`,
        ipAddress: req.ip,
      });
      res.json({ newPassword, loginEmail: agent.loginEmail });
    } catch (error) {
      res.status(500).json({ message: "パスワードリセットに失敗しました" });
    }
  });

  app.post("/api/admin/agents/bulk-create-accounts", requireAdmin, async (req, res) => {
    try {
      const allAgents = await storage.getAgents();
      const agentsWithoutAccount = allAgents.filter(a => !a.userId);
      const results: Array<{ prefecture: string; loginEmail: string; password: string }> = [];
      const skipped: string[] = [];

      for (const agent of agentsWithoutAccount) {
        const prefectureRomaji = getPrefectureRomaji(agent.prefecture);
        const loginEmail = agent.email || `agent-${prefectureRomaji}@keisaiyou-sinjapan.com`;
        const defaultPassword = `agent${Date.now().toString(36)}${Math.random().toString(36).slice(2, 4)}`;
        const hashedPassword = await bcrypt.hash(defaultPassword, 10);
        const username = `agent_${prefectureRomaji}_${Date.now()}`;

        const existingUser = await storage.getUserByEmail(loginEmail);
        if (existingUser) {
          skipped.push(`${agent.prefecture}: メール「${loginEmail}」が既に使用中`);
          continue;
        }

        const newUser = await storage.createUser({
          username,
          password: hashedPassword,
          companyName: agent.companyName,
          contactName: agent.contactName || "",
          phone: agent.phone || "",
          email: loginEmail,
          userType: "carrier",
          role: "user",
          address: agent.address || "",
        });
        await storage.approveUser(newUser.id);
        await storage.updateAgent(agent.id, { userId: newUser.id, loginEmail });
        results.push({ prefecture: agent.prefecture, loginEmail, password: defaultPassword });
      }

      await storage.createAuditLog({
        userId: (req as any).user?.id,
        userName: (req as any).user?.contactName || (req as any).user?.companyName,
        action: "create",
        targetType: "agent_account",
        targetId: "bulk",
        details: `代理店アカウント一括作成: ${results.length}件作成, ${skipped.length}件スキップ`,
        ipAddress: req.ip,
      });

      res.json({ created: results.length, skipped: skipped.length, results, skippedDetails: skipped });
    } catch (error: any) {
      console.error("Bulk account creation error:", error);
      res.status(500).json({ message: "一括アカウント作成に失敗しました" });
    }
  });

  // Square Payment - Process card payment
  const squarePaymentSchema = z.object({
    sourceId: z.string().min(1),
    planType: z.enum(["premium", "premium_full"]),
  });

  const PLAN_PRICES: Record<string, number> = {
    premium: 5500,
    premium_full: 5500,
  };

  app.post("/api/payments/square", requireAuth, async (req, res) => {
    try {
      const parsed = squarePaymentSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "決済情報が不正です", errors: parsed.error.errors });
      }

      const { sourceId, planType } = parsed.data;
      const amount = PLAN_PRICES[planType];
      const description = "β版プレミアムプラン月額料金";

      const accessToken = process.env.SQUARE_ACCESS_TOKEN;
      const locationId = process.env.SQUARE_LOCATION_ID;

      if (!accessToken || !locationId) {
        return res.status(500).json({ message: "Square決済の設定が完了していません" });
      }

      const { SquareClient, SquareEnvironment } = await import("square");
      const squareClient = new SquareClient({
        token: accessToken,
        environment: process.env.SQUARE_ENVIRONMENT === "production"
          ? SquareEnvironment.Production
          : SquareEnvironment.Sandbox,
      });

      const idempotencyKey = `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;

      const payment = await storage.createPayment({
        userId: req.session.userId!,
        amount,
        currency: "JPY",
        squarePaymentId: null,
        status: "pending",
        description,
      });

      const response = await squareClient.payments.create({
        sourceId,
        idempotencyKey,
        amountMoney: {
          amount: BigInt(amount),
          currency: "JPY",
        },
        locationId,
      });

      const squarePaymentId = response.payment?.id || null;
      const squareStatus = response.payment?.status;
      const finalStatus = squareStatus === "COMPLETED" ? "completed" : "failed";

      await storage.updatePaymentStatus(payment.id, finalStatus, squarePaymentId);

      res.json({
        success: finalStatus === "completed",
        paymentId: payment.id,
        status: finalStatus,
      });
    } catch (error: any) {
      console.error("Square payment error:", error);
      const { SquareError } = await import("square");
      if (error instanceof SquareError) {
        const errorCode = error.errors?.[0]?.code || "";
        const japaneseMessages: Record<string, string> = {
          "INSUFFICIENT_FUNDS": "カードの残高が不足しています。別のカードをお試しください。",
          "CARD_DECLINED": "カードが拒否されました。カード発行会社にお問い合わせください。",
          "INVALID_CARD": "カード情報が無効です。入力内容をご確認ください。",
          "CARD_EXPIRED": "カードの有効期限が切れています。",
          "CVV_FAILURE": "セキュリティコード（CVV）が正しくありません。",
          "INVALID_EXPIRATION": "有効期限が正しくありません。",
          "ADDRESS_VERIFICATION_FAILURE": "住所の確認に失敗しました。",
          "GENERIC_DECLINE": "カードが拒否されました。別のカードをお試しください。",
          "TEMPORARILY_UNAVAILABLE": "一時的にサービスが利用できません。しばらくしてから再度お試しください。",
        };
        const message = japaneseMessages[errorCode] || "カード決済に失敗しました。別のカードをお試しください。";
        return res.status(400).json({ message });
      }
      res.status(500).json({ message: "決済処理中にエラーが発生しました。しばらくしてから再度お試しください。" });
    }
  });

  // Get payment history
  app.get("/api/payments", requireAuth, async (req, res) => {
    try {
      const payments = await storage.getPaymentsByUser(req.session.userId!);
      res.json(payments);
    } catch (error) {
      res.status(500).json({ message: "決済履歴の取得に失敗しました" });
    }
  });

  // ===== Invoice Management (Admin) =====

  app.get("/api/admin/invoices", requireAdmin, async (_req, res) => {
    try {
      const allInvoices = await storage.getInvoices();
      res.json(allInvoices);
    } catch (error) {
      res.status(500).json({ message: "請求書一覧の取得に失敗しました" });
    }
  });

  app.get("/api/admin/invoices/:id", requireAdmin, async (req, res) => {
    try {
      const invoice = await storage.getInvoice(routeParam(req, "id") as string);
      if (!invoice) return res.status(404).json({ message: "請求書が見つかりません" });
      res.json(invoice);
    } catch (error) {
      res.status(500).json({ message: "請求書の取得に失敗しました" });
    }
  });

  app.post("/api/admin/invoices/generate", requireAdmin, async (req, res) => {
    try {
      const { userIds, billingMonth } = req.body;
      if (!billingMonth) return res.status(400).json({ message: "請求月を指定してください" });

      const allUsers = await storage.getAllUsers();
      const targetUsers = userIds && userIds.length > 0
        ? allUsers.filter((u: any) => userIds.includes(u.id))
        : allUsers.filter((u: any) => u.role !== "admin" && u.approved && (u.plan === "premium" || u.plan === "premium_full"));

      const generated: any[] = [];
      for (const user of targetUsers) {
        const accountAmount = user.plan === "premium_full" ? 5500 : 0;
        if (accountAmount === 0) continue;

        const addedUsers = allUsers.filter((u: any) => u.addedByUserId === user.id && u.approved);
        const addedUserCount = addedUsers.length;
        const addedUserAmount = addedUserCount * 2750;
        const totalAmount = accountAmount + addedUserAmount;
        const tax = totalAmount - Math.floor(totalAmount / 1.1);
        const baseAmount = totalAmount - tax;
        const invoiceNumber = await storage.getNextInvoiceNumber();

        const [year, month] = billingMonth.split("-");
        const dueMonth = parseInt(month) + 1;
        const dueYear = dueMonth > 12 ? parseInt(year) + 1 : parseInt(year);
        const dueMonthStr = dueMonth > 12 ? 1 : dueMonth;
        const dueDate = `${dueYear}-${String(dueMonthStr).toString().padStart(2, "0")}-末日`;

        let description = `KEI MATCH プレミアムプラン月額利用料（${billingMonth}）¥5,500（税込）`;
        if (addedUserCount > 0) {
          description += `\n追加ユーザー ${addedUserCount}名 × ¥2,750（税込） = ¥${addedUserAmount.toLocaleString()}`;
        }

        const invoice = await storage.createInvoice({
          invoiceNumber,
          userId: user.id,
          companyName: user.companyName,
          email: user.email,
          planType: user.plan,
          amount: baseAmount,
          tax,
          totalAmount,
          billingMonth,
          dueDate,
          description,
        });
        generated.push(invoice);
      }

      res.json({ message: `${generated.length}件の請求書を発行しました`, invoices: generated });
    } catch (error) {
      console.error("Invoice generation error:", error);
      res.status(500).json({ message: "請求書の発行に失敗しました" });
    }
  });

  app.post("/api/admin/invoices/:id/send", requireAdmin, async (req, res) => {
    try {
      const invoice = await storage.getInvoice(routeParam(req, "id") as string);
      if (!invoice) return res.status(404).json({ message: "請求書が見つかりません" });

      const admins = (await storage.getAllUsers()).filter(u => u.role === "admin");
      const adminInfo = admins.find(a => a.email === "info@keisaiyou-sinjapan.com") || admins.find(a => a.address && a.bankName) || admins[0] || null;
      const invoiceHtml = generateInvoiceEmailHtml(invoice, adminInfo);
      const invoiceResolved = await resolveEmailTemplate(
        "invoice_send",
        { companyName: invoice.companyName || "", invoiceNumber: invoice.invoiceNumber || "", billingMonth: invoice.billingMonth || "", totalAmount: invoice.totalAmount?.toLocaleString() || "0", dueDate: invoice.dueDate || "" },
        `【KEI MATCH】請求書 {{invoiceNumber}}（{{billingMonth}}）`,
        ""
      );
      const result = await sendEmail(
        invoice.email,
        invoiceResolved?.subject || `【KEI MATCH】請求書（${invoice.billingMonth}）`,
        invoiceHtml
      );

      if (result.success) {
        await storage.updateInvoiceSentAt(invoice.id, new Date());
        res.json({ message: "請求書をメールで送信しました" });
      } else {
        res.status(500).json({ message: `メール送信に失敗しました: ${result.error}` });
      }
    } catch (error) {
      console.error("Invoice send error:", error);
      res.status(500).json({ message: "請求書の送信に失敗しました" });
    }
  });

  app.post("/api/admin/invoices/bulk-send", requireAdmin, async (req, res) => {
    try {
      const { invoiceIds } = req.body;
      if (!invoiceIds || invoiceIds.length === 0) return res.status(400).json({ message: "請求書を選択してください" });

      const admins = (await storage.getAllUsers()).filter(u => u.role === "admin");
      const adminInfo = admins.find(a => a.email === "info@keisaiyou-sinjapan.com") || admins.find(a => a.address && a.bankName) || admins[0] || null;
      let sentCount = 0;
      let failCount = 0;
      for (const id of invoiceIds) {
        const invoice = await storage.getInvoice(id);
        if (!invoice) continue;

        const invoiceHtml = generateInvoiceEmailHtml(invoice, adminInfo);
        const bulkInvoiceResolved = await resolveEmailTemplate(
          "invoice_send",
          { companyName: invoice.companyName || "", invoiceNumber: invoice.invoiceNumber || "", billingMonth: invoice.billingMonth || "", totalAmount: invoice.totalAmount?.toLocaleString() || "0", dueDate: invoice.dueDate || "" },
          `【KEI MATCH】請求書 {{invoiceNumber}}（{{billingMonth}}）`,
          ""
        );
        const result = await sendEmail(
          invoice.email,
          bulkInvoiceResolved?.subject || `【KEI MATCH】請求書（${invoice.billingMonth}）`,
          invoiceHtml
        );

        if (result.success) {
          await storage.updateInvoiceSentAt(invoice.id, new Date());
          sentCount++;
        } else {
          failCount++;
        }
      }

      res.json({ message: `${sentCount}件送信成功、${failCount}件失敗` });
    } catch (error) {
      res.status(500).json({ message: "一括送信に失敗しました" });
    }
  });

  app.patch("/api/admin/invoices/:id/status", requireAdmin, async (req, res) => {
    try {
      const { status } = req.body;
      if (!["unpaid", "paid", "overdue", "cancelled"].includes(status)) {
        return res.status(400).json({ message: "無効なステータスです" });
      }
      const paidAt = status === "paid" ? new Date() : undefined;
      const invoice = await storage.updateInvoiceStatus(routeParam(req, "id") as string, status, paidAt);
      if (!invoice) return res.status(404).json({ message: "請求書が見つかりません" });
      res.json(invoice);
    } catch (error) {
      res.status(500).json({ message: "ステータスの更新に失敗しました" });
    }
  });

  app.delete("/api/admin/invoices/:id", requireAdmin, async (req, res) => {
    try {
      const deleted = await storage.deleteInvoice(routeParam(req, "id") as string);
      if (!deleted) return res.status(404).json({ message: "請求書が見つかりません" });
      res.json({ message: "請求書を削除しました" });
    } catch (error) {
      res.status(500).json({ message: "請求書の削除に失敗しました" });
    }
  });

  // Sitemap.xml - dynamic generation (KEI SAIYOU)
  app.get("/sitemap.xml", async (_req, res) => {
    const BASE = "https://keisaiyou-sinjapan.com";
    const now = new Date().toISOString().split("T")[0];

    const staticPages = [
      { loc: "/",                changefreq: "weekly",  priority: "1.0" },
      { loc: "/driver/jobs",     changefreq: "daily",   priority: "0.9" },
      { loc: "/driver-register", changefreq: "monthly", priority: "0.8" },
      { loc: "/guide",           changefreq: "monthly", priority: "0.8" },
      { loc: "/blog",            changefreq: "daily",   priority: "0.8" },
      { loc: "/faq",             changefreq: "monthly", priority: "0.8" },
      { loc: "/contact",         changefreq: "monthly", priority: "0.7" },
      { loc: "/company-info",    changefreq: "monthly", priority: "0.6" },
      { loc: "/terms",           changefreq: "yearly",  priority: "0.4" },
      { loc: "/privacy",         changefreq: "yearly",  priority: "0.4" },
    ];

    const escapeXml = (value: string) => value.replace(/[<>&'"]/g, char => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" }[char]!));
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    for (const page of staticPages) {
      xml += `  <url>\n    <loc>${escapeXml(`${BASE}${page.loc}`)}</loc>\n    <lastmod>${now}</lastmod>\n    <changefreq>${page.changefreq}</changefreq>\n    <priority>${page.priority}</priority>\n  </url>\n`;
    }

    try {
      const { db: dbConn } = await import("./db");
      const { jobListings: jl } = await import("@shared/schema") as any;
      const { eq: eqFn } = await import("drizzle-orm");
      const publishedJobs = await dbConn.select({ id: jl.id, updatedAt: jl.updatedAt })
        .from(jl).where(eqFn(jl.status, "active"));
      for (const job of publishedJobs) {
        const lastmod = job.updatedAt ? new Date(job.updatedAt).toISOString().split("T")[0] : now;
        xml += `  <url>\n    <loc>${escapeXml(`${BASE}/apply/${job.id}`)}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.9</priority>\n  </url>\n`;
      }
    } catch { /* ignore */ }
    try {
      const articles = await storage.getPublishedSeoArticles();
      for (const article of articles) {
        const lastmod = (article.publishedAt || article.createdAt) ? new Date(article.publishedAt || article.createdAt).toISOString().split("T")[0] : now;
        xml += `  <url>\n    <loc>${escapeXml(`${BASE}/blog/${encodeURIComponent(article.slug)}`)}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.7</priority>\n  </url>\n`;
      }
    } catch { /* sitemap remains available if article storage is unavailable */ }

    xml += `</urlset>`;
    res.set("Content-Type", "application/xml; charset=utf-8");
    res.set("Cache-Control", "public, max-age=3600");
    res.send(xml);
  });

  // Robots.txt (KEI SAIYOU)
  app.get("/robots.txt", (_req, res) => {
    const content = [
      "User-agent: *",
      "Allow: /",
      "Disallow: /admin",
      "Disallow: /admin/*",
      "Disallow: /home",
      "Disallow: /jobs",
      "Disallow: /applications",
      "Disallow: /settings",
      "Disallow: /payment",
      "Disallow: /api/",
      "",
      "Sitemap: https://keisaiyou-sinjapan.com/sitemap.xml",
    ].join("\n");
    res.set("Content-Type", "text/plain; charset=utf-8");
    res.send(content);
  });

  // Admin: SNS Management
  app.get("/api/admin/sns-posts", requireAdmin, async (_req, res) => {
    res.json([]);
  });

  app.post("/api/admin/sns-posts", requireAdmin, async (req, res) => {
    res.json({ id: crypto.randomUUID(), ...req.body, status: "draft", createdAt: new Date().toISOString() });
  });

  app.post("/api/admin/sns/generate", requireAdmin, async (req, res) => {
    try {
      const { platform, topic } = req.body;
      const openai = getOpenAI();
      const result = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: `あなたは軽貨物配送業界専門のSNSマーケターです。${platform}に最適化された日本語の投稿文を作成してください。ハッシュタグも含めてください。` },
          { role: "user", content: `トピック: ${topic}\n\n投稿文を1つ生成してください。` },
        ],
        max_tokens: 300,
      });
      res.json({ content: result.choices[0]?.message?.content || "" });
    } catch (error: any) {
      console.error("[SNS Gen] Error:", error?.message || error);
      res.status(500).json({ message: "生成に失敗しました: " + (error?.message || "不明なエラー") });
    }
  });

  // Admin: Media Generation
  app.post("/api/admin/media/generate-image", requireAdmin, async (req, res) => {
    try {
      const { prompt, style, size } = req.body;
      const openai = getOpenAI();
      const result = await openai.images.generate({
        model: "gpt-image-1",
        prompt: `${style ? style + " style: " : ""}${prompt}`,
        size: size || "1024x1024",
      });
      const imageData = result.data?.[0];
      const b64 = imageData?.b64_json;
      if (b64) {
        const dataUrl = `data:image/png;base64,${b64}`;
        res.json({ url: dataUrl });
      } else if (imageData?.url) {
        res.json({ url: imageData.url });
      } else {
        res.status(500).json({ message: "画像の生成結果がありません" });
      }
    } catch (error: any) {
      console.error("[Media Gen] Image generation error:", error?.message || error);
      res.status(500).json({ message: "画像生成に失敗しました: " + (error?.message || "不明なエラー") });
    }
  });

  app.post("/api/admin/media/generate-video", requireAdmin, async (req, res) => {
    try {
      const { topic, style } = req.body;
      const { processAutoPublishJob } = await import("./youtube-auto-publisher");
      const job = await storage.createYoutubeAutoPublishJob({ topic, status: "pending" });
      processAutoPublishJob(job.id).catch((err: any) =>
        console.error(`[Media Gen] Video job ${job.id} error:`, err?.message)
      );
      res.json({ message: "動画生成を開始しました", jobId: job.id });
    } catch (error) {
      res.status(500).json({ message: "動画生成に失敗しました" });
    }
  });

  // Admin: LP Generation
  app.post("/api/admin/lp/generate", requireAdmin, async (req, res) => {
    try {
      const { title, purpose, targetAudience, features, colorTheme } = req.body;
      const openai = getOpenAI();
      const result = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "あなたはプロのWebデザイナーです。完全なHTMLランディングページを生成してください。レスポンシブデザイン、モダンなスタイリングを含めてください。HTMLコードのみを返してください。" },
          { role: "user", content: `以下の条件でランディングページのHTMLを生成してください:\nタイトル: ${title}\n目的: ${purpose}\nターゲット: ${targetAudience}\nアピールポイント: ${features}\nカラーテーマ: ${colorTheme}\n\n完全なHTMLを返してください。` },
        ],
        max_tokens: 4000,
      });
      const html = (result.choices[0]?.message?.content || "").replace(/```html\n?/g, "").replace(/```\n?/g, "");
      res.json({ html });
    } catch (error: any) {
      console.error("[LP Gen] Error:", error?.message || error);
      res.status(500).json({ message: "LP生成に失敗しました: " + (error?.message || "不明なエラー") });
    }
  });

  // Admin: LP CRUD
  app.get("/api/admin/lp/list", requireAdmin, async (_req, res) => {
    try {
      const result = await db.select().from(landingPages).orderBy(sql`created_at DESC`);
      res.json(result);
    } catch (error: any) {
      console.error("[LP] List error:", error?.message || error);
      res.status(500).json({ message: "LP一覧の取得に失敗しました: " + (error?.message || "不明") });
    }
  });

  app.post("/api/admin/lp/save", requireAdmin, async (req, res) => {
    try {
      const { title, slug, html, published } = req.body || {};
      if (!title || !slug || !html) {
        return res.status(400).json({ message: "タイトル、スラッグ、HTMLは必須です" });
      }
      const safeSlug = slug.replace(/[^a-zA-Z0-9_-]/g, "-").toLowerCase();
      const existing = await db.select().from(landingPages).where(eq(landingPages.slug, safeSlug));
      if (existing.length > 0) {
        const updated = await db.update(landingPages).set({ title, html, published: published ?? false, updatedAt: new Date() }).where(eq(landingPages.slug, safeSlug)).returning();
        return res.json(updated[0]);
      }
      const inserted = await db.insert(landingPages).values({ title, slug: safeSlug, html, published: published ?? false }).returning();
      res.json(inserted[0]);
    } catch (error: any) {
      console.error("[LP] Save error:", error?.message || error);
      res.status(500).json({ message: "LP保存に失敗しました: " + (error?.message || "不明") });
    }
  });

  app.patch("/api/admin/lp/:id/publish", requireAdmin, async (req, res) => {
    try {
      const { published } = req.body;
      const lpId = routeParam(req, "id") as string;
      const updated = await db.update(landingPages).set({ published, updatedAt: new Date() }).where(eq(landingPages.id, lpId)).returning();
      if (updated.length === 0) return res.status(404).json({ message: "LPが見つかりません" });
      res.json(updated[0]);
    } catch (error) {
      res.status(500).json({ message: "公開状態の更新に失敗しました" });
    }
  });

  app.delete("/api/admin/lp/:id", requireAdmin, async (req, res) => {
    try {
      await db.delete(landingPages).where(eq(landingPages.id, routeParam(req, "id") as string));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "LP削除に失敗しました" });
    }
  });

  // Public: serve published LP by slug
  app.get("/lp/:slug", async (req, res) => {
    try {
      const result = await db.select().from(landingPages).where(eq(landingPages.slug, routeParam(req, "slug") as string));
      if (result.length === 0 || !result[0].published) {
        return res.status(404).send("<html><body><h1>ページが見つかりません</h1></body></html>");
      }
      res.type("html").send(result[0].html);
    } catch (error) {
      res.status(500).send("<html><body><h1>エラーが発生しました</h1></body></html>");
    }
  });

  return httpServer;
}
