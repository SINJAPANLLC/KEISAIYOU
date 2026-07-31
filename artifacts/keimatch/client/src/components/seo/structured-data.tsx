interface StructuredDataProps {
  type: "Organization" | "WebSite" | "LocalBusiness" | "WebPage" | "Article" | "JobPosting";
  data?: Record<string, any>;
}

const BASE_URL = "https://keisaiyou-sinjapan.com";

const organizationData = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "KEI SAIYOU",
  alternateName: "軽貨物特化採用プラットフォーム",
  url: BASE_URL,
  logo: `${BASE_URL}/logo-keisaiyou.png`,
  description: "KEI SAIYOUは軽貨物・運送会社のドライバー採用に特化したプラットフォームです。初期費用・月額費用ゼロ。応募が来たら即通知、3,300円／応募のシンプルな料金プラン。",
  address: {
    "@type": "PostalAddress",
    streetAddress: "中津7287",
    addressLocality: "愛川町",
    addressRegion: "神奈川県",
    postalCode: "243-0303",
    addressCountry: "JP",
  },
  contactPoint: {
    "@type": "ContactPoint",
    telephone: "+81-46-212-2325",
    email: "info@sinjapan.jp",
    contactType: "customer service",
    availableLanguage: "Japanese",
  },
  parentOrganization: {
    "@type": "Organization",
    name: "合同会社SIN JAPAN",
  },
};

const localBusinessData = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  name: "KEI SAIYOU（軽貨物ドライバー採用プラットフォーム）",
  url: BASE_URL,
  logo: `${BASE_URL}/logo-keisaiyou.png`,
  image: `${BASE_URL}/og-image.jpg`,
  description: "軽貨物・運送会社のドライバー採用に特化したプラットフォーム。初期費用・月額費用ゼロ。応募が来たら即通知。",
  address: {
    "@type": "PostalAddress",
    streetAddress: "中津7287",
    addressLocality: "愛川町",
    addressRegion: "神奈川県",
    postalCode: "243-0303",
    addressCountry: "JP",
  },
  telephone: "+81-46-212-2325",
  email: "info@sinjapan.jp",
  priceRange: "¥3,300/応募",
  areaServed: {
    "@type": "Country",
    name: "Japan",
  },
};

const webSiteData = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "KEI SAIYOU",
  alternateName: "軽貨物特化採用プラットフォーム",
  url: BASE_URL,
  description: "軽貨物ドライバー採用に特化したプラットフォーム。初期費用・月額ゼロ、応募通知ごとの課金。",
  potentialAction: {
    "@type": "SearchAction",
    target: `${BASE_URL}/driver/jobs?area={search_term_string}`,
    "query-input": "required name=search_term_string",
  },
};

export default function StructuredData({ type, data }: StructuredDataProps) {
  let jsonLd: Record<string, any>;

  switch (type) {
    case "Organization":
      jsonLd = organizationData;
      break;
    case "LocalBusiness":
      jsonLd = localBusinessData;
      break;
    case "WebSite":
      jsonLd = webSiteData;
      break;
    case "WebPage":
      jsonLd = {
        "@context": "https://schema.org",
        "@type": "WebPage",
        ...data,
      };
      break;
    case "Article":
      jsonLd = {
        "@context": "https://schema.org",
        "@type": "Article",
        publisher: { "@type": "Organization", name: "KEI SAIYOU", url: BASE_URL },
        ...data,
      };
      break;
    case "JobPosting":
      jsonLd = {
        "@context": "https://schema.org",
        "@type": "JobPosting",
        hiringOrganization: {
          "@type": "Organization",
          name: "KEI SAIYOU",
          sameAs: BASE_URL,
        },
        ...data,
      };
      break;
    default:
      return null;
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
