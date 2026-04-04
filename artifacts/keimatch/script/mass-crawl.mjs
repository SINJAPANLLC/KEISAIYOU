import pkg from "../node_modules/pg/lib/index.js";

const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.NEON_DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 3,
});

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// 優先順位: 1.地方 2.関西 3.関東
const PREFECTURES_ORDERED = [
  // ===== 地方（優先度1）=====
  "北海道","青森県","岩手県","宮城県","秋田県","山形県","福島県",
  "新潟県","富山県","石川県","福井県",
  "長野県","山梨県",
  "静岡県","岐阜県","愛知県",
  "岡山県","広島県","鳥取県","島根県","山口県",
  "徳島県","香川県","愛媛県","高知県",
  "福岡県","佐賀県","長崎県","熊本県","大分県","宮崎県","鹿児島県","沖縄県",
  // ===== 関西（優先度2）=====
  "大阪府","兵庫県","京都府","奈良県","滋賀県","和歌山県","三重県",
  // ===== 関東（優先度3）=====
  "埼玉県","千葉県","茨城県","栃木県","群馬県","神奈川県","東京都",
];

const TARGET = 300;

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), ms))
  ]);
}

async function getCurrentCount() {
  const res = await pool.query("SELECT COUNT(*) as cnt FROM email_leads");
  return parseInt(res.rows[0].cnt);
}

async function domainExists(domain) {
  const d = domain.replace(/^www\./, "");
  const res = await pool.query(
    "SELECT id FROM email_leads WHERE website LIKE $1 OR website LIKE $2 LIMIT 1",
    [`%${d}/%`, `%${d}`]
  );
  return res.rows.length > 0;
}

async function emailExists(email) {
  const res = await pool.query(
    "SELECT id FROM email_leads WHERE email = $1 LIMIT 1",
    [email.toLowerCase()]
  );
  return res.rows.length > 0;
}

async function saveLead({ companyName, email, website, prefecture }) {
  await pool.query(
    `INSERT INTO email_leads (company_name, email, website, prefecture, industry, source, status, created_at)
     VALUES ($1,$2,$3,$4,$5,$6,'new',NOW())
     ON CONFLICT DO NOTHING`,
    [companyName, email.toLowerCase(), website, prefecture, "軽貨物配送", website]
  );
}

async function generateUrls(prefecture) {
  const prompt = `${prefecture}で軽貨物配送・軽貨物運送を行っている中小企業の公式ウェブサイトURLを15個。条件:実際に軽貨物を運ぶ事業者のみ、行政書士/求人サイト/大手(ヤマト佐川等)除外。{"urls":["https://...",...]}のJSON形式のみ。`;
  try {
    const res = await withTimeout(
      fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: prompt }],
          response_format: { type: "json_object" },
          max_tokens: 600,
        }),
      }),
      25000
    );
    if (!res.ok) { console.log(`  [OpenAI] HTTP ${res.status}`); return []; }
    const data = await withTimeout(res.json(), 10000);
    const content = data.choices?.[0]?.message?.content || "{}";
    let parsed = {};
    try { parsed = JSON.parse(content); } catch { return []; }
    const urls = (parsed.urls || []).filter(u => typeof u === "string" && u.startsWith("http"));
    return urls.slice(0, 15);
  } catch (e) {
    console.log(`  [OpenAI Error] ${prefecture}: ${e.message}`);
    return [];
  }
}

function extractEmails(html) {
  const emailRe = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;
  const found = [...new Set((html.match(emailRe) || []).map(e => e.toLowerCase()))];
  return found.filter(e => {
    const ext = e.split("@")[1] || "";
    if (e.endsWith(".png") || e.endsWith(".jpg") || e.endsWith(".gif")) return false;
    if (ext.includes("example") || ext.includes("sentry") || e.includes("noreply")) return false;
    return true;
  });
}

function pickBestEmail(emails, domain) {
  const root = domain.replace(/^www\./, "").split(".").slice(-2).join(".");
  const domainEmails = emails.filter(e => (e.split("@")[1] || "").includes(root));
  const candidates = domainEmails.length > 0 ? domainEmails : emails;
  const priority = ["info@", "contact@", "mail@", "office@", "inquiry@"];
  for (const p of priority) {
    const f = candidates.find(e => e.startsWith(p) || e.includes("@" + p.replace("@", "")));
    if (f) return f;
  }
  const prefPrio = ["info", "contact", "mail", "office"];
  for (const p of prefPrio) {
    const f = candidates.find(e => e.split("@")[0] === p);
    if (f) return f;
  }
  return candidates[0] || null;
}

function extractCompanyName(html, url) {
  const og = html.match(/<meta[^>]+property="og:title"[^>]+content="([^"]+)"/i)?.[1];
  const title = html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1];
  const raw = (og || title || "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").trim();
  const name = raw.replace(/\s*[|｜\-–—\|\/]\s*.*/g, "").trim();
  if (name.length >= 2 && name.length <= 60) return name;
  try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return url; }
}

function isTransportCompany(html) {
  const text = html.toLowerCase();
  const exclude = ["行政書士法人","行政書士事務所","司法書士","税理士法人","税理士事務所",
    "登録代行","車庫証明","求人サイト","転職サイト","人材派遣","フランチャイズ本部",
    "ヤマト運輸","佐川急便","日本郵便","amazonロジスティクス"];
  for (const kw of exclude) {
    if (text.includes(kw.toLowerCase())) return false;
  }
  const strong = ["軽貨物","軽配送","軽運送","軽トラック","軽バン配送","ラストワンマイル","軽自動車配送"];
  for (const kw of strong) {
    if (text.includes(kw.toLowerCase())) return true;
  }
  const medium = ["配送","運送","物流","宅配","デリバリー","ドライバー","運輸"];
  return medium.filter(kw => text.includes(kw.toLowerCase())).length >= 3;
}

async function crawlUrl(url, prefecture) {
  try {
    const hostname = new URL(url).hostname;
    const domain = hostname.replace(/^www\./, "");
    if (await domainExists(domain)) return 0;

    const res = await withTimeout(
      fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml",
          "Accept-Language": "ja,en;q=0.9",
        },
      }),
      10000
    );
    if (!res.ok) return 0;
    const html = await withTimeout(res.text(), 8000);
    if (!isTransportCompany(html)) return 0;

    const emails = extractEmails(html);
    const bestEmail = pickBestEmail(emails, domain);
    if (!bestEmail) {
      // お問い合わせページも試す
      const contactUrls = [url.replace(/\/$/, "") + "/contact", url.replace(/\/$/, "") + "/inquiry"];
      for (const cu of contactUrls) {
        try {
          const cr = await withTimeout(fetch(cu, { headers: { "User-Agent": "Mozilla/5.0" } }), 6000);
          if (cr.ok) {
            const ch = await cr.text();
            const ce = extractEmails(ch);
            const ce2 = pickBestEmail(ce, domain);
            if (ce2) {
              if (await emailExists(ce2)) return 0;
              const companyName = extractCompanyName(html, url);
              await saveLead({ companyName, email: ce2, website: url, prefecture });
              return 1;
            }
          }
        } catch {}
      }
      return 0;
    }

    if (await emailExists(bestEmail)) return 0;
    const companyName = extractCompanyName(html, url);
    await saveLead({ companyName, email: bestEmail, website: url, prefecture });
    return 1;
  } catch (e) {
    return 0;
  }
}

async function main() {
  let currentCount = await getCurrentCount();
  console.log(`[Mass Crawl] 開始: 現在${currentCount}件 → 目標${TARGET}件`);
  console.log(`[Mass Crawl] 優先: 地方(33都道府県) → 関西(7) → 関東(7)\n`);

  let round = 0;
  while (currentCount < TARGET) {
    round++;
    console.log(`\n===== Round ${round} | 現在: ${currentCount}件 =====`);

    for (const pref of PREFECTURES_ORDERED) {
      currentCount = await getCurrentCount();
      if (currentCount >= TARGET) break;

      process.stdout.write(`[${pref}] `);
      const urls = await generateUrls(pref);
      process.stdout.write(`${urls.length}URLs → `);

      let added = 0;
      for (const url of urls) {
        currentCount = await getCurrentCount();
        if (currentCount >= TARGET) break;
        const r = await crawlUrl(url, pref);
        if (r > 0) {
          added++;
          currentCount++;
          process.stdout.write(`✅`);
        } else {
          process.stdout.write(`·`);
        }
        await sleep(600);
      }
      console.log(` +${added}件 [計${currentCount}件]`);
      await sleep(1500);
    }

    currentCount = await getCurrentCount();
    if (currentCount < TARGET) {
      console.log(`\n全県一周完了。残り${TARGET - currentCount}件。再スタート...`);
      await sleep(5000);
    }
  }

  console.log(`\n🎉 完了！合計${currentCount}件取得`);
  await pool.end();
  process.exit(0);
}

main().catch(e => {
  console.error("[Fatal]", e.message);
  pool.end().catch(() => {});
  process.exit(1);
});
