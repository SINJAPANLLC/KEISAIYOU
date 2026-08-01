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
  const subject = await getAdminSetting("lead_email_subject")
    || "軽貨物ドライバーの採用、うまくいっていますか？｜KEI SAIYOU";
  const bodyTemplate = await getAdminSetting("lead_email_body")
    || `{companyName}
ご担当者様

突然のご連絡、大変失礼いたします。
軽貨物ドライバー採用プラットフォーム「KEI SAIYOU」を運営しております、合同会社SIN JAPANと申します。

貴社のホームページを拝見し、軽貨物配送事業を展開されていることを知り、ドライバー採用のご支援ができればとご連絡差し上げました。

━━━━━━━━━━━━━━━━━━━━
■ こんなお悩みはありませんか？
━━━━━━━━━━━━━━━━━━━━
☑ ドライバーが集まらず、配送件数を増やせない
☑ 求人サイトの掲載費が高く、採用コストが重い
☑ Indeed・ハローワークだけでは応募数が足りない
☑ 応募があっても、条件の合う人が来ない

━━━━━━━━━━━━━━━━━━━━
■「KEI SAIYOU」でできること
━━━━━━━━━━━━━━━━━━━━
✅ 完全成果報酬型：採用コストを大幅削減
　→ 月額・掲載費0円。応募1件あたり3,300円（税込）のみ

✅ Indeed連携で即日から応募が来る
　→ 日本最大の求人サイトに掲載。黒ナンバー取得者にアプローチ

✅ 応募者情報を一元管理
　→ 氏名・電話番号・職歴・保有免許・履歴書をまとめて確認

✅ AIで求人票を自動作成
　→ エリア・給与を入力するだけで魅力的な文章を自動生成

━━━━━━━━━━━━━━━━━━━━
■ 今すぐ無料で求人掲載
━━━━━━━━━━━━━━━━━━━━
▼ 無料登録・詳細はこちら
https://keisaiyou-sinjapan.com/register

初期費用・月額費用は一切かかりません。
応募が来たときだけ、1件3,300円（税込）のみです。

━━━━━━━━━━━━━━━━━━━━

ご多忙のところ恐縮ですが、
貴社のドライバー採用活動にお役立ていただければ幸いです。

ご質問・ご不明な点がございましたら、
本メールへのご返信にてお気軽にお問い合わせください。

━━━━━━━━━━━━━━━━━━━━
KEI SAIYOU 運営事務局
合同会社SIN JAPAN
〒243-0303 神奈川県愛甲郡愛川町中津7287
TEL: 046-212-2325
URL: https://keisaiyou-sinjapan.com
━━━━━━━━━━━━━━━━━━━━

※本メールは貴社ホームページに掲載されている
　連絡先情報をもとにお送りしております。
※今後のメール配信を希望されない場合は、
　本メールへその旨ご返信いただければ、
　速やかに配信を停止いたします。`;

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

  // 残り分のみ送信（OFFSET指定）
  const OFFSET = parseInt(process.env.OFFSET || "0");
  const targets = targetUsers.slice(OFFSET);

  console.log(`送信対象: ${targets.length}件 (全${targetUsers.length}件 offset=${OFFSET})`);
  console.log(`件名: ${subject}`);
  console.log("---");

  let sent = 0;
  let failed = 0;

  for (const user of targets) {
    if (!user.email) continue;
    const name = user.companyName || "ご担当者";
    const body = bodyTemplate.replace(/\{companyName\}/g, name).replace(/\{company\}/g, name);
    try {
      const result = await sendEmail(user.email, subject, body);
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
