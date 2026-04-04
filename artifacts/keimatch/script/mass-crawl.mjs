/**
 * Mass Lead Crawler
 * 管理者APIを使って300社までクロールし続けるスクリプト
 * 優先順: 地方 → 関西 → 関東
 */

import pkg from "../node_modules/pg/lib/index.js";
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.NEON_DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 3,
});

const BASE_URL = "http://localhost:3000";
const ADMIN_EMAIL = "info@sinjapan.jp";
const ADMIN_PASS = "Kazuya8008";
const TARGET = 300;

// 優先順位: 地方 → 関西 → 関東
const PREFECTURES = [
  // 地方（優先1）
  "北海道","青森県","岩手県","宮城県","秋田県","山形県","福島県",
  "新潟県","富山県","石川県","福井県",
  "長野県","山梨県","静岡県","岐阜県","愛知県",
  "岡山県","広島県","鳥取県","島根県","山口県",
  "徳島県","香川県","愛媛県","高知県",
  "福岡県","佐賀県","長崎県","熊本県","大分県","宮崎県","鹿児島県","沖縄県",
  // 関西（優先2）
  "大阪府","兵庫県","京都府","奈良県","滋賀県","和歌山県","三重県",
  // 関東（優先3）
  "埼玉県","千葉県","茨城県","栃木県","群馬県","神奈川県","東京都",
];

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function getCount() {
  const r = await pool.query("SELECT COUNT(*) as c FROM email_leads");
  return parseInt(r.rows[0].c);
}

async function login() {
  const r = await fetch(`${BASE_URL}/api/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASS }),
  });
  const setCookie = r.headers.get("set-cookie") || "";
  const match = setCookie.match(/connect\.sid=([^;]+)/);
  if (!match) throw new Error("ログイン失敗: " + r.status);
  const cookie = `connect.sid=${match[1]}`;
  console.log("[Auth] ログイン成功");
  return cookie;
}

async function crawlPrefecture(cookie, prefecture) {
  try {
    const r = await fetch(`${BASE_URL}/api/admin/sales/crawl`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Cookie": cookie,
      },
      body: JSON.stringify({ prefecture, useAI: true, limit: 20 }),
      signal: AbortSignal.timeout(120000),
    });
    if (!r.ok) {
      if (r.status === 401) return { found: 0, relogin: true };
      return { found: 0 };
    }
    const data = await r.json();
    return { found: data.found || 0 };
  } catch (e) {
    console.log(`  [Error] ${prefecture}: ${e.message}`);
    return { found: 0 };
  }
}

async function main() {
  let count = await getCount();
  console.log(`\n[Mass Crawl] 開始: 現在${count}件 → 目標${TARGET}件`);
  console.log(`[Mass Crawl] 優先: 地方 → 関西 → 関東\n`);

  let cookie = await login();
  let round = 0;

  while (count < TARGET) {
    round++;
    console.log(`\n===== ラウンド ${round} | 現在: ${count}件 / 目標: ${TARGET}件 =====\n`);

    for (const pref of PREFECTURES) {
      count = await getCount();
      if (count >= TARGET) break;

      process.stdout.write(`[${pref}] クロール中... `);
      const result = await crawlPrefecture(cookie, pref);

      if (result.relogin) {
        console.log("再ログイン中...");
        try { cookie = await login(); } catch {}
        continue;
      }

      count = await getCount();
      console.log(`+${result.found}件追加 [合計: ${count}件]`);
      await sleep(2000);
    }

    count = await getCount();
    if (count < TARGET) {
      console.log(`\n全県一周完了。残り${TARGET - count}件。5秒後に再スタート...`);
      await sleep(5000);
    }
  }

  console.log(`\n🎉 目標達成！合計${count}件のリードを取得しました`);
  await pool.end();
  process.exit(0);
}

main().catch(async e => {
  console.error("[Fatal]", e.message);
  await pool.end().catch(() => {});
  process.exit(1);
});
