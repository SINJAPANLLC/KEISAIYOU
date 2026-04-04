import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import compression from "compression";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer, type IncomingMessage, type ServerResponse } from "http";
import { dbPool, db } from "./db";
import { jobListings, users } from "@shared/schema";
import { eq, desc, sql } from "drizzle-orm";

const app = express();
app.set("trust proxy", 1);

// ── Indeed feed: intercept at raw HTTP level, completely bypassing Express/Vite ──
async function indeedFeedHandler(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
  const u = req.url || "";
  if (!u.startsWith("/feed/indeed.xml")) return false;
  try {
    const activeJobs = await db.select().from(jobListings).where(eq(jobListings.status, "active")).orderBy(desc(jobListings.publishedAt));
    const companyIds = [...new Set(activeJobs.map((j) => j.userId))];
    const companyMap: Record<string, any> = {};
    if (companyIds.length) {
      const companies = await db.select().from(users)
        .where(sql`${users.id} = ANY(${sql.raw(`ARRAY['${companyIds.join("','")}']::varchar[]`)})`);
      for (const c of companies) companyMap[c.id] = c;
    }
    const host = (req.headers["host"] || "localhost") as string;
    const proto = (req.headers["x-forwarded-proto"] || "https") as string;
    const baseUrl = process.env.APP_BASE_URL || `${proto}://${host}`;
    const esc = (s: string) => (s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const jobXml = activeJobs.map((job) => {
      const co = companyMap[job.userId];
      const pub = job.publishedAt ? new Date(job.publishedAt).toISOString() : new Date(job.createdAt).toISOString();
      const area = job.area || "";
      const prefecture = area.replace(/[市区町村郡].+$/, "");
      return `  <job>\n    <title><![CDATA[${esc(job.title)}]]></title>\n    <date>${pub}</date>\n    <referencenumber>${job.id}</referencenumber>\n    <url>${baseUrl}/apply/${job.id}</url>\n    <company><![CDATA[${esc(co?.companyName || "KEI SAIYOU")}]]></company>\n    <city><![CDATA[${esc(area)}]]></city>\n    <state><![CDATA[${esc(prefecture)}]]></state>\n    <country>JP</country>\n    <postalcode>${esc(co?.postalCode || "")}</postalcode>\n    <description><![CDATA[${esc(job.description)}${job.requirements ? "\n\n【応募条件】\n" + esc(job.requirements) : ""}]]></description>\n    <salary><![CDATA[${esc(job.salary)}]]></salary>\n    <jobtype><![CDATA[${esc(job.employmentType)}]]></jobtype>\n  </job>`;
    }).join("\n");
    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<source>\n  <publisher>KEI SAIYOU</publisher>\n  <publisherurl>${baseUrl}</publisherurl>\n  <lastBuildDate>${new Date().toISOString()}</lastBuildDate>\n${jobXml}\n</source>`;
    res.writeHead(200, { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=3600" });
    res.end(xml);
    return true;
  } catch (err) {
    console.error("[feed/indeed.xml raw]", err);
    res.writeHead(500, { "Content-Type": "application/xml" });
    res.end('<?xml version="1.0"?><error>Internal error</error>');
    return true;
  }
}

const httpServer = createServer((req, res) => {
  indeedFeedHandler(req as any, res).then((handled) => {
    if (!handled) app(req as any, res);
  }).catch(() => {
    app(req as any, res);
  });
});

app.use(compression());

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

declare module "express-session" {
  interface SessionData {
    userId: string;
    role: string;
  }
}

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

const PgStore = connectPgSimple(session);

app.use(
  session({
    store: new PgStore({
      pool: dbPool,
      createTableIfMissing: true,
    }),
    secret: process.env.SESSION_SECRET || "keikamotsu-match-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    },
  })
);

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      log(`${req.method} ${path} ${res.statusCode} in ${duration}ms`);
    }
  });

  next();
});

(async () => {
  const { seedDatabase } = await import("./seed");
  try {
    await seedDatabase();
  } catch (e) {
    console.error("Seed error:", e);
  }

  await registerRoutes(httpServer, app);

  const { registerSaiyouRoutes } = await import("./saiyou-routes");
  const runScheduledChecks = registerSaiyouRoutes(app);

  if (process.env.NODE_ENV === "production") {
    setTimeout(async () => {
      try {
        const { scheduleAutoArticleGeneration } = await import("./auto-article-generator");
        scheduleAutoArticleGeneration();
        const { scheduleAutoPublish } = await import("./youtube-auto-publisher");
        scheduleAutoPublish();
        const { scheduleLeadCrawler } = await import("./lead-crawler");
        scheduleLeadCrawler();
        setInterval(runScheduledChecks, 60 * 60 * 1000);
        runScheduledChecks();
      } catch (e) {
        console.error("Scheduler init error:", e);
      }
    }, 10000);
  } else {
    console.log("[Dev] Skipping scheduled tasks in dev mode");
  }

  app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    console.error("Internal Server Error:", err);

    if (res.headersSent) {
      return next(err);
    }

    return res.status(status).json({ message });
  });

  // Catch unmatched /api/ routes — return JSON, never HTML
  app.use("/api", (_req: Request, res: Response) => {
    res.status(404).json({ message: "APIエンドポイントが見つかりません" });
  });

  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      log(`serving on port ${port}`);
    },
  );
})();
