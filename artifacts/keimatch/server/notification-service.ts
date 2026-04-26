import nodemailer from "nodemailer";
import crypto from "crypto";

let transporter: nodemailer.Transporter | null = null;

function getEmailTransporter(): nodemailer.Transporter | null {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || "587");
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return null;
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    tls: { rejectUnauthorized: false },
  });

  return transporter;
}

function generateMessageId(): string {
  const rand = crypto.randomBytes(16).toString("hex");
  return `<${rand}@keisaiyou-sinjapan.com>`;
}

function wrapInEmailTemplate(subject: string, bodyText: string): string {
  const bodyHtml = bodyText
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" style="color:#d05a2a;text-decoration:underline;word-break:break-all;">$1</a>')
    .replace(/\n/g, "<br>");

  return buildBaseTemplate(subject, `
    <tr>
      <td style="padding:32px 24px 24px 24px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
          <tr>
            <td style="color:#18181b;font-size:15px;line-height:1.8;word-break:break-word;">
              ${bodyHtml}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `);
}

function buildBaseTemplate(subject: string, contentRows: string): string {
  return `<!DOCTYPE html>
<html lang="ja" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="format-detection" content="telephone=no,date=no,address=no,email=no">
<title>${subject}</title>
<!--[if mso]>
<noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
<![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:'Hiragino Sans','Hiragino Kaku Gothic ProN','Noto Sans JP','Yu Gothic',Meiryo,sans-serif;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">

<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#f4f4f5;">
<tr><td align="center" style="padding:32px 16px;">

<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:600px;">

  <!-- Header -->
  <tr>
    <td style="background:linear-gradient(135deg,#d05a2a 0%,#b84a1a 100%);padding:28px 32px;border-radius:8px 8px 0 0;text-align:center;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr>
          <td style="text-align:center;">
            <div style="color:#ffffff;font-size:22px;font-weight:800;letter-spacing:3px;font-family:'Hiragino Sans','Yu Gothic',sans-serif;">KEI SAIYOU</div>
            <div style="color:rgba(255,255,255,0.8);font-size:11px;letter-spacing:1px;margin-top:4px;">軽貨物ドライバー採用プラットフォーム</div>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- Body -->
  <tr>
    <td style="background-color:#ffffff;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
        ${contentRows}
      </table>
    </td>
  </tr>

  <!-- Footer -->
  <tr>
    <td style="background-color:#ffffff;padding:0 32px 32px 32px;border-radius:0 0 8px 8px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-top:1px solid #e4e4e7;">
        <tr>
          <td style="padding-top:20px;color:#a1a1aa;font-size:11px;line-height:1.7;text-align:center;">
            本メールはKEI SAIYOUから自動送信されています。<br>
            心当たりのない場合はお手数ですが本メールを破棄してください。<br><br>
            <strong style="color:#71717a;">合同会社SIN JAPAN</strong><br>
            <a href="https://keisaiyou-sinjapan.com" style="color:#d05a2a;text-decoration:none;">keisaiyou-sinjapan.com</a>
          </td>
        </tr>
      </table>
    </td>
  </tr>

</table>

</td></tr>
</table>
</body>
</html>`;
}

export interface AdminNotificationOptions {
  title: string;
  subtitle?: string;
  badge?: { text: string; color?: string };
  rows: { label: string; value: string }[];
  ctaText?: string;
  ctaUrl?: string;
  note?: string;
}

export function buildAdminNotificationHtml(subject: string, opts: AdminNotificationOptions): string {
  const badgeColor = opts.badge?.color || "#d05a2a";
  const badgeHtml = opts.badge ? `
    <tr>
      <td style="padding:0 32px 8px 32px;">
        <span style="display:inline-block;background-color:${badgeColor};color:#fff;font-size:11px;font-weight:700;padding:3px 10px;border-radius:20px;letter-spacing:0.5px;">${opts.badge.text}</span>
      </td>
    </tr>
  ` : "";

  const rowsHtml = opts.rows.map(row => `
    <tr>
      <td style="padding:8px 0;border-bottom:1px solid #f4f4f5;vertical-align:top;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
          <tr>
            <td width="120" style="color:#71717a;font-size:12px;padding-right:12px;vertical-align:top;white-space:nowrap;">${row.label}</td>
            <td style="color:#18181b;font-size:14px;font-weight:600;word-break:break-all;">${row.value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</td>
          </tr>
        </table>
      </td>
    </tr>
  `).join("");

  const ctaHtml = opts.ctaUrl ? `
    <tr>
      <td style="padding:24px 32px 0 32px;text-align:center;">
        <a href="${opts.ctaUrl}" style="display:inline-block;background-color:#d05a2a;color:#ffffff;font-size:14px;font-weight:700;padding:12px 32px;border-radius:6px;text-decoration:none;letter-spacing:0.5px;">${opts.ctaText || "管理画面で確認する"}</a>
      </td>
    </tr>
  ` : "";

  const noteHtml = opts.note ? `
    <tr>
      <td style="padding:16px 32px 0 32px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#fff7ed;border-left:3px solid #d05a2a;border-radius:0 4px 4px 0;">
          <tr>
            <td style="padding:10px 14px;color:#7c2d12;font-size:12px;line-height:1.6;">${opts.note}</td>
          </tr>
        </table>
      </td>
    </tr>
  ` : "";

  const contentRows = `
    <tr>
      <td style="padding:28px 32px 8px 32px;">
        <div style="color:#18181b;font-size:17px;font-weight:700;line-height:1.4;">${opts.title}</div>
        ${opts.subtitle ? `<div style="color:#71717a;font-size:13px;margin-top:4px;">${opts.subtitle}</div>` : ""}
      </td>
    </tr>
    ${badgeHtml}
    <tr>
      <td style="padding:16px 32px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
          ${rowsHtml}
        </table>
      </td>
    </tr>
    ${ctaHtml}
    ${noteHtml}
    <tr><td style="height:28px;"></td></tr>
  `;

  return buildBaseTemplate(subject, contentRows);
}

export async function sendEmail(
  to: string,
  subject: string,
  body: string,
): Promise<{ success: boolean; error?: string }> {
  const transport = getEmailTransporter();
  if (!transport) {
    return { success: false, error: "メール設定が未構成です" };
  }

  const fromName = "KEI SAIYOU";
  const fromAddress = process.env.SMTP_FROM || process.env.SMTP_USER || "info@keisaiyou-sinjapan.com";
  const from = `"${fromName}" <${fromAddress}>`;
  const replyTo = fromAddress;
  const isAlreadyHtml = /<\/?(?:div|table|tr|td|h[1-6]|p|br|a|span|img)\b/i.test(body);

  const plainText = isAlreadyHtml
    ? body.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/\s{2,}/g, " ").trim()
    : body;

  const htmlBody = isAlreadyHtml ? body : wrapInEmailTemplate(subject, body);

  try {
    await transport.sendMail({
      from,
      to,
      replyTo,
      subject,
      text: plainText,
      html: htmlBody,
      headers: {
        "X-Mailer": "KEI-SAIYOU-Mailer/1.0",
        "X-Entity-Ref-ID": generateMessageId(),
        "Precedence": "bulk",
        "Message-ID": generateMessageId(),
      },
    });
    return { success: true };
  } catch (err: any) {
    console.error("Email send error:", err);
    return { success: false, error: err.message };
  }
}

export async function sendAdminNotification(
  subject: string,
  opts: AdminNotificationOptions,
): Promise<{ success: boolean; error?: string }> {
  const html = buildAdminNotificationHtml(subject, opts);
  const plainText = opts.rows.map(r => `${r.label}：${r.value}`).join("\n");
  const fullPlain = `${opts.title}\n${"─".repeat(30)}\n${plainText}${opts.ctaUrl ? `\n\n管理画面：${opts.ctaUrl}` : ""}`;

  const transport = getEmailTransporter();
  if (!transport) {
    return { success: false, error: "メール設定が未構成です" };
  }

  const fromAddress = process.env.SMTP_FROM || process.env.SMTP_USER || "info@keisaiyou-sinjapan.com";
  const from = `"KEI SAIYOU" <${fromAddress}>`;

  try {
    await transport.sendMail({
      from,
      to: "info@sinjapan.jp",
      replyTo: fromAddress,
      subject,
      text: fullPlain,
      html,
      headers: {
        "X-Mailer": "KEI-SAIYOU-Mailer/1.0",
        "X-Entity-Ref-ID": generateMessageId(),
        "X-Priority": "1",
        "Importance": "High",
        "Message-ID": generateMessageId(),
      },
    });
    return { success: true };
  } catch (err: any) {
    console.error("Admin notification email error:", err);
    return { success: false, error: err.message };
  }
}

export async function sendLineMessage(
  lineUserId: string,
  message: string,
): Promise<{ success: boolean; error?: string }> {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!token) {
    return { success: false, error: "LINE設定が未構成です" };
  }

  try {
    const res = await fetch("https://api.line.me/v2/bot/message/push", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        to: lineUserId,
        messages: [{ type: "text", text: message }],
      }),
    });

    if (!res.ok) {
      const errorBody = await res.text();
      console.error("LINE API error:", res.status, errorBody);
      return { success: false, error: `LINE API error: ${res.status}` };
    }

    return { success: true };
  } catch (err: any) {
    console.error("LINE send error:", err);
    return { success: false, error: err.message };
  }
}

export function isEmailConfigured(): boolean {
  return !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

export function isLineConfigured(): boolean {
  return !!process.env.LINE_CHANNEL_ACCESS_TOKEN;
}

export function replaceTemplateVariables(
  template: string,
  variables: Record<string, string>,
): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`{{${key}}}`, "g"), value);
  }
  return result;
}
