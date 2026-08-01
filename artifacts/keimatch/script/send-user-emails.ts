/**
 * 登録ユーザー一括メール送信スクリプト
 * 実行: npx tsx script/send-user-emails.ts
 */
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { ne, and, isNotNull, sql } from "drizzle-orm";
import { users, adminSettings } from "../shared/schema";
import { sendEmail } from "../server/notification-service";

const pool = new Pool({ connectionString: process.env.KEIMATCH_DATABASE_URL || process.env.DATABASE_URL });
const db = drizzle(pool);

const SEND_INTERVAL_MS = 1200;

async function getAdminSetting(key: string): Promise<string | undefined> {
  const [row] = await db.select().from(adminSettings).where(sql`${adminSettings.key} = ${key}`);
  return row?.value;
}

async function main() {
  // 管理画面「初回営業」テンプレート（画像付き）
  const subject = "軽貨物ドライバーの採用コスト、下げませんか？";
  const bodyTemplate = `{{companyName}} ご担当者様

はじめまして。軽貨物ドライバー採用プラットフォーム「KEI SAIYOU」と申します。

突然のご連絡、大変失礼いたします。

■ こんなお悩みはありませんか？

▶ ドライバーがなかなか集まらない
▶ 求人媒体の月額費用が高い
▶ 採用できなかった月も費用がかかる

■ KEI SAIYOUなら解決できます

KEI SAIYOUは「応募が来たときだけ課金」の完全成功報酬型サービスです。

▶ 初期費用０・月額固定費０
▶ 応募1件あたり ¥3,000（税別）のみ
▶ 1分で求人掲載スタート

まずは無料でご登録いただき、求人を掲載してみてください。
https://keisaiyou-sinjapan.com/register

ご不明な点がございましたら、お気軽にご返信ください。

━
KEI SAIYOU（合同会社SIN JAPAN）
info@keisaiyou-sinjapan.com`;

  // 管理者以外・メールあり のユーザー全員取得
  const targetUsers = await db.select({
    id: users.id,
    email: users.email,
    companyName: users.companyName,
  }).from(users).where(
    and(
      ne(users.role, "admin"),
      isNotNull(users.email),
      sql`${users.email} != ''`
    )
  );

  const OFFSET = parseInt(process.env.OFFSET || "0");
  const LIMIT  = parseInt(process.env.LIMIT  || "50");
  const targets = targetUsers.slice(OFFSET, OFFSET + LIMIT);

  console.log(`送信対象: ${targets.length}件 (全${targetUsers.length}件 offset=${OFFSET} limit=${LIMIT})`);
  console.log(`件名: ${subject}`);
  console.log("---");

  let sent = 0;
  let failed = 0;

  for (const user of targets) {
    if (!user.email) continue;
    const name = user.companyName || "ご担当者";
    const personalizedBody = bodyTemplate.replace(/\{\{companyName\}\}/g, name).replace(/\{companyName\}/g, name);
    // 画像付きHTMLメールを生成
    const htmlLines = personalizedBody.split("\n").map(line => {
      const e = line.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
      if (line.startsWith("■")) return `<p style="margin:14px 0 4px;font-size:13px;font-weight:700;color:#d05a2a;border-left:3px solid #d05a2a;padding-left:8px;">${e}</p>`;
      if (line.startsWith("▶")) return `<p style="margin:4px 0;font-size:13px;color:#1e293b;padding-left:6px;">${e}</p>`;
      if (line.startsWith("http")) return `<div style="margin:16px 0;text-align:center;"><a href="${line}" style="display:inline-block;background:#d05a2a;color:#fff;font-weight:bold;font-size:14px;padding:12px 32px;border-radius:6px;text-decoration:none;">無料で登録する →</a></div>`;
      if (line.trim() === "") return `<div style="height:6px;"></div>`;
      if (line.startsWith("━")) return `<hr style="border:none;border-top:1px solid #e2e8f0;margin:12px 0;" />`;
      return `<p style="margin:0 0 4px;font-size:14px;line-height:1.8;color:#334155;">${e}</p>`;
    }).join("");
    const htmlBody = `<!DOCTYPE html><html lang="ja"><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:'Hiragino Sans','Yu Gothic UI',Meiryo,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:24px 12px;">
  <tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
    <tr><td style="background:linear-gradient(135deg,#c04f24,#e8734a);border-radius:10px 10px 0 0;padding:24px 32px;">
      <p style="margin:0;font-size:17px;font-weight:700;color:#fff;">${subject}</p>
    </td></tr>
    <tr><td style="padding:0;"><img src="https://keisaiyou-sinjapan.com/promo-banner.jpg" alt="KEI SAIYOU" width="600" style="display:block;width:100%;height:auto;" /></td></tr>
    <tr><td style="background:#fff;padding:28px 32px;border-left:1px solid #e2e8f0;border-right:1px solid #e2e8f0;">${htmlLines}</td></tr>
    <tr><td style="background:#1e293b;border-radius:0 0 10px 10px;padding:16px 32px;">
      <p style="margin:0;font-size:13px;font-weight:700;color:#fff;">KEI SAIYOU</p>
      <p style="margin:2px 0 0;font-size:11px;color:rgba(255,255,255,0.5);">合同会社SIN JAPAN｜info@keisaiyou-sinjapan.com</p>
    </td></tr>
  </table></td></tr>
</table></body></html>`;
    try {
      const result = await sendEmail(user.email, subject, htmlBody);
      if (result.success) {
        sent++;
        console.log(`✅ ${sent}/${targetUsers.length} ${user.email} (${name})`);
      } else {
        failed++;
        console.log(`❌ FAIL ${user.email}: ${result.error}`);
      }
    } catch (err: any) {
      failed++;
      console.log(`❌ ERROR ${user.email}: ${err.message}`);
    }
    await new Promise(r => setTimeout(r, SEND_INTERVAL_MS));
  }

  console.log("---");
  console.log(`完了: 送信=${sent}, 失敗=${failed}`);
  await pool.end();
}

main().catch(e => { console.error(e); process.exit(1); });
