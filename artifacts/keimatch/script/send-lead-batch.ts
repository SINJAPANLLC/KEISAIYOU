import { db } from "../server/db";
import { emailLeads } from "../shared/schema";
import { createUnsubscribeToken, sendEmail } from "../server/notification-service";
import { storage } from "../server/storage";
import { and, eq, isNotNull, ne } from "drizzle-orm";

const LIMIT = 30;
const SITE_URL = "https://keisaiyou-sinjapan.com";
const SUBJECT = "軽貨物ドライバーの採用コスト、下げませんか？";
const BODY_TEMPLATE = `{{companyName}} ご担当者様

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

function esc(value: string) { return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
function htmlFor(body: string) {
  const content = body.split("\n").map((line) => {
    const e = esc(line);
    if (line.startsWith("■")) return `<p style="margin:14px 0 4px;font-size:13px;font-weight:700;color:#d05a2a;border-left:3px solid #d05a2a;padding-left:8px;">${e}</p>`;
    if (line.startsWith("▶")) return `<p style="margin:4px 0;font-size:13px;color:#1e293b;padding-left:6px;">${e}</p>`;
    if (line.startsWith("http")) return `<div style="margin:16px 0;text-align:center;"><a href="${esc(line)}" style="display:inline-block;background:#d05a2a;color:#fff;font-weight:bold;font-size:14px;padding:12px 32px;border-radius:6px;text-decoration:none;">無料で登録する →</a></div>`;
    if (line.startsWith("━")) return `<hr style="border:none;border-top:1px solid #e2e8f0;margin:12px 0;" />`;
    if (!line.trim()) return `<div style="height:6px"></div>`;
    return `<p style="margin:0 0 4px;font-size:14px;line-height:1.8;color:#334155;">${e}</p>`;
  }).join("");
  return `<!doctype html><html lang="ja"><body style="margin:0;padding:24px 12px;background:#f4f4f5;font-family:Arial,'Yu Gothic',Meiryo,sans-serif"><table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center"><table width="600" style="max-width:600px;width:100%;background:#fff" cellpadding="0" cellspacing="0"><tr><td style="background:linear-gradient(135deg,#c04f24,#e8734a);padding:24px 32px"><p style="margin:0;color:#fff;font-size:17px;font-weight:700">${SUBJECT}</p></td></tr><tr><td><img src="https://keisaiyou-sinjapan.com/promo-banner.jpg" alt="KEI SAIYOU" width="600" style="display:block;width:100%;height:auto"></td></tr><tr><td style="padding:28px 32px;border-left:1px solid #e2e8f0;border-right:1px solid #e2e8f0">${content}</td></tr><tr><td style="background:#1e293b;padding:16px 32px"><p style="margin:0;color:#fff;font-size:13px;font-weight:700">KEI SAIYOU</p><p style="margin:2px 0;color:#aaa;font-size:11px">合同会社SIN JAPAN｜info@keisaiyou-sinjapan.com</p></td></tr></table></td></tr></table></body></html>`;
}

async function main() {
  const leads = await db.select().from(emailLeads).where(and(eq(emailLeads.status, "followed_up"), isNotNull(emailLeads.email), ne(emailLeads.email, ""))).orderBy(emailLeads.sentAt).limit(LIMIT);
  console.log(`送信対象: ${leads.length}件`);
  let sent = 0, failed = 0;
  for (const lead of leads) {
    if (await storage.isEmailSuppressed(lead.email!)) {
      await db.update(emailLeads).set({ status: "unsubscribed" }).where(eq(emailLeads.id, lead.id));
      console.log(`skipped (suppressed): ${lead.email}`);
      continue;
    }
    const body = BODY_TEMPLATE.replace(/\{\{companyName\}\}/g, lead.companyName);
    const token = createUnsubscribeToken(lead.id);
    const unsubscribeUrl = token ? `${SITE_URL}/api/email/unsubscribe?token=${encodeURIComponent(token)}` : undefined;
    const result = await sendEmail(lead.email!, SUBJECT, htmlFor(body), { unsubscribeUrl });
    if (result.success) {
      await db.update(emailLeads).set({ status: "sent", sentAt: new Date(), sentSubject: SUBJECT }).where(eq(emailLeads.id, lead.id));
      sent++; console.log(`sent ${sent}/${leads.length}: ${lead.email}`);
    } else { failed++; console.log(`failed: ${lead.email} - ${result.error}`); }
    await new Promise((resolve) => setTimeout(resolve, 1200));
  }
  console.log(`完了: sent=${sent}, failed=${failed}`);
  process.exit(failed ? 1 : 0);
}
main().catch((error) => { console.error(error); process.exit(1); });
