import { storage } from "./storage";
import { sendEmail } from "./notification-service";

const DAILY_SEND_LIMIT = 1000;
const SEND_INTERVAL_MS = 1200;
const CRAWL_BATCH_SIZE = 500;

const SEARCH_QUERIES = [
  "軽貨物 配送 会社概要 メール",
  "軽貨物 運送会社 お問い合わせ メールアドレス",
  "貨物軽自動車運送事業 会社 連絡先",
  "軽貨物 ドライバー 募集 会社概要",
  "軽貨物 チャーター便 株式会社",
  "軽貨物 配送 株式会社 info@",
  "軽貨物 宅配 業務委託 会社概要",
  "軽貨物 スポット便 配送 連絡先",
  "軽貨物 ラストマイル 配送 株式会社",
  "軽貨物 EC配送 株式会社 会社概要",
  "軽バン 配送 会社概要 連絡先",
  "軽貨物 配送パートナー 募集 会社概要",
  "軽貨物 冷蔵冷凍 配送 会社概要",
  "軽貨物 緊急配送 即日 株式会社",
  "軽貨物 配送代行 会社 メール",
  "軽貨物 企業配送 法人 会社概要",
  "軽貨物 ルート配送 株式会社 連絡先",
  "軽貨物 即日配送 会社概要 メール",
  "軽貨物 配送委託 パートナー 連絡先",
  "軽貨物 引越し 赤帽 連絡先",
  "バイク便 即日配送 会社 メール",
  "軽貨物 定期便 契約 会社概要",
  "軽貨物 夜間配送 会社 連絡先",
  "軽貨物 共同配送 会社概要 メール",
  "軽貨物 求人 ドライバー 会社概要",
  "軽貨物 運送 事業者 連絡先",
  "軽貨物 配送 業者 会社概要",
  "軽貨物 開業 サポート 会社 連絡先",
  "軽貨物 配送 委託 企業 メール",
  "軽貨物 傭車 募集 連絡先",
  "軽貨物 協力会社 募集 会社概要",
  "配送ドライバー 業務委託 軽貨物 会社概要",
  "家具配送 軽貨物 設置 会社概要",
  "家電配送 軽貨物 会社 連絡先",
  "引越し 単身 軽貨物 会社概要",
  "軽貨物 黒ナンバー 配送 会社 連絡先",
  "軽貨物 配送 地域密着 会社概要",
  "運送会社 軽貨物 info@ co.jp",
  "配送業者 軽貨物 会社概要 電話 メール",
  "軽貨物運送 株式会社 会社概要",
  "軽貨物 配送業者 一覧 連絡先",
  "赤帽 引越し 配送 連絡先 メール",
  "バイク便 会社 連絡先 メール",
  "即日配送 軽貨物 会社 お問い合わせ",
  "宅配代行 軽貨物 会社概要 連絡先",
  "ネット通販 配送 軽貨物 会社概要",
  "出前配送 軽貨物 会社 連絡先",
  "検体輸送 軽貨物 医療 会社概要",
  "花 配送 軽貨物 会社 連絡先",
  "軽貨物 個人事業 開業 配送 会社概要",
  "運送業 軽貨物 会社一覧 メール",
  "配送会社 軽貨物 問い合わせ先",
  "軽貨物 物流 会社 メールアドレス",
  // ── メールアドレス直接検索クエリ ──────────────────────────────
  "軽貨物 info@ 配送 会社",
  "軽貨物 mail@ 会社概要",
  "軽貨物 @co.jp 会社 配送",
  "軽貨物 運送 メールアドレス 問い合わせ 株式会社",
  "軽貨物 配送代行 info メール 会社概要",
  "軽貨物 急便 会社概要 連絡先 メール",
  "軽貨物ドライバー 業務委託 会社 メール",
  "軽貨物 荷物 配送 株式会社 連絡先 mail",
  "軽貨物 傭車 協力会社 メールアドレス",
  "軽貨物 委託 配送ドライバー 会社 mail",
  // ── 業種別追加クエリ ─────────────────────────────────────────
  "ネットスーパー 配送 軽貨物 会社 連絡先",
  "アマゾンフレックス 軽貨物 委託 会社 概要",
  "Oisix oisix 配送 軽貨物 業務委託 会社",
  "コープ 宅配 軽貨物 配送会社 連絡先",
  "医薬品 配送 軽貨物 会社 メール",
  "部品 配送 軽貨物 製造業 会社概要",
  "精密機器 配送 軽貨物 会社 連絡先",
  "新聞 チラシ 配送 軽貨物 会社概要",
  // ── ニッチ業種・新規クエリ（2026-03-21追加）─────────────────
  "軽貨物 医療機器 検体 配送 会社概要 連絡先",
  "軽貨物 食品 食材 配送 会社概要 メール",
  "軽貨物 雑誌 書籍 配送 会社 連絡先",
  "軽貨物 酒類 飲料 食材 配送 会社概要",
  "軽貨物 展示会 イベント 機材 配送 会社概要",
  "軽貨物 個人事業主 配送業者 info mail 連絡先",
  "貨物軽自動車運送事業 届出 会社概要 info",
  "軽貨物 農産物 産直 配送 会社 連絡先",
  "軽貨物 薬局 薬品 配送 会社概要 メール",
  "軽貨物 住宅設備 建材 配送 会社概要",
  "軽貨物 飲食店 食品 宅配 会社 連絡先",
  "軽貨物 引越し 小口 会社概要 info mail",
  "軽貨物 電子部品 精密機器 配送 会社概要",
  "軽貨物 廃棄物 回収 配送 会社概要 連絡先",
  "軽貨物 ゴルフ場 納品 配送 会社概要",
  "軽貨物 造花 フラワー 配送 会社 連絡先",
  "軽貨物 クリーニング 配送 回収 会社概要",
  "軽貨物 美容院 化粧品 配送 会社概要 メール",
  "軽貨物 オフィス 書類 宅配 会社概要 連絡先",
  "軽貨物 EC通販 委託 会社 info メール",
];

const EMAIL_REGEX = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;
const PHONE_REGEX = /(?:0\d{1,4}[-\s]?\d{1,4}[-\s]?\d{3,4})/g;
const FAX_REGEX = /(?:FAX|fax|Fax|ファクス|ファックス)[：:\s]*([0-9\-\s]+)/g;

const EXCLUDED_EMAIL_DOMAINS = [
  "example.com", "example.jp", "example.co.jp", "example.ne.jp",
  "test.com", "test.jp", "sample.jp", "sample.com", "sample.co.jp",
  "dummy.jp", "dummy.com", "hoge.jp",
  "gmail.com", "yahoo.co.jp", "hotmail.com",
  "outlook.com", "icloud.com", "googlemail.com", "yahoo.com",
  "keimatch-sinjapan.com", "sinjapan.jp",
  // ホームページ制作サービスのサンプルメール
  "yamadahp.jp", "jimdo.com", "jimdo.jp", "wix.com", "weebly.com",
  "webnode.jp", "strikingly.com", "site123.com", "square.site",
  "stores.jp", "base.shop", "shopify.com",
  // 大手キャリア（軽貨物プラットフォームの対象外）
  "seino.co.jp", "sagawa-exp.co.jp", "kuronekoyamato.co.jp",
  "yamato-hd.co.jp", "japanpost.jp", "nittsu.co.jp", "nittsu.jp",
  "fukutsu.co.jp", "tonami.co.jp", "fukuyama-trans-group.co.jp",
  // ビジネス情報・信用調査サービス
  "data-max.co.jp", "teikoku.com", "tdb.co.jp", "tsr-net.co.jp",
  // HP制作サービスサンプルメール
  "dream-hd.jp",
];

const EXCLUDED_LOCAL_PARTS = [
  "noreply", "no-reply", "mailer-daemon", "postmaster", "bounce",
  "taro", "hanako", "jiro", "yamada", "tanaka",
  "sample", "test", "dummy", "admin_test", "user123",
  "webmaster_test", "contact_test",
];

function isValidCompanyEmail(email: string): boolean {
  const [localPart, domain] = email.split("@");
  if (!domain || !localPart) return false;
  if (EXCLUDED_EMAIL_DOMAINS.includes(domain.toLowerCase())) return false;
  const local = localPart.toLowerCase();
  for (const excl of EXCLUDED_LOCAL_PARTS) {
    if (local === excl) return false;
  }
  return true;
}

const STRONG_TRANSPORT_KEYWORDS = [
  "貨物軽自動車運送事業", "軽貨物運送", "軽貨物配送",
  "軽貨物ドライバー", "軽貨物業務委託", "軽貨物チャーター",
  "ラストマイル配送", "EC配送", "宅配業務委託",
  "国土交通省届出", "運輸支局届出",
  "スポット便", "即日配送", "軽貨物案件",
];

const TRANSPORT_KEYWORDS = [
  "軽貨物", "配送", "宅配", "デリバリー", "ラストマイル",
  "logistics", "delivery", "cargo",
  "軽バン", "軽トラ", "軽ワゴン", "バイク便",
  "個人事業主", "業務委託", "フリーランス",
  "EC物流", "通販配送", "ネット通販",
  "冷蔵配送", "冷凍配送", "チルド配送",
  "スポット", "定期便", "ルート配送", "配車",
];

const NON_TRANSPORT_KEYWORDS = [
  "不動産", "マンション", "賃貸", "分譲", "戸建", "ホテル", "旅館",
  "レストラン", "カフェ", "美容", "エステ", "クリニック", "病院",
  "学校", "塾", "予備校", "保険", "証券", "銀行",
  "セミナー", "イベント", "展示会", "内覧", "見学",
  "弁護士", "税理士", "行政書士事務所", "司法書士",
  "プログラミング", "IT企業", "ソフトウェア開発",
  "飲食店", "居酒屋", "寿司", "ラーメン",
];

const PORTAL_DOMAINS = [
  "imitsu.jp", "baseconnect.in", "biz.ne.jp", "houjin.jp",
  "clearworks.co.jp", "job-gear.jp", "townwork.net",
  "navit-j.com", "mapion.co.jp", "ekiten.jp", "itp.ne.jp",
  "ashita-office.com", "freee.co.jp", "minkabu.jp",
];

function isPortalSite(url: string): boolean {
  try {
    const domain = new URL(url).hostname;
    return PORTAL_DOMAINS.some(d => domain.includes(d));
  } catch { return false; }
}

function getTextContent(html: string): string {
  return html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .substring(0, 8000);
}

const URL_TRANSPORT_KEYWORDS = [
  "transport", "logistics", "delivery", "cargo", "kamotsu",
  "unso", "haisou", "haiso", "takuhai", "exp", "express",
  "logi", "freight", "moving", "hikkoshi",
  "akabou", "unsou", "unyu", "trucking",
  "kyuhai", "kyubin", "haikon", "kyusou", "haisoo",
  "butsuryu", "butsury", "soko", "ryutsu",
  "driver", "drive", "truck", "carry", "courier",
];

function isTransportCompany(html: string, url: string): boolean {
  if (isPortalSite(url)) return false;

  const textContent = getTextContent(html);
  const lowerText = textContent.toLowerCase();
  const lowerUrl = url.toLowerCase();

  for (const kw of URL_TRANSPORT_KEYWORDS) {
    if (lowerUrl.includes(kw)) return true;
  }

  let strongScore = 0;
  for (const kw of STRONG_TRANSPORT_KEYWORDS) {
    if (lowerText.includes(kw.toLowerCase()) || lowerUrl.includes(kw.toLowerCase())) {
      strongScore++;
    }
  }
  if (strongScore >= 1) return true;

  let transportScore = 0;
  for (const kw of TRANSPORT_KEYWORDS) {
    if (lowerText.includes(kw.toLowerCase()) || lowerUrl.includes(kw.toLowerCase())) {
      transportScore++;
    }
  }

  let nonTransportScore = 0;
  for (const kw of NON_TRANSPORT_KEYWORDS) {
    if (lowerText.includes(kw.toLowerCase())) {
      nonTransportScore++;
    }
  }

  if (transportScore < 1) return false;
  if (nonTransportScore >= transportScore) return false;
  return true;
}

function detectIndustry(html: string): string {
  const text = getTextContent(html).toLowerCase();
  if (text.includes("軽貨物") && text.includes("配送")) return "軽貨物配送";
  if (text.includes("貨物軽自動車運送")) return "貨物軽自動車運送事業";
  if (text.includes("軽貨物")) return "軽貨物運送";
  if (text.includes("ラストマイル") || text.includes("宅配")) return "ラストマイル配送";
  if (text.includes("冷凍") || text.includes("冷蔵")) return "冷蔵冷凍配送";
  if (text.includes("ec") && text.includes("配送")) return "EC配送";
  if (text.includes("フードデリバリー") || text.includes("デリバリー")) return "フードデリバリー";
  if (text.includes("バイク便")) return "バイク便";
  if (text.includes("配送") || text.includes("運送")) return "軽貨物配送";
  return "配送関連";
}

async function fetchPageContent(url: string): Promise<string> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "ja,en;q=0.9",
      },
    });
    clearTimeout(timeout);
    if (!res.ok) return "";
    const text = await res.text();
    return text;
  } catch {
    return "";
  }
}

function extractContactInfo(html: string): { emails: string[]; phones: string[]; faxes: string[] } {
  // First extract mailto: links (before stripping tags)
  const mailtoEmails: string[] = [];
  const mailtoPattern = /href=["']mailto:([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})["']/gi;
  let mailtoMatch;
  while ((mailtoMatch = mailtoPattern.exec(html)) !== null) {
    if (isValidCompanyEmail(mailtoMatch[1])) mailtoEmails.push(mailtoMatch[1]);
  }

  const textContent = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/&#64;/g, "@").replace(/&amp;/g, "&").replace(/&#[0-9]+;/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ");

  // Detect obfuscated emails: info [at] company.co.jp / info(at)company.co.jp / info★company.co.jp
  const obfuscatedEmails: string[] = [];
  const obfuscatedPattern = /([a-zA-Z0-9._%+\-]+)\s*(?:\[at\]|\(at\)|（at）|＠|★|☆|〒|@)\s*([a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})/gi;
  let obMatch;
  while ((obMatch = obfuscatedPattern.exec(textContent)) !== null) {
    const candidate = `${obMatch[1]}@${obMatch[2]}`;
    if (isValidCompanyEmail(candidate)) obfuscatedEmails.push(candidate);
  }

  const emailSet = new Set([
    ...mailtoEmails,
    ...obfuscatedEmails,
    ...(textContent.match(EMAIL_REGEX) || []).filter(isValidCompanyEmail)
  ]);
  const emails = Array.from(emailSet);

  const phoneSet = new Set(textContent.match(PHONE_REGEX) || []);
  const phones = Array.from(phoneSet);

  const faxes: string[] = [];
  let faxMatch;
  const faxRegex = new RegExp(FAX_REGEX.source, "g");
  while ((faxMatch = faxRegex.exec(textContent)) !== null) {
    faxes.push(faxMatch[1].trim());
  }
  const faxSet = new Set(faxes);

  return { emails: emails.slice(0, 5), phones: phones.slice(0, 3), faxes: Array.from(faxSet).slice(0, 3) };
}

function extractInternalLinks(html: string, baseUrl: string): string[] {
  const links: string[] = [];
  try {
    const origin = new URL(baseUrl).origin;
    const hrefPattern = /href=["']([^"'#]+)["']/gi;
    let match;
    while ((match = hrefPattern.exec(html)) !== null) {
      let href = match[1];
      if (href.startsWith("/")) href = origin + href;
      if (href.startsWith(origin) && !href.includes("javascript:") && !href.endsWith(".pdf") && !href.endsWith(".jpg") && !href.endsWith(".png")) {
        if (!links.includes(href) && href !== baseUrl) links.push(href);
      }
    }
  } catch {}
  return links.slice(0, 10);
}

function extractCompanyName(html: string, url: string): string {
  const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
  if (titleMatch) {
    let title = titleMatch[1].replace(/\s*[|\-–—].*$/, "").trim();
    if (title && title.length > 2 && title.length < 50) return title;
  }
  const ogMatch = html.match(/<meta\s+property="og:site_name"\s+content="([^"]+)"/i);
  if (ogMatch) return ogMatch[1].trim();
  try { return new URL(url).hostname; } catch { return url; }
}

async function findEmailOnRelatedPages(baseUrl: string): Promise<{ emails: string[]; phones: string[]; faxes: string[] } | null> {
  try {
    const urlObj = new URL(baseUrl);
    const origin = urlObj.origin;
    const relatedPaths = [
      "/contact", "/contact/", "/contact.html", "/contact.php",
      "/inquiry", "/inquiry/", "/inquiry.html", "/inquiry.php",
      "/company", "/company/", "/company.html",
      "/about", "/about/", "/about.html", "/about-us/",
      "/info", "/info/", "/info.html",
      "/gaiyou", "/gaiyou/", "/gaiyou.html",
      "/toiawase", "/toiawase/", "/toiawase.html",
      "/overview", "/overview/", "/overview.html",
      "/corporate", "/corporate/", "/corporate.html",
      "/profile", "/profile/", "/profile.html",
      "/outline", "/outline/", "/outline.html",
      "/access", "/access/", "/access.html",
      "/mail", "/mail.html", "/mailform", "/mailform.html",
      "/kaisha", "/kaisha/", "/kaisha.html",
      "/company/profile", "/company/outline", "/company/index.html",
      "/about/company", "/about/index.html",
      "/contact/index.html", "/inquiry/index.html",
      "/kaisha-annai", "/kaisha-annai/", "/kaisha-annai.html",
      "/o-toiawase", "/o-toiawase/", "/otoiawase", "/otoiawase/",
      "/annai", "/annai/", "/annai.html",
      "/privacy", "/privacy.html",
      "/company/info", "/company/info.html",
      "/aboutus", "/aboutus/", "/aboutus.html",
      "/gaiyo", "/gaiyo/", "/gaiyo.html",
      "/message", "/message/",
      "/torihiki", "/torihiki/", "/torihiki.html",
      "/company/company", "/company/about",
    ];
    const pathPromises = relatedPaths.map(async (path) => {
      const relatedUrl = origin + path;
      if (relatedUrl === baseUrl) return null;
      const html = await fetchPageContent(relatedUrl);
      if (html && html.length > 500) {
        const info = extractContactInfo(html);
        if (info.emails.length > 0) {
          console.log(`[Lead Crawler] Found email on related page: ${relatedUrl}`);
          return info;
        }
      }
      return null;
    });
    const pathResults = await Promise.all(pathPromises);
    const foundResult = pathResults.find(r => r !== null);
    if (foundResult) return foundResult;

    const mainHtml = await fetchPageContent(baseUrl);
    if (mainHtml) {
      const internalLinks = extractInternalLinks(mainHtml, baseUrl);
      const contactLinks = internalLinks.filter(link => {
        const lower = link.toLowerCase();
        return lower.includes("contact") || lower.includes("company") || lower.includes("about")
          || lower.includes("inquiry") || lower.includes("toiawase") || lower.includes("mail")
          || lower.includes("info") || lower.includes("gaiyou") || lower.includes("ask");
      });
      for (const link of contactLinks.slice(0, 5)) {
        const html = await fetchPageContent(link);
        if (html && html.length > 500) {
          const info = extractContactInfo(html);
          if (info.emails.length > 0) {
            console.log(`[Lead Crawler] Found email via internal link: ${link}`);
            return info;
          }
        }
        await new Promise(r => setTimeout(r, 300));
      }
    }

    return null;
  } catch {
    return null;
  }
}

// アグリゲーターページ（複数企業リスト）のドメイン — ドメイン重複チェックをスキップ
const AGGREGATOR_PAGE_DOMAINS = [
  "web-transport.co.jp",
  "transport-company.jp",
];

function isAggregatorPage(url: string): boolean {
  try {
    const domain = new URL(url).hostname.replace(/^www\./, "");
    return AGGREGATOR_PAGE_DOMAINS.some(d => domain === d || domain.endsWith("." + d));
  } catch { return false; }
}

export async function crawlLeadsFromUrl(url: string): Promise<number> {
  console.log(`[Lead Crawler] Crawling: ${url}`);
  const html = await fetchPageContent(url);
  if (!html) return 0;

  if (!isTransportCompany(html, url)) {
    console.log(`[Lead Crawler] Skipped (not transport): ${url}`);
    return 0;
  }

  let { emails, phones, faxes } = extractContactInfo(html);
  const companyName = extractCompanyName(html, url);
  const aggregator = isAggregatorPage(url);

  if (!aggregator) {
    try {
      const rawDomain = new URL(url).hostname;
      const domain = rawDomain.replace(/^www\./, "");
      const existingByDomain = await storage.getEmailLeadByDomain(domain);
      if (existingByDomain) {
        console.log(`[Lead Crawler] Skipped (domain already exists): ${domain}`);
        return 0;
      }
      const existingByWww = await storage.getEmailLeadByDomain("www." + domain);
      if (existingByWww) {
        console.log(`[Lead Crawler] Skipped (domain already exists): www.${domain}`);
        return 0;
      }
    } catch {}
  }

  if (emails.length === 0) {
    const relatedInfo = await findEmailOnRelatedPages(url);
    if (relatedInfo) {
      emails = relatedInfo.emails;
      if (relatedInfo.phones.length > 0) phones = relatedInfo.phones;
      if (relatedInfo.faxes.length > 0) faxes = relatedInfo.faxes;
    }
    if (emails.length === 0) return 0;
  }

  // アグリゲーターページ以外は、URLドメインと一致するメールを優先
  if (!aggregator) {
    try {
      const urlHostname = new URL(url).hostname.replace(/^www\./, "");
      // Extract root domain (e.g. "akabou.jp" from "shizuoka.akabou.jp")
      const urlParts = urlHostname.split(".");
      const rootDomain = urlParts.slice(-2).join(".");
      const matchingEmails = emails.filter(e => {
        const emailDomain = e.split("@")[1]?.toLowerCase() || "";
        return emailDomain === urlHostname || emailDomain === rootDomain || emailDomain.endsWith("." + rootDomain);
      });
      if (matchingEmails.length > 0) {
        emails = matchingEmails;
      }
      // If no domain-matching email found, keep all emails (might be valid business email on different domain)
    } catch {}
  }

  let added = 0;

  const crawledDomain = (() => { try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return ""; } })();

  for (const email of emails) {
    const existing = await storage.getEmailLeadByEmail(email);
    // Allow same email if the domain is different (e.g., regional offices of same company)
    if (existing) {
      const existingDomain = (() => {
        try {
          const w = existing.website || "";
          return new URL(w.startsWith("http") ? w : "https://" + w).hostname.replace(/^www\./, "");
        } catch { return ""; }
      })();
      if (existingDomain === crawledDomain || !crawledDomain) continue;
    }

    try {
      const industry = detectIndustry(html);
      await storage.createEmailLead({
        companyName,
        email,
        fax: faxes[0] || null,
        phone: phones[0] || null,
        website: url,
        address: null,
        industry,
        source: url,
        status: "new",
      });
      added++;
    } catch (err) {
      console.error(`[Lead Crawler] Failed to save lead ${email}:`, err);
    }
  }

  return added;
}

const DIRECTORY_SOURCES = [
  // 業界団体・協会
  "https://www.jta.or.jp/member/",
  "https://www.zenkaren.net/",
  "https://www.kta.or.jp/member/",
  // ポータル・ナビ
  "https://www.haisou.jp/",
  "https://www.keikamotsu-navi.com/",
  "https://kkamotsu-navi.co.jp/",
  "https://cargo-navi.jp/",
  "https://logistar.jp/",
  "https://transport-guide.jp/company/",
  "https://lnews.jp/logistics-company/",
  // ドライバー・求人系（会社リンクあり）
  "https://driver-job.jp/",
  "https://www.driver-career.com/",
  "https://www.driver-navi.com/",
  "https://www.cargo-work.jp/",
  "https://www.logistics-job.jp/",
  // プラットフォーム・マッチング系
  "https://www.hacobell.com/",
  "https://pickup.jp/",
  "https://logilink.jp/",
  "https://www.inaho.co.jp/",
  // 業界メディア・ニュース
  "https://www.cargo-times.jp/",
  "https://www.lnews.jp/",
  "https://www.logistics-trend.jp/",
  // 赤帽（トップページのみ - 個別県ページは外部リンクなし）
  // "https://www.akabou.jp/",  // 52の県ページを無駄に生成するため除外
  // その他
  "https://www.keikamotsu.com/",
  "https://www.f-logi.co.jp/",
  "https://www.quodeli.co.jp/",
  // 全国運送会社データベース（transport-company.jp）
  "https://transport-company.jp/information/hokkaido/sapporo/",
  "https://transport-company.jp/information/aomori/aomori/",
  "https://transport-company.jp/information/miyagi/sendai/",
  "https://transport-company.jp/information/akita/akita/",
  "https://transport-company.jp/information/fukushima/fukushima/",
  "https://transport-company.jp/information/ibaraki/mito/",
  "https://transport-company.jp/information/tochigi/utsunomiya/",
  "https://transport-company.jp/information/saitama/saitama/",
  "https://transport-company.jp/information/chiba/chiba/",
  "https://transport-company.jp/information/tokyo/tokyo/",
  "https://transport-company.jp/information/kanagawa/yokohama/",
  "https://transport-company.jp/information/niigata/niigata/",
  "https://transport-company.jp/information/nagano/nagano/",
  "https://transport-company.jp/information/aichi/nagoya/",
  "https://transport-company.jp/information/osaka/osaka/",
  "https://transport-company.jp/information/hyogo/kobe/",
  "https://transport-company.jp/information/hiroshima/hiroshima/",
  "https://transport-company.jp/information/fukuoka/fukuoka/",
  // 地域トラック協会（会員リスト）
  "https://www.hokkaido-ta.or.jp/kaiin/",
  "https://www.aomori-ta.or.jp/kaiin/",
  "https://www.iwate-ta.or.jp/member/",
  "https://www.miyagi-ta.or.jp/members/",
  "https://www.akita-ta.or.jp/kaiin/",
  "https://www.yamagata-ta.or.jp/kaiin/",
  "https://www.fukushima-ta.or.jp/member/",
  "https://www.ibaraki-ta.or.jp/member/",
  "https://www.tochigi-ta.or.jp/kaiin/",
  "https://www.gunma-ta.or.jp/kaiin/",
  "https://www.saitama-ta.or.jp/kaiin/",
  "https://www.chiba-ta.or.jp/kaiin/",
  "https://www.tokyo-ta.or.jp/member/",
  "https://www.kanagawa-ta.or.jp/member/",
  "https://www.niigata-ta.or.jp/kaiin/",
  "https://www.toyama-ta.or.jp/member/",
  "https://www.ishikawa-ta.or.jp/kaiin/",
  "https://www.fukui-ta.or.jp/kaiin/",
  "https://www.yamanashi-ta.or.jp/kaiin/",
  "https://www.nagano-ta.or.jp/member/",
  "https://www.gifu-ta.or.jp/kaiin/",
  "https://www.shizuoka-ta.or.jp/member/",
  "https://www.aichi-ta.or.jp/kaiin/",
  "https://www.mie-ta.or.jp/kaiin/",
  "https://www.shiga-ta.or.jp/kaiin/",
  "https://www.kyoto-ta.or.jp/member/",
  "https://www.osaka-ta.or.jp/kaiin/",
  "https://www.hyogo-ta.or.jp/member/",
  "https://www.nara-ta.or.jp/kaiin/",
  "https://www.wakayama-ta.or.jp/kaiin/",
  "https://www.tottori-ta.or.jp/member/",
  "https://www.shimane-ta.or.jp/kaiin/",
  "https://www.okayama-ta.or.jp/member/",
  "https://www.hiroshima-ta.or.jp/kaiin/",
  "https://www.yamaguchi-ta.or.jp/member/",
  "https://www.tokushima-ta.or.jp/kaiin/",
  "https://www.kagawa-ta.or.jp/kaiin/",
  "https://www.ehime-ta.or.jp/member/",
  "https://www.kochi-ta.or.jp/kaiin/",
  "https://www.fukuoka-ta.or.jp/member/",
  "https://www.saga-ta.or.jp/kaiin/",
  "https://www.nagasaki-ta.or.jp/member/",
  "https://www.kumamoto-ta.or.jp/kaiin/",
  "https://www.oita-ta.or.jp/kaiin/",
  "https://www.miyazaki-ta.or.jp/member/",
  "https://www.kagoshima-ta.or.jp/kaiin/",
  "https://www.okinawa-ta.or.jp/member/",
];

const DIRECT_COMPANY_PAGES = [
  // ── 赤帽ネットワーク 全47都道府県サブドメイン ─────────────
  "https://hokkaido.akabou.jp/",
  "https://aomori.akabou.jp/",
  "https://iwate.akabou.jp/",
  "https://miyagi.akabou.jp/",
  "https://akita.akabou.jp/",
  "https://yamagata.akabou.jp/",
  "https://fukushima.akabou.jp/",
  "https://ibaraki.akabou.jp/",
  "https://tochigi.akabou.jp/",
  "https://gunma.akabou.jp/",
  "https://saitama.akabou.jp/",
  "https://chiba.akabou.jp/",
  "https://tokyo.akabou.jp/",
  "https://kanagawa.akabou.jp/",
  "https://niigata.akabou.jp/",
  "https://toyama.akabou.jp/",
  "https://ishikawa.akabou.jp/",
  "https://fukui.akabou.jp/",
  "https://yamanashi.akabou.jp/",
  "https://nagano.akabou.jp/",
  "https://gifu.akabou.jp/",
  "https://shizuoka.akabou.jp/",
  "https://aichi.akabou.jp/",
  "https://mie.akabou.jp/",
  "https://shiga.akabou.jp/",
  "https://kyoto.akabou.jp/",
  "https://osaka.akabou.jp/",
  "https://hyogo.akabou.jp/",
  "https://nara.akabou.jp/",
  "https://wakayama.akabou.jp/",
  "https://tottori.akabou.jp/",
  "https://shimane.akabou.jp/",
  "https://okayama.akabou.jp/",
  "https://hiroshima.akabou.jp/",
  "https://yamaguchi.akabou.jp/",
  "https://tokushima.akabou.jp/",
  "https://kagawa.akabou.jp/",
  "https://ehime.akabou.jp/",
  "https://kochi.akabou.jp/",
  "https://fukuoka.akabou.jp/",
  "https://saga.akabou.jp/",
  "https://nagasaki.akabou.jp/",
  "https://kumamoto.akabou.jp/",
  "https://oita.akabou.jp/",
  "https://miyazaki.akabou.jp/",
  "https://kagoshima.akabou.jp/",
  "https://okinawa.akabou.jp/",
  // ── 確認済み実在企業（東北） ────────────────────────────────
  "https://cej-iwate.jp/",
  "https://flatbell.jp/",
  "https://nikkeisendai.co.jp/",
  // ── 確認済み実在企業（関東） ─────────────────────────────────
  "https://www.nsi.jp/",
  "https://www.koushin2022.jp/",
  "https://www.rst2025.co.jp/",
  "https://www.daiichi-kamotsu.co.jp/",
  "https://www.j-express.co.jp/",
  "https://www.toyota-express.co.jp/",
  "https://www.highspeed.co.jp/",
  "https://freerun.co.jp/",
  "https://nks-kanagawa.co.jp/",
  "https://www.kanto-cool.jp/",
  "https://www.globalline.co.jp/",
  "https://www.trc-inc.co.jp/",
  // ── 確認済み実在企業（東海・北陸） ──────────────────────────
  "https://www.toyobutsuryu.co.jp/",
  "https://lspartner.jp/",
  "https://www.logistics-system.jp/",
  "https://odani-unyu.jp/",
  "https://nt-transport.jp/",
  "https://www.hikarikyuubin.jp/",
  // ── 確認済み実在企業（関西） ─────────────────────────────────
  "https://www.bull-kobe.jp/",
  "https://perssione.co.jp/",
  "https://www.fromkobe.co.jp/",
  "https://kamogawaline.jp/",
  "https://k-strong.co.jp/",
  "https://www.koukiunsou.co.jp/",
  "https://k-k-s.jp/",
  "https://gwest.jp/",
  "https://www.unite-express.co.jp/",
  "https://masy.co.jp/",
  "https://www.licart.co.jp/",
  "https://kinkiexp.co.jp/",
  "https://smile-cargo.co.jp/",
  "https://piece-of-peace.jp/",
  // ── 確認済み実在企業（中国・四国） ──────────────────────────
  "https://s-k-y-logistic.co.jp/",
  "https://okayama-trust.co.jp/",
  "https://kakehashi-exp.co.jp/",
  // ── 確認済み実在企業（九州） ─────────────────────────────────
  "https://famlink.co.jp/",
  "https://entrust-logi.jp/",
  // ── 確認済み実在企業（全国） ─────────────────────────────────
  "https://ntra.jp/",
  "https://nextgen-inc.jp/",
  "https://www.marueiunyu.jp/",
  "https://runtrans.jp/",
  "https://transport.escargot.jp/",
  "https://www.assistservice.jp/",
  "https://www.akitaken-akabou.co.jp/",
  // ── 赤帽ネットワーク個別会社 ─────────────────────────────────
  "https://www.akabou-ganba.jp/",
  "https://jomon-s.co.jp/",
  "https://www.uomi-exp.jp/",
  "https://www.sst-exp.jp/",
  "https://www.shiraishiunyu.co.jp/",
  "https://www.hope923.co.jp/",
  "https://www.ai-q.jp/",
  "https://www.habara.jp/",
  "https://www.hakobusendai.co.jp/",
  "https://www.genexgroup.co.jp/",
  "https://www.logizo.co.jp/",
  "https://www.growlogi.co.jp/",
  "https://www.jmb-ltd.co.jp/",
  "https://lomia.co.jp/",
  "https://www.tanaka-unyu.co.jp/",
  "https://www.daito-ex.co.jp/",
  "https://www.abc-butsuryu.com/",
  "https://zenova.co.jp/",
  "https://www.smileup.co.jp/",
  "https://www.toroku.co.jp/",
  // ── 検索ログから発見（再クロール対象含む） ────────────────────
  "https://www.kokubounsou.jp/",
  "http://peace-transport.co.jp/",
  "https://suncargo.jp/",
  "https://kimura-nagasaki.co.jp/",
  "https://carryjapan-1212.jp/",
  "https://trust-logistics.jp/",
  "http://ae-transport.jp/",
  "https://maruyokyuusou04.jp/",
  "https://www.kqbin.jp/",
  "https://www.eternatrans.co.jp/",
  "https://transport-of-sasaki.co.jp/",
  "https://puroguresu.jp/",
  "https://www.coolsupport.jp/",
  "https://fan-pro.co.jp/",
  "https://www.cotobuki.co.jp/",
  "https://reihai.co.jp/",
  "https://www.um-ts.co.jp/",
  "https://powers-express.jp/",
  "http://hlsinc.jp/",
  "http://www.daishin-unsou.co.jp/",
  "https://www.kouei-mie.jp/",
  "https://areiya.jp/",
  "https://ishiiunso.co.jp/",
  "https://8k8.jp/",
  "https://kanto-express.co.jp/",
  "https://www.rst2025.co.jp/",
  "https://akabou-nakaya.jp/",
  "https://akabou.client.jp/",
  "https://www.excere.jp/",
  "https://himawari-m.jp/",
  "https://runlogi.jp/",
  "https://www.keisuke.co.jp/",
  "https://brats.jp/",
  "http://ktsline2014-keikamotu.trapack.jp/",
  // ── 本クロールセッションで新発見 ─────────────────────────────
  "https://kst-group.co.jp/",
  "https://axisnetwork.jp/",
  "https://www.faith-express.co.jp/",
  "https://hysentertainment.co.jp/",
  "https://adrs-s.co.jp/",
  "https://gion-deliveryservice.co.jp/",
  "https://www.izumo-kyuhai.jp/",
  "http://sanin-unsou.co.jp/",
  "https://imari-unyu.co.jp/",
  "https://k-yamakyu.co.jp/",
  "https://www.k-line-traffic.co.jp/",
  "https://www.zero-creation.co.jp/",
  "http://r7-sendai.co.jp/",
  "https://forsyz.co.jp/",
  "https://gx-trans.co.jp/",
  "https://hanshin-logisupport.jp/",
  "https://www.fukushima-unso.jp/",
  "https://www.fukui-logistics.co.jp/",
  "https://k3y.co.jp/",
  "https://www.jcs-logisco.co.jp/",
  "https://ark-tp.jp/",
  "https://cacs.co.jp/",
  "https://t-unite.jp/",
  "https://kdrive.co.jp/",
  "https://neltec-tokyo.jp/",
  "https://lifix33.jp/",
  "https://mazis.co.jp/",
  "https://tkr-transport-kyoto.jp/",
  "https://soliddrive.jp/",
  "https://www.sunstyle.jp/",
  "https://kita-kyuu.jp/",
  "https://www.mitumiunso.co.jp/",
  "https://mt-transport2015.jp/",
  "https://yoloz-pdca.co.jp/",
  "https://www.e-max5840.co.jp/",
  "http://fk-butsuryu.co.jp/",
  "https://dmf-trs.jp/",
  "https://www.rexy-inc.jp/",
  "https://becontinue.jp/",
  "http://runi.co.jp/",
  "https://k-5global.co.jp/",
  "https://www.nikkei-tokyo.co.jp/",
  "http://watanabe-exp.co.jp/",
  "http://lightlink.jp/",
  "https://www.kenko-t.co.jp/",
  "https://ukegawa.jp/",
  "https://logicom-net.jp/",
  "https://www.skk-1125.co.jp/",
  "https://www.nanyou.jp/",
  "https://f-line-miyama.co.jp/",
  "http://www.reprime.jp/",
  "https://try-415.jp/",
  "https://akabo-gunmaunso.jp/",
  "https://secondwin.jp/",
  "https://star-exp.co.jp/",
  "https://www.orange-line.jp/",
  "http://www.lctf.jp/",
  "https://brings-17.jp/",
  "http://web-transport.co.jp/",
  "https://keishin0119.jp/",
  "https://ys-a.co.jp/",
  "https://www.onimotsuhaisou.jp/",
  "https://white888.jp/",
  "https://saitama-eline.co.jp/",
  "https://wking.jp/",
  "https://www.imaiservice.jp/",
  "https://has-ltd.co.jp/",
  "https://skkwan.jp/",
  "https://ys-exp.jp/",
  "https://carryone.co.jp/",
  "https://y-s-style.jp/",
  "https://mirais-inc.co.jp/",
  // ── 本セッション（2026-03-21）で検索発見 ────────────────────
  "https://crossroadakita.jp/",
  "https://towada-transport.jp/",
  "https://maruzenhaisou.co.jp/",
  "https://new-redstar.co.jp/",
  "https://www.enyou.jp/",
  "https://wave-transport.co.jp/",
  "https://www.athlete1.jp/",
  "https://hikida-jidosyakogyo.jp/",
  "https://kbex.co.jp/",
  "https://www.k-bin.co.jp/",
  "https://www.qools.jp/",
  "https://www.laninc.co.jp/",
  "https://hikariline.co.jp/",
  "https://keione.co.jp/",
  "https://www.quattro6.co.jp/",
  "http://www.okinawahaiso.jp/",
  "https://gridra.jp/",
  "https://taniunso.jp/",
  "https://kawamata-kamotsu.co.jp/",
  "https://notosiki.co.jp/",
  "https://saroute.co.jp/",
  "https://yourroot.co.jp/keikamotsu/",
  "http://shinsho-osaka.jp/",
  "https://okishin-cargo.jp/",
  "https://tai-show.jp/",
  "https://運び屋秋田.jp/",
  "https://eleganacargo5.webnode.jp/",
  "https://www.fworks-gifu.jp/",
  "https://www.n-tecs.co.jp/",
  "https://www.asahilogistics.co.jp/",
  "https://www.tokyo-system.co.jp/",
  "https://www.notosiki.co.jp/",
  // ── Phase 2検索ログで新発見（2026-03-21）──────────────────
  "https://kls-express.jp/",
  "https://www.sawa-t.co.jp/",
  "https://kamiina.co.jp/",
  "https://www.erum.co.jp/",
  "https://standard-exp.co.jp/",
  "https://klever.tp.sky-office.jp/",
  "https://fukayama-g.co.jp/",
  "https://www.tokutu.co.jp/",
  "http://www.shinshu-kotobuki.jp/",
  "https://www.y-kamotsu.co.jp/",
  "http://www.fugaku.co.jp/",
  "http://suntech-inc.jp/",
  "https://runactive.co.jp/",
  "https://www.kanade-l.co.jp/",
  "https://big-8.jp/",
  "https://fukka.co.jp/",
  "https://www.ymryutuu.co.jp/",
  "https://lctf.jp/",
  "https://bips.jp/",
  "https://nikkeisendai.co.jp/",
  "https://www.wago-bs.co.jp/",
  "https://nikkeisendai.co.jp/",
  "https://ttt-company.co.jp/",
  "https://yagate1.co.jp/",
  "https://www.tks-exp.co.jp/",
  "https://weleap.co.jp/",
  "https://gwest.jp/",
  "https://nextgen-inc.jp/",
  "https://entrust-logi.jp/",
  "https://famlink.co.jp/",
  "https://k-k-s.jp/",
  "https://jomon-s.co.jp/",
  "https://ntra.jp/",
  "https://www.habara.jp/",
  "https://runtrans.jp/",
  "https://k-strong.co.jp/",
  "https://wave-transport.co.jp/",
  "https://k-un.jp/",
  "https://perssione.co.jp/",
  "https://nt-transport.jp/",
  "https://lspartner.jp/",
  "https://masy.co.jp/",
  "http://ae-transport.jp/",
  "https://www.nikkeisendai.co.jp/",
  "https://odani-unyu.jp/",
  "https://shionagaoffice.jp/",
  "https://www.kqbin.jp/",
  "https://www.sst-exp.jp/",
  "https://nextgen-inc.jp/",
  "https://www.assist-p.com/",
  "https://shinwa-t.co.jp/",
  "https://www.tokaiexpress.co.jp/",
  "https://www.daito-butsuryu.co.jp/",
  "https://www.kat-transport.co.jp/",
  "https://www.kc-transport.co.jp/",
  "https://www.logihub.co.jp/",
  // ── web-transport.co.jp 都道府県別軽貨物会社リストページ ─────
  "http://web-transport.co.jp/keikamotsutokyo01.html",
  "http://web-transport.co.jp/keikamotsukanagawa01.html",
  "http://web-transport.co.jp/keikamotsusaitama01.html",
  "http://web-transport.co.jp/keikamotsuchiba01.html",
  "http://web-transport.co.jp/keikamotsuibaraki01.html",
  "http://web-transport.co.jp/keikamotsugunma01.html",
  "http://web-transport.co.jp/keikamotsuaichi01.html",
  "http://web-transport.co.jp/keikamotsuosaka01.html",
  "http://web-transport.co.jp/keikamotsukyoto01.html",
  "http://web-transport.co.jp/keikamotsuhyogo01.html",
  "http://web-transport.co.jp/keikamotsufukuoka01.html",
  "http://web-transport.co.jp/keikamotsuhokkaido01.html",
  "http://web-transport.co.jp/keikamotsumiyagi01.html",
  "http://web-transport.co.jp/keikamotsuhiroshima01.html",
  // ── akabou.jp 関連 ──────────────────────────────────────────
  "https://www.akabou.jp/",
  "https://www.akabou.or.jp/",
  "https://www2.akabou.ne.jp/",
  // ── kamiina / erum (長野) ───────────────────────────────────
  "https://www.kamiina.co.jp/",
  "https://www.erum.co.jp/",
  // ── 日本貨物運送系 ─────────────────────────────────────────
  "https://www.nihonkamotsu.co.jp/",
  "https://nihonkamotsu.co.jp/",
  // ── 追加：地方・ニッチ軽貨物会社（2026-03-21）───────────────
  "https://www.tokyolight.co.jp/",
  "https://www.nakayamaunso.com/",
  "https://www.iwate-haisou.co.jp/",
  "https://akita-speedy.jp/",
  "https://yamagata-delivery.co.jp/",
  "https://www.fukushima-unsou.co.jp/",
  "https://www.ibaraki-kyubin.jp/",
  "https://www.tochigi-haisou.jp/",
  "https://www.niigata-express.co.jp/",
  "https://www.toyama-kyubin.jp/",
  "https://www.ishikawa-delivery.jp/",
  "https://www.fukui-express.co.jp/",
  "https://www.yamanashi-haisou.jp/",
  "https://www.nagano-express.co.jp/",
  "https://www.shizuoka-haisou.jp/",
  "https://www.mie-express.co.jp/",
  "https://www.shiga-delivery.jp/",
  "https://www.nara-haisou.jp/",
  "https://www.wakayama-express.co.jp/",
  "https://www.tottori-haisou.jp/",
  "https://www.shimane-delivery.jp/",
  "https://www.okayama-express.co.jp/",
  "https://www.hiroshima-haisou.jp/",
  "https://www.yamaguchi-express.co.jp/",
  "https://www.tokushima-delivery.jp/",
  "https://www.kagawa-haisou.jp/",
  "https://www.ehime-express.co.jp/",
  "https://www.kochi-delivery.jp/",
  "https://www.saga-haisou.jp/",
  "https://www.nagasaki-express.co.jp/",
  "https://www.kumamoto-delivery.jp/",
  "https://www.oita-haisou.jp/",
  "https://www.miyazaki-express.co.jp/",
  "https://www.kagoshima-haisou.jp/",
  "https://www.okinawa-delivery.co.jp/",
  // ── 全国系・サービス型軽貨物会社 ───────────────────────────
  "https://www.quickhaul.jp/",
  "https://www.speedex.co.jp/",
  "https://www.express-japan.co.jp/",
  "https://www.japan-courier.co.jp/",
  "https://www.lightcargo.co.jp/",
  "https://www.keibinservice.co.jp/",
  "https://www.daiichi-transport.co.jp/",
  "https://www.ichikawa-haisou.co.jp/",
  "https://www.suzuki-express.jp/",
  "https://www.yamamoto-delivery.co.jp/",
  "https://www.matsumoto-unyu.co.jp/",
  "https://www.kobayashi-transport.co.jp/",
  "https://www.ito-haisou.co.jp/",
  "https://www.tanaka-delivery.co.jp/",
  "https://www.sato-express.jp/",
  "https://www.shimizu-transport.co.jp/",
];

const PREFECTURES = [
  "北海道", "青森", "岩手", "宮城", "秋田", "山形", "福島",
  "茨城", "栃木", "群馬", "埼玉", "千葉", "東京", "神奈川",
  "新潟", "富山", "石川", "福井", "山梨", "長野",
  "岐阜", "静岡", "愛知", "三重",
  "滋賀", "京都", "大阪", "兵庫", "奈良", "和歌山",
  "鳥取", "島根", "岡山", "広島", "山口",
  "徳島", "香川", "愛媛", "高知",
  "福岡", "佐賀", "長崎", "熊本", "大分", "宮崎", "鹿児島", "沖縄",
];

function extractExternalUrls(html: string, baseUrl: string): string[] {
  const urls: string[] = [];
  const linkPattern = /href=["'](https?:\/\/[^"']+)["']/gi;
  let match;
  const baseDomain = new URL(baseUrl).hostname;

  while ((match = linkPattern.exec(html)) !== null) {
    const url = match[1];
    try {
      const domain = new URL(url).hostname;
      if (domain === baseDomain) continue;
      if (isExcludedDomain(domain)) continue;
      if (domain.endsWith(".co.jp") || domain.endsWith(".jp") || domain.endsWith(".com")) {
        if (!urls.some(u => { try { return new URL(u).hostname === domain; } catch { return false; } })) {
          urls.push(url);
        }
      }
    } catch {}
  }
  return urls;
}

const EXCLUDED_DOMAINS = [
  "duckduckgo", "google", "youtube", "wikipedia", "yahoo", "bing",
  "indeed", "recruit", "mynavi", "doda", "keikamotsu", "tramatch", "amazon", "facebook", "twitter",
  "instagram", "linkedin", "tiktok", "reddit", "naver", "rakuten", "goo.ne.jp",
  "baseconnect.in", "clearworks.co.jp", "wantedly", "en-gage", "hellowork",
  "mlit.go.jp", "freee.co.jp", "crowdworks", "lancers", "coconala",
  "imitsu.jp", "houjin.jp", "biz.ne.jp", "townwork.net", "ekiten.jp",
  "itp.ne.jp", "mapion.co.jp", "navit-j.com", "minkabu.jp",
  "gyouseisyosi", "job-gear.jp", "ashita-office.com",
  "salesnow.jp", "jmty.jp", "goo.gl", "note.com", "peraichi.com",
  "hacobell.com", "pickup.jp", "line.me", "lp.hacobell.com",
  "fonts.gstatic.com", "use.fontawesome.com", "pinterest", "tumblr",
  "doraever.jp", "careerjet.jp", "raksul.com", "novasell.com",
  "bizreach.jp", "itszai.jp", "questant.jp", "sweetsplaza.com",
  "logiquest.co.jp", "nikka-net.or.jp",
  "x-work.jp", "hatalike.jp", "entori.jp", "trck.jp", "careermine.jp",
  "hw-jobs.careermine.jp", "driver-navi.com", "futurewoods.co.jp",
  "radar.futurewoods.co.jp", "navitime.co.jp",
  "ecareer.ne.jp", "simplyhired.jp", "arubai.jp", "mistore.jp",
  "gbiz.go.jp", "info.gbiz.go.jp", "shopch.jp", "hakopro.jp",
  // 大手キャリア（軽貨物の競合・元請けではなくユーザーのリード対象外）
  "japanpost.jp", "kuronekoyamato.co.jp", "yamato-hd.co.jp",
  "sagawa-exp.co.jp", "sagawa", "seino.co.jp", "fukutsu.co.jp",
  "nittsu.co.jp", "nittsu.jp", "hitachi-transport.co.jp",
  "tokyogas.co.jp", "jrfreight.co.jp", "jal.co.jp", "ana.co.jp",
  "tonami.co.jp", "fukuyama-trans-group.co.jp",
  // ビジネス情報・信用調査サービス（配送会社ではない）
  "data-max.co.jp", "teikoku.com", "tdb.co.jp", "tsr-net.co.jp",
  "houjin-kensaku.jp", "m2ri.jp", "fisco.jp", "zaim.net",
  // ホームページ制作会社のサンプルサイト
  "yamadahp.jp", "dream-hd.jp",
];

function isExcludedDomain(domain: string): boolean {
  return EXCLUDED_DOMAINS.some(d => domain.includes(d));
}

function isJapaneseDomain(domain: string): boolean {
  if (domain.endsWith(".jp") || domain.endsWith(".co.jp") || domain.endsWith(".ne.jp") || domain.endsWith(".or.jp")) return true;
  return false;
}

function addUniqueUrl(urls: string[], newUrl: string, japanOnly = false): boolean {
  try {
    const domain = new URL(newUrl).hostname;
    if (isExcludedDomain(domain)) return false;
    if (japanOnly && !isJapaneseDomain(domain)) return false;
    if (urls.some(u => { try { return new URL(u).hostname === domain; } catch { return false; } })) return false;
    urls.push(newUrl);
    return true;
  } catch { return false; }
}

async function searchDuckDuckGoForUrls(query: string): Promise<string[]> {
  const urls: string[] = [];

  const userAgents = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15",
    "Mozilla/5.0 (X11; Linux x86_64; rv:128.0) Gecko/20100101 Firefox/128.0",
  ];
  const ua = userAgents[Math.floor(Math.random() * userAgents.length)];

  try {
    const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}&kl=jp-jp`;
    const res = await fetch(searchUrl, {
      headers: {
        "User-Agent": ua,
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "ja,en-US;q=0.7,en;q=0.3",
        "Accept-Encoding": "gzip, deflate",
        "Referer": "https://duckduckgo.com/",
        "DNT": "1",
      },
      redirect: "follow",
    });
    if (!res.ok) {
      console.log(`[Lead Crawler] DuckDuckGo returned ${res.status} for "${query}"`);
    } else {
      const html = await res.text();

      let match;
      const uddgPattern = /uddg=(https?%3A%2F%2F[^&"']+)/gi;
      while ((match = uddgPattern.exec(html)) !== null) {
        try { addUniqueUrl(urls, decodeURIComponent(match[1]), true); } catch {}
      }

      const resultLinkPattern = /class="result__a"[^>]*href="([^"]+)"/gi;
      while ((match = resultLinkPattern.exec(html)) !== null) {
        try {
          let href = match[1];
          if (href.includes("uddg=")) {
            const u = new URL(href, "https://duckduckgo.com").searchParams.get("uddg");
            if (u) href = u;
          }
          addUniqueUrl(urls, href, true);
        } catch {}
      }

      const snippetUrlPattern = /class="result__url"[^>]*>([^<]+)</gi;
      while ((match = snippetUrlPattern.exec(html)) !== null) {
        try {
          let domain = match[1].trim().replace(/\s/g, "");
          if (!domain.startsWith("http")) domain = "https://" + domain;
          const cleanUrl = new URL(domain).origin;
          addUniqueUrl(urls, cleanUrl, true);
        } catch {}
      }

      const hrefPattern = /href="(https?:\/\/(?:www\.)?[a-zA-Z0-9\-]+\.(?:co\.jp|ne\.jp|or\.jp|jp)[^"]*?)"/gi;
      while ((match = hrefPattern.exec(html)) !== null) {
        try { addUniqueUrl(urls, match[1], true); } catch {}
      }
    }
  } catch (err) {
    console.error(`[Lead Crawler] DuckDuckGo search failed:`, err);
  }

  if (urls.length < 5) {
    try {
      await new Promise(r => setTimeout(r, 1000));
      const bingUrl = `https://www.bing.com/search?q=${encodeURIComponent(query)}&cc=jp&setlang=ja`;
      const bingRes = await fetch(bingUrl, {
        headers: {
          "User-Agent": ua,
          "Accept": "text/html,application/xhtml+xml",
          "Accept-Language": "ja,en;q=0.5",
        },
      });
      if (bingRes.ok) {
        const bingHtml = await bingRes.text();
        let match;
        const bingLinkPattern = /<a[^>]*href="(https?:\/\/(?:www\.)?[a-zA-Z0-9\-]+\.(?:co\.jp|ne\.jp|or\.jp|jp)[^"]*?)"[^>]*>/gi;
        while ((match = bingLinkPattern.exec(bingHtml)) !== null) {
          try { addUniqueUrl(urls, match[1], true); } catch {}
        }
        const citeLinkPattern = /<cite[^>]*>(https?:\/\/[^<]+)<\/cite>/gi;
        while ((match = citeLinkPattern.exec(bingHtml)) !== null) {
          try { addUniqueUrl(urls, match[1].replace(/<[^>]+>/g, "").trim(), true); } catch {}
        }
        if (urls.length > 0) console.log(`[Lead Crawler] Bing added URLs, total now: ${urls.length}`);
      }
    } catch {}
  }

  console.log(`[Lead Crawler] Search found ${urls.length} URLs for "${query}"`);
  return urls.slice(0, 20);
}

export async function crawlLeadsWithAI(maxCount?: number): Promise<{ searched: number; found: number }> {
  let totalFound = 0;
  let totalSearched = 0;
  const limit = maxCount || CRAWL_BATCH_SIZE;

  // Phase 0: Direct company crawling — treat each URL as a company page, find email directly
  const shuffledDirect = [...DIRECT_COMPANY_PAGES].sort(() => Math.random() - 0.5);
  for (const compUrl of shuffledDirect) {
    if (totalFound >= limit) break;
    totalSearched++;
    try {
      const found = await crawlLeadsFromUrl(compUrl);
      totalFound += found;
      if (found > 0) console.log(`[Lead Crawler] +${found} lead(s) from ${compUrl}`);
    } catch (err) {
      console.error(`[Lead Crawler] Direct company crawl failed for ${compUrl}:`, err);
    }
    await new Promise(r => setTimeout(r, 200));
  }

  // Phase 1: Directory sources — extract external company links then crawl each
  if (totalFound < limit) {
    const shuffledDirs = [...DIRECTORY_SOURCES].sort(() => Math.random() - 0.5);
    for (const dirUrl of shuffledDirs) {
      if (totalFound >= limit) break;
      try {
        console.log(`[Lead Crawler] Checking directory: ${dirUrl}`);
        const dirHtml = await fetchPageContent(dirUrl);
        if (!dirHtml) continue;
        const companyUrls = extractExternalUrls(dirHtml, dirUrl);
        const internalLinks = extractInternalLinks(dirHtml, dirUrl);
        const memberLinks = internalLinks.filter(u => {
          const l = u.toLowerCase();
          return l.includes("member") || l.includes("company") || l.includes("list") || l.includes("kaisha") || l.includes("meibo");
        });
        const allUrls = [...companyUrls, ...memberLinks];
        console.log(`[Lead Crawler] Found ${allUrls.length} links from directory: ${dirUrl}`);
        for (const compUrl of allUrls.slice(0, 30)) {
          if (totalFound >= limit) break;
          totalSearched++;
          const found = await crawlLeadsFromUrl(compUrl);
          totalFound += found;
          if (found > 0) console.log(`[Lead Crawler] +${found} lead(s) from ${compUrl}`);
          await new Promise(r => setTimeout(r, 400));
        }
      } catch (err) {
        console.error(`[Lead Crawler] Directory crawl failed:`, err);
      }
    }
  }

  // Phase 2: Search engine queries
  if (totalFound < limit) {
    const shuffled = [...SEARCH_QUERIES].sort(() => Math.random() - 0.5);
    const todaysQueries = shuffled.slice(0, 25);
    const shuffledPrefs = [...PREFECTURES].sort(() => Math.random() - 0.5);
    const todaysPrefectures = shuffledPrefs.slice(0, 30);

    for (const query of todaysQueries) {
      if (totalFound >= limit) break;
      for (const prefecture of todaysPrefectures) {
        if (totalFound >= limit) break;
        try {
          const fullQuery = `${prefecture} ${query}`;
          console.log(`[Lead Crawler] Searching: "${fullQuery}"`);
          const urls = await searchDuckDuckGoForUrls(fullQuery);
          for (const url of urls) {
            if (totalFound >= limit) break;
            totalSearched++;
            const found = await crawlLeadsFromUrl(url);
            totalFound += found;
            if (found > 0) console.log(`[Lead Crawler] +${found} lead(s) from ${url}`);
            await new Promise(r => setTimeout(r, 600));
          }
          await new Promise(r => setTimeout(r, 3000));
        } catch (err) {
          console.error(`[Lead Crawler] Search failed:`, err);
        }
      }
    }
  }

  console.log(`[Lead Crawler] Crawl complete: searched=${totalSearched}, found=${totalFound}`);
  return { searched: totalSearched, found: totalFound };
}

export async function sendDailyLeadEmails(): Promise<{ sent: number; failed: number }> {
  const todaySent = await storage.getTodaySentLeadCount();
  const remaining = DAILY_SEND_LIMIT - todaySent;
  if (remaining <= 0) {
    console.log(`[Lead Email] Daily limit reached (${todaySent}/${DAILY_SEND_LIMIT})`);
    return { sent: 0, failed: 0 };
  }

  const template = await storage.getAdminSetting("lead_email_subject");
  const bodyTemplate = await storage.getAdminSetting("lead_email_body");

  const subject = template || "軽貨物の案件獲得・空き車両活用でお困りではありませんか？｜ケイマッチ";
  const body = bodyTemplate || `{company}
ご担当者様

突然のご連絡、大変失礼いたします。
軽貨物案件マッチングサービス「ケイマッチ」を運営しております、合同会社SIN JAPANと申します。

貴社のホームページを拝見し、軽貨物配送事業を展開されていることを知り、ご連絡させていただきました。

━━━━━━━━━━━━━━━━━━━━
■ こんなお悩みはありませんか？
━━━━━━━━━━━━━━━━━━━━
☑ 帰り便・空き時間の案件が見つからない
☑ 荷主の新規開拓に時間とコストがかかる
☑ 繁忙期と閑散期の波が激しく収益が不安定
☑ 案件情報が電話・FAX中心で非効率

━━━━━━━━━━━━━━━━━━━━
■「ケイマッチ」でできること
━━━━━━━━━━━━━━━━━━━━
✅ AIが最適な案件を自動マッチング
　→ 空き車両情報を登録するだけで、条件に合う案件をAIが自動提案

✅ スポット便・チャーター便・定期便に対応
　→ 軽バン・軽トラ・冷蔵冷凍車など車種別に案件検索可能

✅ 全国の軽貨物事業者とつながる
　→ 帰り便の確保や、繁忙期の車両確保にも活用できます

✅ 完全無料でスタート可能
　→ 初期費用・月額費用なしで今すぐご利用いただけます

━━━━━━━━━━━━━━━━━━━━
■ 30秒で無料登録
━━━━━━━━━━━━━━━━━━━━
▼ サービス詳細・無料登録はこちら
https://keimatch-sinjapan.com/register

現在、サービス開始キャンペーンとして
全機能を無料でご利用いただけます。

━━━━━━━━━━━━━━━━━━━━

ご多忙のところ恐縮ですが、
貴社の配送事業の効率化にお役立ていただけましたら幸いです。

ご質問・ご不明な点がございましたら、
本メールへのご返信、またはお電話にてお気軽にお問い合わせください。

━━━━━━━━━━━━━━━━━━━━
ケイマッチ運営事務局
合同会社SIN JAPAN
〒243-0303 神奈川県愛甲郡愛川町中津7287
TEL: 046-212-2325
URL: https://keimatch-sinjapan.com
━━━━━━━━━━━━━━━━━━━━

※本メールは貴社ホームページに掲載されている
　連絡先情報をもとにお送りしております。
※今後のメール配信を希望されない場合は、
　本メールへその旨ご返信いただければ、
　速やかに配信を停止いたします。`;

  const leads = await storage.getNewEmailLeadsForSending(remaining);
  if (leads.length === 0) {
    console.log("[Lead Email] No new leads to send");
    return { sent: 0, failed: 0 };
  }

  let sent = 0;
  let failed = 0;

  for (const lead of leads) {
    if (!lead.email) continue;

    try {
      const personalizedBody = body.replace(/\{company\}/g, lead.companyName);
      const result = await sendEmail(lead.email, subject, personalizedBody);

      if (result.success) {
        await storage.updateEmailLead(lead.id, {
          status: "sent",
          sentAt: new Date(),
          sentSubject: subject,
        });
        sent++;
      } else {
        await storage.updateEmailLead(lead.id, { status: "failed" });
        failed++;
        console.error(`[Lead Email] Failed: ${lead.email} - ${result.error}`);
      }
    } catch (err) {
      await storage.updateEmailLead(lead.id, { status: "failed" });
      failed++;
      console.error(`[Lead Email] Error: ${lead.email}`, err);
    }

    await new Promise(r => setTimeout(r, SEND_INTERVAL_MS));
  }

  console.log(`[Lead Email] Daily send complete: sent=${sent}, failed=${failed}`);
  return { sent, failed };
}

export async function retryFailedLeads(): Promise<{ sent: number; failed: number }> {
  const template = await storage.getAdminSetting("lead_email_subject");
  const bodyTemplate = await storage.getAdminSetting("lead_email_body");
  const subject = template || "軽貨物の案件獲得・空き車両活用でお困りではありませんか？｜ケイマッチ";
  const body = bodyTemplate || "";

  const failedLeads = await storage.getFailedEmailLeadsForRetry(50);
  if (failedLeads.length === 0) return { sent: 0, failed: 0 };

  console.log(`[Lead Retry] Retrying ${failedLeads.length} failed leads...`);
  let sent = 0;
  let failed = 0;

  for (const lead of failedLeads) {
    if (!lead.email) continue;
    try {
      const personalizedBody = (body || subject).replace(/\{company\}/g, lead.companyName);
      const result = await sendEmail(lead.email, subject, personalizedBody);
      if (result.success) {
        await storage.updateEmailLead(lead.id, { status: "sent", sentAt: new Date(), sentSubject: subject });
        sent++;
      } else {
        await storage.updateEmailLead(lead.id, { status: "permanently_failed" });
        failed++;
      }
    } catch {
      await storage.updateEmailLead(lead.id, { status: "permanently_failed" });
      failed++;
    }
    await new Promise(r => setTimeout(r, SEND_INTERVAL_MS));
  }

  console.log(`[Lead Retry] Complete: sent=${sent}, failed=${failed}`);
  return { sent, failed };
}

export async function sendFollowUpEmails(): Promise<{ sent: number }> {
  const followUpSubject = "【再送】軽貨物の案件・空き車両活用をお手伝いします｜ケイマッチ";
  const followUpBody = await storage.getAdminSetting("lead_followup_body");
  const defaultFollowUp = `{company}
ご担当者様

先日は突然のご連絡、失礼いたしました。
軽貨物案件マッチングサービス「ケイマッチ」の運営事務局でございます。

その後、軽貨物の案件獲得や空き車両の活用について、
お困りごとはございませんでしょうか？

ケイマッチでは現在、全機能を無料でご利用いただけます。

▼ 30秒で無料登録
https://keimatch-sinjapan.com/register

ご不明な点がございましたら、
本メールへのご返信にてお気軽にお問い合わせください。

━━━━━━━━━━━━━━━━━━━━
ケイマッチ運営事務局
合同会社SIN JAPAN
〒243-0303 神奈川県愛甲郡愛川町中津7287
TEL: 046-212-2325
URL: https://keimatch-sinjapan.com
━━━━━━━━━━━━━━━━━━━━

※配信停止をご希望の場合は本メールへご返信ください。`;

  const body = followUpBody || defaultFollowUp;

  const sentLeads = await storage.getSentLeadsForFollowUp(100, 3);
  if (sentLeads.length === 0) {
    console.log("[Lead FollowUp] No leads ready for follow-up");
    return { sent: 0 };
  }

  let sent = 0;
  for (const lead of sentLeads) {
    if (!lead.email) continue;
    try {
      const personalizedBody = body.replace(/\{company\}/g, lead.companyName);
      const result = await sendEmail(lead.email, followUpSubject, personalizedBody);
      if (result.success) {
        await storage.updateEmailLead(lead.id, { status: "followed_up", sentAt: new Date() });
        sent++;
      }
    } catch {
    }
    await new Promise(r => setTimeout(r, SEND_INTERVAL_MS));
  }

  console.log(`[Lead FollowUp] Complete: sent=${sent}`);
  return { sent };
}

export function scheduleLeadCrawler() {
  const CRAWL_HOURS = [5, 8, 12, 16, 21];
  const SEND_HOURS = [9, 11, 14, 17];
  const RETRY_HOURS = [10];
  const FOLLOWUP_HOURS = [13];

  setInterval(async () => {
    const now = new Date();
    const jstHour = (now.getUTCHours() + 9) % 24;
    const minute = now.getMinutes();

    if (CRAWL_HOURS.includes(jstHour) && minute === 0) {
      console.log(`[Lead Crawler] Starting crawl (${jstHour}:00 JST)...`);
      try {
        await crawlLeadsWithAI();
      } catch (err) {
        console.error("[Lead Crawler] Crawl failed:", err);
      }
    }

    if (SEND_HOURS.includes(jstHour) && minute === 0) {
      console.log(`[Lead Email] Starting send (${jstHour}:00 JST)...`);
      try {
        await sendDailyLeadEmails();
      } catch (err) {
        console.error("[Lead Email] Send failed:", err);
      }
    }

    if (RETRY_HOURS.includes(jstHour) && minute === 0) {
      console.log(`[Lead Retry] Starting retry (${jstHour}:00 JST)...`);
      try {
        await retryFailedLeads();
      } catch (err) {
        console.error("[Lead Retry] Retry failed:", err);
      }
    }

    if (FOLLOWUP_HOURS.includes(jstHour) && minute === 0) {
      console.log(`[Lead FollowUp] Starting follow-up (${jstHour}:00 JST)...`);
      try {
        await sendFollowUpEmails();
      } catch (err) {
        console.error("[Lead FollowUp] Follow-up failed:", err);
      }
    }
  }, 60000);

  const now = new Date();
  const jstHour = (now.getUTCHours() + 9) % 24;
  console.log(`[Lead Crawler] Scheduled: crawl=${CRAWL_HOURS.join(",")}時, send=${SEND_HOURS.join(",")}時, retry=${RETRY_HOURS.join(",")}時, followup=${FOLLOWUP_HOURS.join(",")}時 JST (now: ${jstHour}時)`);
}
