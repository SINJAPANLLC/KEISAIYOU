import type { Express, Request, Response } from "express";
import { db } from "./db";
import { eq, desc, and, sql, lt } from "drizzle-orm";
import {
  jobListings,
  applications,
  users,
  notifications,
  emailLeads,
  emailCampaigns,
  payments,
  refundRequests,
  contactInquiries,
} from "@shared/schema";
import { sendEmail } from "./notification-service";
import { chargeSquareCard } from "./square";
import bcrypt from "bcrypt";

function requireAuth(req: Request, res: Response, next: Function) {
  if (!req.session?.userId) return res.status(401).json({ message: "ログインが必要です" });
  next();
}

function requireAdmin(req: Request, res: Response, next: Function) {
  if (!req.session?.userId) return res.status(401).json({ message: "ログインが必要です" });
  if (req.session?.role !== "admin") return res.status(403).json({ message: "権限がありません" });
  next();
}

export function registerSaiyouRoutes(app: Express) {

  // ─── Sidebar badge counts ────────────────────────────────────────────────
  app.get("/api/sidebar-badges", requireAuth, async (req, res) => {
    try {
      const isAdmin = req.session?.role === "admin";
      const userId = req.session!.userId;

      if (isAdmin) {
        const [[pendingUsers], [pendingJobs], [newApps], [unreadInquiries], [pendingRefunds]] = await Promise.all([
          db.select({ count: sql<number>`count(*)::int` }).from(users).where(eq(users.approved, false)),
          db.select({ count: sql<number>`count(*)::int` }).from(jobListings).where(eq(jobListings.status, "pending")),
          db.select({ count: sql<number>`count(*)::int` }).from(applications).where(eq(applications.reviewStatus, "new")),
          db.select({ count: sql<number>`count(*)::int` }).from(contactInquiries).where(eq(contactInquiries.status, "unread")),
          db.select({ count: sql<number>`count(*)::int` }).from(refundRequests).where(eq(refundRequests.status, "pending")),
        ]);
        res.json({
          "/admin/users":              pendingUsers.count || 0,
          "/admin/listings":           pendingJobs.count || 0,
          "/admin/applications":       newApps.count || 0,
          "/admin/contact-inquiries":  unreadInquiries.count || 0,
          "/admin/refund-requests":    pendingRefunds.count || 0,
        });
      } else {
        const myJobs = await db.select({ id: jobListings.id }).from(jobListings).where(eq(jobListings.userId, userId));
        const jobIds = myJobs.map((j) => j.id);
        let newCount = 0;
        if (jobIds.length > 0) {
          const [row] = await db.select({ count: sql<number>`count(*)::int` }).from(applications)
            .where(and(
              sql`${applications.jobId} = ANY(${sql.raw(`ARRAY['${jobIds.join("','")}']::varchar[]`)})`,
              eq(applications.reviewStatus, "new"),
            ));
          newCount = row?.count || 0;
        }
        res.json({ "/applications": newCount });
      }
    } catch (err) {
      console.error("[sidebar-badges]", err);
      res.json({});
    }
  });

  // ─── Registration (overrides old route behaviour) ───────────────────────
  // Patch: set approved=true so companies can log in immediately.
  // The actual POST /api/register is in routes.ts; we override it here:
  app.post("/api/saiyou/register", async (req, res) => {
    try {
      const { companyName, contactName, email, phone, prefecture, password } = req.body;
      if (!companyName || !email || !phone || !password) {
        return res.status(400).json({ message: "必須項目を入力してください" });
      }
      const existing = await db.select().from(users).where(eq(users.email, email));
      if (existing.length > 0) {
        return res.status(400).json({ message: "このメールアドレスは既に登録されています" });
      }
      const hashed = await bcrypt.hash(password, 10);
      const [user] = await db.insert(users).values({
        username: email,
        email,
        password: hashed,
        companyName,
        contactName: contactName || "",
        phone,
        prefecture,
        userType: "carrier",
        role: "user",
        approved: true,
      }).returning();
      const { password: _, ...safeUser } = user;
      req.session.userId = user.id;
      req.session.role = user.role;
      res.status(201).json(safeUser);
    } catch (err: any) {
      console.error("[saiyou/register]", err);
      res.status(500).json({ message: "登録に失敗しました" });
    }
  });

  // ─── Job Listings (company) ─────────────────────────────────────────────
  app.get("/api/jobs", requireAuth, async (req, res) => {
    try {
      const jobs = await db
        .select()
        .from(jobListings)
        .where(eq(jobListings.userId, req.session!.userId!))
        .orderBy(desc(jobListings.createdAt));
      res.json(jobs);
    } catch (err) {
      res.status(500).json({ message: "求人一覧の取得に失敗しました" });
    }
  });

  app.post("/api/jobs", requireAuth, async (req, res) => {
    try {
      const { title, jobCategory, employmentType, salary, area, description, requirements, workHours, holidays, benefits, monthlyLimit } = req.body;
      if (!title || !employmentType || !salary || !area || !description) {
        return res.status(400).json({ message: "必須項目を入力してください" });
      }
      const [job] = await db.insert(jobListings).values({
        userId: req.session!.userId!,
        title,
        jobCategory: jobCategory || null,
        employmentType,
        salary,
        area,
        description,
        requirements: requirements || "",
        workHours: workHours || null,
        holidays: holidays || null,
        benefits: benefits || null,
        monthlyLimit: parseInt(monthlyLimit) || 30000,
        status: "pending",
      }).returning();

      // Notify admin
      const admins = await db.select().from(users).where(eq(users.role, "admin"));
      for (const admin of admins) {
        await db.insert(notifications).values({
          userId: admin.id,
          type: "job_applied",
          title: "掲載申請",
          message: `新しい求人「${title}」の掲載申請があります`,
          relatedId: job.id,
        });
      }
      res.status(201).json(job);
    } catch (err) {
      console.error("[jobs/create]", err);
      res.status(500).json({ message: "求人の作成に失敗しました" });
    }
  });

  app.get("/api/jobs/:id", requireAuth, async (req, res) => {
    try {
      const [job] = await db.select().from(jobListings).where(eq(jobListings.id, req.params.id));
      if (!job) return res.status(404).json({ message: "求人が見つかりません" });
      if (job.userId !== req.session!.userId && req.session?.role !== "admin") {
        return res.status(403).json({ message: "権限がありません" });
      }
      res.json(job);
    } catch {
      res.status(500).json({ message: "取得に失敗しました" });
    }
  });

  app.put("/api/jobs/:id", requireAuth, async (req, res) => {
    try {
      const { title, jobCategory, employmentType, salary, area, description, requirements, workHours, holidays, benefits, monthlyLimit, status } = req.body;
      const [existing] = await db.select().from(jobListings).where(eq(jobListings.id, req.params.id));
      if (!existing) return res.status(404).json({ message: "求人が見つかりません" });
      if (existing.userId !== req.session!.userId && req.session?.role !== "admin") {
        return res.status(403).json({ message: "権限がありません" });
      }
      const updateData: any = { updatedAt: new Date() };
      if (title) updateData.title = title;
      if (jobCategory !== undefined) updateData.jobCategory = jobCategory || null;
      if (employmentType) updateData.employmentType = employmentType;
      if (salary) updateData.salary = salary;
      if (area) updateData.area = area;
      if (description) updateData.description = description;
      if (requirements !== undefined) updateData.requirements = requirements;
      if (workHours !== undefined) updateData.workHours = workHours || null;
      if (holidays !== undefined) updateData.holidays = holidays || null;
      if (benefits !== undefined) updateData.benefits = benefits || null;
      if (monthlyLimit) updateData.monthlyLimit = parseInt(monthlyLimit);
      if (status && req.session?.role === "admin") updateData.status = status;
      if (status === "paused" || status === "closed") updateData.status = status;
      const [updated] = await db.update(jobListings).set(updateData).where(eq(jobListings.id, req.params.id)).returning();
      res.json(updated);
    } catch (err) {
      console.error("[jobs/update]", err);
      res.status(500).json({ message: "更新に失敗しました" });
    }
  });

  app.delete("/api/jobs/:id", requireAuth, async (req, res) => {
    try {
      const [existing] = await db.select().from(jobListings).where(eq(jobListings.id, req.params.id));
      if (!existing) return res.status(404).json({ message: "求人が見つかりません" });
      if (existing.userId !== req.session!.userId && req.session?.role !== "admin") {
        return res.status(403).json({ message: "権限がありません" });
      }
      await db.delete(jobListings).where(eq(jobListings.id, req.params.id));
      res.json({ success: true });
    } catch {
      res.status(500).json({ message: "削除に失敗しました" });
    }
  });

  // ─── Applications (company views their applicants) ──────────────────────
  app.get("/api/jobs/:id/applications", requireAuth, async (req, res) => {
    try {
      const [job] = await db.select().from(jobListings).where(eq(jobListings.id, req.params.id));
      if (!job) return res.status(404).json({ message: "求人が見つかりません" });
      if (job.userId !== req.session!.userId && req.session?.role !== "admin") {
        return res.status(403).json({ message: "権限がありません" });
      }
      const apps = await db
        .select()
        .from(applications)
        .where(eq(applications.jobId, req.params.id))
        .orderBy(desc(applications.createdAt));
      res.json(apps);
    } catch {
      res.status(500).json({ message: "取得に失敗しました" });
    }
  });

  app.get("/api/my/applications", requireAuth, async (req, res) => {
    try {
      const myJobs = await db.select().from(jobListings).where(eq(jobListings.userId, req.session!.userId!));
      if (!myJobs.length) return res.json([]);
      const jobIds = myJobs.map((j) => j.id);
      const apps = await db
        .select({
          id: applications.id,
          jobId: applications.jobId,
          name: applications.name,
          phone: applications.phone,
          email: applications.email,
          gender: applications.gender,
          birthDate: applications.birthDate,
          address: applications.address,
          workHistory: applications.workHistory,
          resumeUrl: applications.resumeUrl,
          message: applications.message,
          memo: applications.memo,
          paymentStatus: applications.paymentStatus,
          viewable: applications.viewable,
          reviewStatus: applications.reviewStatus,
          createdAt: applications.createdAt,
        })
        .from(applications)
        .where(sql`${applications.jobId} = ANY(${sql.raw(`ARRAY['${jobIds.join("','")}']::varchar[]`)})`)
        .orderBy(desc(applications.createdAt));
      // Enrich with job title
      const jobMap = Object.fromEntries(myJobs.map((j) => [j.id, j.title]));
      const enriched = apps.map((a) => ({ ...a, jobTitle: jobMap[a.jobId] || "" }));
      res.json(enriched);
    } catch (err) {
      console.error("[my/applications]", err);
      res.status(500).json({ message: "取得に失敗しました" });
    }
  });

  // Update monthly limit (会社単位)
  app.patch("/api/user/monthly-limit", requireAuth, async (req, res) => {
    try {
      const { monthlyLimit } = req.body;
      if (!monthlyLimit || isNaN(Number(monthlyLimit))) {
        return res.status(400).json({ message: "無効な値です" });
      }
      await db.update(users)
        .set({ monthlyLimit: Number(monthlyLimit) })
        .where(eq(users.id, req.session!.userId!));
      res.json({ success: true });
    } catch {
      res.status(500).json({ message: "更新に失敗しました" });
    }
  });

  // Update application review status (企業が応募者ステータスを変更)
  app.patch("/api/applications/:id/review-status", requireAuth, async (req, res) => {
    try {
      const { status } = req.body;
      const VALID_STATUSES = ["new", "contacted", "interviewing", "hired", "rejected"];
      if (!VALID_STATUSES.includes(status)) {
        return res.status(400).json({ message: "無効なステータスです" });
      }
      // Verify the application belongs to this user's job
      const [app_] = await db.select().from(applications).where(eq(applications.id, req.params.id));
      if (!app_) return res.status(404).json({ message: "応募が見つかりません" });
      const [job] = await db.select().from(jobListings).where(eq(jobListings.id, app_.jobId));
      if (!job || (job.userId !== req.session!.userId && req.session?.role !== "admin")) {
        return res.status(403).json({ message: "権限がありません" });
      }
      const [updated] = await db.update(applications).set({ reviewStatus: status }).where(eq(applications.id, req.params.id)).returning();
      res.json(updated);
    } catch {
      res.status(500).json({ message: "更新に失敗しました" });
    }
  });

  // Update application memo
  app.patch("/api/applications/:id/memo", requireAuth, async (req, res) => {
    try {
      const { memo } = req.body;
      const [app_] = await db.select().from(applications).where(eq(applications.id, req.params.id));
      if (!app_) return res.status(404).json({ message: "応募が見つかりません" });
      const [job] = await db.select().from(jobListings).where(eq(jobListings.id, app_.jobId));
      if (!job || (job.userId !== req.session!.userId && req.session?.role !== "admin")) {
        return res.status(403).json({ message: "権限がありません" });
      }
      const [updated] = await db.update(applications).set({ memo: memo || null }).where(eq(applications.id, req.params.id)).returning();
      res.json(updated);
    } catch {
      res.status(500).json({ message: "メモの保存に失敗しました" });
    }
  });

  // ─── Refund Requests ─────────────────────────────────────────────────────

  // Company submits a refund request
  app.post("/api/applications/:id/refund-request", requireAuth, async (req, res) => {
    try {
      const { reason, detail } = req.body;
      if (!reason) return res.status(400).json({ message: "理由を選択してください" });
      const [app_] = await db.select().from(applications).where(eq(applications.id, req.params.id));
      if (!app_) return res.status(404).json({ message: "応募が見つかりません" });
      const [job] = await db.select().from(jobListings).where(eq(jobListings.id, app_.jobId));
      if (!job || job.userId !== req.session!.userId) return res.status(403).json({ message: "権限がありません" });
      // Check not already requested
      const existing = await db.select().from(refundRequests)
        .where(and(eq(refundRequests.applicationId, req.params.id), eq(refundRequests.status, "pending")));
      if (existing.length) return res.status(409).json({ message: "すでに返金申請中です" });
      const [rr] = await db.insert(refundRequests).values({
        applicationId: req.params.id,
        companyUserId: req.session!.userId!,
        reason,
        detail: detail || null,
        refundAmount: 3000,
      }).returning();
      // Notify admins
      const admins = await db.select().from(users).where(eq(users.role, "admin"));
      for (const admin of admins) {
        await db.insert(notifications).values({
          userId: admin.id,
          type: "system",
          title: "返金申請",
          message: `「${app_.name}」への返金申請が届きました（理由: ${reason}）`,
          relatedId: rr.id,
        });
      }
      res.status(201).json(rr);
    } catch (err) {
      console.error("[refund/create]", err);
      res.status(500).json({ message: "返金申請に失敗しました" });
    }
  });

  // Company: check if refund request already exists for an application
  app.get("/api/applications/:id/refund-request", requireAuth, async (req, res) => {
    try {
      const [rr] = await db.select().from(refundRequests)
        .where(eq(refundRequests.applicationId, req.params.id))
        .orderBy(desc(refundRequests.createdAt));
      res.json(rr || null);
    } catch {
      res.status(500).json({ message: "取得に失敗しました" });
    }
  });

  // Admin: list all refund requests
  app.get("/api/admin/refund-requests", requireAuth, async (req, res) => {
    try {
      if (req.session?.role !== "admin") return res.status(403).json({ message: "権限がありません" });
      const rows = await db.select().from(refundRequests).orderBy(desc(refundRequests.createdAt));
      // Enrich with application + company info
      const enriched = await Promise.all(rows.map(async (rr) => {
        const [app_] = await db.select().from(applications).where(eq(applications.id, rr.applicationId));
        const [company] = app_ ? await db.select().from(users).where(eq(users.id, rr.companyUserId)) : [null];
        return {
          ...rr,
          applicantName: app_?.name || "削除済",
          companyName: company?.companyName || company?.email || "不明",
        };
      }));
      res.json(enriched);
    } catch (err) {
      console.error("[refund/admin/list]", err);
      res.status(500).json({ message: "取得に失敗しました" });
    }
  });

  // Admin: approve or reject a refund request
  app.patch("/api/admin/refund-requests/:id", requireAuth, async (req, res) => {
    try {
      if (req.session?.role !== "admin") return res.status(403).json({ message: "権限がありません" });
      const { status, adminNote } = req.body;
      if (!["approved", "rejected"].includes(status)) return res.status(400).json({ message: "無効なステータスです" });
      const [updated] = await db.update(refundRequests)
        .set({ status, adminNote: adminNote || null, resolvedAt: new Date() })
        .where(eq(refundRequests.id, req.params.id))
        .returning();
      if (!updated) return res.status(404).json({ message: "申請が見つかりません" });
      // Notify the company user
      await db.insert(notifications).values({
        userId: updated.companyUserId,
        type: "system",
        title: status === "approved" ? "返金申請が承認されました" : "返金申請が却下されました",
        message: status === "approved"
          ? `返金申請が承認されました。¥3,000（税別）を返金処理します。${adminNote ? `\n管理者メモ: ${adminNote}` : ""}`
          : `返金申請が却下されました。${adminNote ? `理由: ${adminNote}` : ""}`,
        relatedId: updated.id,
      });
      res.json(updated);
    } catch (err) {
      console.error("[refund/admin/patch]", err);
      res.status(500).json({ message: "更新に失敗しました" });
    }
  });

  // Billing history for current user (会社単位の月次上限)
  app.get("/api/my/billing", requireAuth, async (req, res) => {
    try {
      const [company] = await db.select({ monthlyLimit: users.monthlyLimit }).from(users).where(eq(users.id, req.session!.userId!));
      const companyMonthlyLimit = company?.monthlyLimit ?? 30000;
      const myJobs = await db.select().from(jobListings).where(eq(jobListings.userId, req.session!.userId!));
      const jobMap = Object.fromEntries(myJobs.map((j) => [j.id, j]));
      if (!myJobs.length) return res.json({ history: [], monthlyTotal: 0, monthlyLimit: companyMonthlyLimit });
      const jobIds = myJobs.map((j) => j.id);
      const apps = await db.select().from(applications)
        .where(sql`${applications.jobId} = ANY(${sql.raw(`ARRAY['${jobIds.join("','")}']::varchar[]`)})`)
        .orderBy(desc(applications.createdAt));
      const now = new Date();
      const thisMonth = apps.filter((a) => {
        const d = new Date(a.createdAt);
        return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
      });
      const monthlyTotal = thisMonth.filter((a) => a.paymentStatus === "paid" || a.paymentStatus === "success").length * 3300;
      const history = apps.map((a) => ({
        id: a.id,
        applicantName: a.name,
        jobTitle: jobMap[a.jobId]?.title || "",
        amount: 3300,
        status: a.paymentStatus,
        squarePaymentId: a.squarePaymentId,
        chargedAt: a.createdAt,
      }));
      res.json({ history, monthlyTotal, monthlyLimit: companyMonthlyLimit });
    } catch (err) {
      console.error("[my/billing]", err);
      res.status(500).json({ message: "取得に失敗しました" });
    }
  });

  // ─── Public: Application form ───────────────────────────────────────────
  app.get("/api/public/jobs/:id", async (req, res) => {
    try {
      const [job] = await db.select({
        id: jobListings.id,
        title: jobListings.title,
        employmentType: jobListings.employmentType,
        salary: jobListings.salary,
        area: jobListings.area,
        description: jobListings.description,
        requirements: jobListings.requirements,
        status: jobListings.status,
      }).from(jobListings).where(and(eq(jobListings.id, req.params.id), eq(jobListings.status, "active")));
      if (!job) return res.status(404).json({ message: "求人が見つかりません" });
      res.json(job);
    } catch {
      res.status(500).json({ message: "取得に失敗しました" });
    }
  });

  app.post("/api/apply", async (req, res) => {
    try {
      const { jobId, name, phone, email, licenseType, hasBlackNumber, availableAreas, message } = req.body;
      if (!jobId || !name || !phone || !email) {
        return res.status(400).json({ message: "必須項目を入力してください" });
      }

      const [job] = await db.select().from(jobListings).where(eq(jobListings.id, jobId));
      if (!job) return res.status(404).json({ message: "求人が見つかりません" });
      if (job.status !== "active") return res.status(400).json({ message: "この求人は現在受付中ではありません" });

      const [company] = await db.select().from(users).where(eq(users.id, job.userId));

      // 会社単位の月次上限チェック
      const companyMonthlyLimit = company?.monthlyLimit ?? 30000;
      if (companyMonthlyLimit < 9999999) {
        const companyJobs = await db.select({ id: jobListings.id }).from(jobListings).where(eq(jobListings.userId, job.userId));
        const companyJobIds = companyJobs.map((j) => j.id);
        if (companyJobIds.length > 0) {
          const now = new Date();
          const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
          const paidThisMonth = await db.select({ count: sql<number>`count(*)` }).from(applications)
            .where(sql`${applications.jobId} = ANY(${sql.raw(`ARRAY['${companyJobIds.join("','")}']::varchar[]`)}) AND (${applications.paymentStatus} = 'paid' OR ${applications.paymentStatus} = 'success') AND ${applications.createdAt} >= ${monthStart}`);
          const companyMonthlyTotal = (Number(paidThisMonth[0]?.count) || 0) * 3300;
          if (companyMonthlyTotal >= companyMonthlyLimit) {
            return res.status(400).json({ message: "今月の上限金額に達しています。設定から上限を変更してください。" });
          }
        }
      }

      // Insert application
      const [app_] = await db.insert(applications).values({
        jobId,
        name,
        phone,
        email,
        licenseType: licenseType || null,
        hasBlackNumber: hasBlackNumber === true || hasBlackNumber === "true",
        availableAreas: availableAreas || null,
        message: message || null,
        paymentStatus: "pending",
        viewable: false,
      }).returning();

      // Charge ¥3,300（¥3,000税別）via Square
      let paymentStatus = "failed";
      let paymentId: string | undefined;

      try {
        if (company?.squareCustomerId && company?.squareCardId) {
          const result = await chargeSquareCard({
            customerId: company.squareCustomerId,
            cardId: company.squareCardId,
            amountYen: 3300,
            note: `KEI SAIYOU応募通知 - ${job.title} - ${name}`,
          });
          paymentId = result.paymentId;
          paymentStatus = result.status === "COMPLETED" ? "success" : "failed";
        } else {
          // No card on file – still save application, mark payment as failed
          console.log("[apply] No Square card on file for company", company?.id);
          paymentStatus = "failed";
        }
      } catch (payErr: any) {
        console.error("[apply] Payment error:", payErr.message);
        paymentStatus = "failed";
      }

      const viewable = paymentStatus === "success";
      await db.update(applications).set({
        paymentStatus,
        squarePaymentId: paymentId || null,
        viewable,
      }).where(eq(applications.id, app_.id));

      // Update job monthly spend (追跡用) + 会社単位の上限到達でアクティブ求人を全停止
      if (viewable) {
        await db.update(jobListings).set({
          monthlySpent: job.monthlySpent + 3300,
          lastApplicationAt: new Date(),
          updatedAt: new Date(),
        }).where(eq(jobListings.id, jobId));

        // 会社の今月合計が上限に達したら全求人をpauseに
        if (companyMonthlyLimit < 9999999) {
          const companyJobs2 = await db.select({ id: jobListings.id }).from(jobListings).where(eq(jobListings.userId, job.userId));
          const companyJobIds2 = companyJobs2.map((j) => j.id);
          if (companyJobIds2.length > 0) {
            const now2 = new Date();
            const monthStart2 = new Date(now2.getFullYear(), now2.getMonth(), 1);
            const paidCount = await db.select({ count: sql<number>`count(*)` }).from(applications)
              .where(sql`${applications.jobId} = ANY(${sql.raw(`ARRAY['${companyJobIds2.join("','")}']::varchar[]`)}) AND (${applications.paymentStatus} = 'paid' OR ${applications.paymentStatus} = 'success') AND ${applications.createdAt} >= ${monthStart2}`);
            const newTotal = (Number(paidCount[0]?.count) || 0) * 3300;
            if (newTotal >= companyMonthlyLimit) {
              await db.update(jobListings).set({ status: "paused", updatedAt: new Date() })
                .where(sql`${jobListings.userId} = ${job.userId} AND ${jobListings.status} = 'active'`);
            }
          }
        }
      }

      // Notify company via system notification
      await db.insert(notifications).values({
        userId: company.id,
        type: "application",
        title: viewable ? "新しい応募があります" : "応募がありましたが決済に失敗しました",
        message: viewable
          ? `「${job.title}」に${name}様から応募がありました。ダッシュボードでご確認ください。`
          : `「${job.title}」に応募がありましたが、決済処理に失敗しました。カード情報をご確認ください。`,
        relatedId: app_.id,
      });

      // Send emails (background)
      setImmediate(async () => {
        const appBaseUrl = process.env.APP_BASE_URL || "https://kei-saiyou.jp";
        if (viewable && company?.email) {
          await sendEmail(
            company.email,
            `【KEI SAIYOU】「${job.title}」に新しい応募が届きました`,
            `${company.contactName || company.companyName} 様\n\n「${job.title}」に新しい応募がありました。\n\nダッシュボードから応募者の詳細をご確認ください。\n${appBaseUrl}/home\n\n─\nKEI SAIYOU`
          ).catch((e) => console.error("[apply] email error:", e));
        } else if (!viewable && company?.email) {
          await sendEmail(
            company.email,
            `【KEI SAIYOU】決済失敗のお知らせ`,
            `${company.contactName || company.companyName} 様\n\n「${job.title}」への応募がありましたが、決済処理に失敗しました。\n\nお手数ですが、ダッシュボードからカード情報をご更新ください。\n${appBaseUrl}/settings\n\n─\nKEI SAIYOU`
          ).catch((e) => console.error("[apply] email error:", e));
        }
      });

      res.json({
        success: true,
        applicationId: app_.id,
        paymentStatus,
        viewable,
      });
    } catch (err: any) {
      console.error("[apply]", err);
      res.status(500).json({ message: "応募の送信に失敗しました" });
    }
  });

  // ─── Indeed XML Feed ────────────────────────────────────────────────────
  app.get("/feed/indeed.xml", async (req, res) => {
    try {
      const activeJobs = await db
        .select()
        .from(jobListings)
        .where(eq(jobListings.status, "active"))
        .orderBy(desc(jobListings.publishedAt));

      const companyIds = [...new Set(activeJobs.map((j) => j.userId))];
      const companyMap: Record<string, typeof users.$inferSelect> = {};
      if (companyIds.length) {
        const companies = await db.select().from(users).where(sql`${users.id} = ANY(${sql.raw(`ARRAY['${companyIds.join("','")}']::varchar[]`)})`);
        for (const c of companies) companyMap[c.id] = c;
      }

      const appBaseUrl = process.env.APP_BASE_URL || `https://${req.get("host")}`;

      const jobXml = activeJobs.map((job) => {
        const co = companyMap[job.userId];
        const pub = job.publishedAt ? new Date(job.publishedAt).toISOString() : new Date(job.createdAt).toISOString();
        const area = job.area || "";
        const prefecture = area.replace(/[市区町村郡].+$/, "");
        const esc = (s: string) => (s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

        return `  <job>
    <title><![CDATA[${esc(job.title)}]]></title>
    <date>${pub}</date>
    <referencenumber>${job.id}</referencenumber>
    <url>${appBaseUrl}/apply/${job.id}</url>
    <company><![CDATA[${esc(co?.companyName || "KEI SAIYOU掲載企業")}]]></company>
    <city><![CDATA[${esc(area)}]]></city>
    <state><![CDATA[${esc(prefecture)}]]></state>
    <country>JP</country>
    <postalcode>${esc(co?.postalCode || "")}</postalcode>
    <description><![CDATA[${esc(job.description)}${job.requirements ? "\n\n【応募条件】\n" + esc(job.requirements) : ""}]]></description>
    <salary><![CDATA[${esc(job.salary)}]]></salary>
    <jobtype><![CDATA[${esc(job.employmentType)}]]></jobtype>
  </job>`;
      }).join("\n");

      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<source>
  <publisher>KEI SAIYOU</publisher>
  <publisherurl>${appBaseUrl}</publisherurl>
  <lastBuildDate>${new Date().toISOString()}</lastBuildDate>
${jobXml}
</source>`;

      res.set("Content-Type", "application/xml; charset=utf-8");
      res.set("Cache-Control", "public, max-age=3600");
      res.send(xml);
    } catch (err) {
      console.error("[feed/indeed.xml]", err);
      res.status(500).send("<?xml version=\"1.0\"?><error>Internal error</error>");
    }
  });

  // ─── Admin: Job approval ────────────────────────────────────────────────
  app.get("/api/admin/jobs", requireAdmin, async (_req, res) => {
    try {
      const jobs = await db.select().from(jobListings).orderBy(desc(jobListings.createdAt));
      const companyIds = [...new Set(jobs.map((j) => j.userId))];
      const companyMap: Record<string, string> = {};
      if (companyIds.length) {
        const companies = await db.select({ id: users.id, companyName: users.companyName }).from(users).where(sql`${users.id} = ANY(${sql.raw(`ARRAY['${companyIds.join("','")}']::varchar[]`)})`);
        for (const c of companies) companyMap[c.id] = c.companyName;
      }
      const result = jobs.map((j) => ({ ...j, companyName: companyMap[j.userId] || "不明" }));
      res.json(result);
    } catch (err) {
      res.status(500).json({ message: "取得に失敗しました" });
    }
  });

  app.patch("/api/admin/jobs/:id/approve", requireAdmin, async (req, res) => {
    try {
      const [job] = await db.select().from(jobListings).where(eq(jobListings.id, req.params.id));
      if (!job) return res.status(404).json({ message: "求人が見つかりません" });
      const [updated] = await db.update(jobListings).set({
        status: "active",
        publishedAt: new Date(),
        updatedAt: new Date(),
      }).where(eq(jobListings.id, req.params.id)).returning();
      // Notify the company
      await db.insert(notifications).values({
        userId: job.userId,
        type: "job_approved",
        title: "求人がINDEEDに掲載されました",
        message: `「${job.title}」の審査が完了し、INDEEDへの掲載が開始されました。`,
        relatedId: job.id,
      });
      // Send email if configured
      try {
        const [company] = await db.select({ email: users.email, companyName: users.companyName })
          .from(users).where(eq(users.id, job.userId));
        if (company?.email) {
          await sendEmail({
            to: company.email,
            subject: `【KEI SAIYOU】求人「${job.title}」がINDEEDに掲載されました`,
            text: `${company.companyName} 様\n\n求人「${job.title}」の審査が完了し、INDEEDへの掲載が開始されました。\n\n応募が届き次第、マイページの「応募者一覧」でご確認いただけます。\n\n──\nKEI SAIYOU 運営事務局`,
          });
        }
      } catch (emailErr) {
        console.warn("[approve] email send failed:", emailErr);
      }
      res.json({ ...updated, indeedPublished: true });
    } catch {
      res.status(500).json({ message: "承認に失敗しました" });
    }
  });

  app.patch("/api/admin/jobs/:id/reject", requireAdmin, async (req, res) => {
    try {
      const [updated] = await db.update(jobListings).set({
        status: "closed",
        updatedAt: new Date(),
      }).where(eq(jobListings.id, req.params.id)).returning();
      if (!updated) return res.status(404).json({ message: "求人が見つかりません" });
      res.json(updated);
    } catch {
      res.status(500).json({ message: "却下に失敗しました" });
    }
  });

  app.patch("/api/admin/jobs/:id/pause", requireAdmin, async (req, res) => {
    try {
      const [updated] = await db.update(jobListings).set({
        status: "paused",
        updatedAt: new Date(),
      }).where(eq(jobListings.id, req.params.id)).returning();
      if (!updated) return res.status(404).json({ message: "求人が見つかりません" });
      res.json(updated);
    } catch {
      res.status(500).json({ message: "停止に失敗しました" });
    }
  });

  app.put("/api/admin/jobs/:id", requireAdmin, async (req, res) => {
    try {
      const { title, jobCategory, employmentType, area, salary, workHours, holidays, description, requirements, benefits, monthlyLimit } = req.body;
      const [updated] = await db.update(jobListings).set({
        ...(title !== undefined && { title }),
        ...(jobCategory !== undefined && { jobCategory }),
        ...(employmentType !== undefined && { employmentType }),
        ...(area !== undefined && { area }),
        ...(salary !== undefined && { salary }),
        ...(workHours !== undefined && { workHours }),
        ...(holidays !== undefined && { holidays }),
        ...(description !== undefined && { description }),
        ...(requirements !== undefined && { requirements }),
        ...(benefits !== undefined && { benefits }),
        ...(monthlyLimit !== undefined && { monthlyLimit: Number(monthlyLimit) }),
        updatedAt: new Date(),
      }).where(eq(jobListings.id, req.params.id)).returning();
      if (!updated) return res.status(404).json({ message: "求人が見つかりません" });
      res.json(updated);
    } catch {
      res.status(500).json({ message: "更新に失敗しました" });
    }
  });

  // ─── Admin: Sales leads ─────────────────────────────────────────────────
  app.get("/api/admin/sales/leads", requireAdmin, async (_req, res) => {
    try {
      const leads = await db.select().from(emailLeads).orderBy(desc(emailLeads.createdAt));
      res.json(leads);
    } catch {
      res.status(500).json({ message: "取得に失敗しました" });
    }
  });

  app.post("/api/admin/sales/leads", requireAdmin, async (req, res) => {
    try {
      const rows: any[] = req.body;
      if (!Array.isArray(rows) || !rows.length) {
        return res.status(400).json({ message: "データが空です" });
      }
      const inserted = await db.insert(emailLeads).values(
        rows.map((r: any) => ({
          companyName: r.companyName || r.company_name || "不明",
          email: r.email || null,
          phone: r.phone || null,
          website: r.website || null,
          address: r.address || null,
          industry: r.industry || "軽貨物",
          source: r.source || "manual",
          status: "new",
        }))
      ).returning();
      res.json({ inserted: inserted.length });
    } catch (err: any) {
      console.error("[sales/leads]", err);
      res.status(500).json({ message: "インポートに失敗しました" });
    }
  });

  app.delete("/api/admin/sales/leads/:id", requireAdmin, async (req, res) => {
    try {
      await db.delete(emailLeads).where(eq(emailLeads.id, req.params.id));
      res.json({ success: true });
    } catch {
      res.status(500).json({ message: "削除に失敗しました" });
    }
  });

  app.post("/api/admin/sales/crawl", requireAdmin, async (req, res) => {
    try {
      const { prefecture, keyword, limit = 20 } = req.body;
      if (!prefecture || !keyword) return res.status(400).json({ message: "都道府県とキーワードを入力してください" });
      const { searchDuckDuckGoForUrls, crawlLeadsFromUrl } = await import("./lead-crawler");
      const query = `${prefecture} ${keyword} 軽貨物`;
      const urls = await searchDuckDuckGoForUrls(query);
      let found = 0;
      const maxUrls = Math.min(urls.length, Math.ceil(limit / 2));
      for (let i = 0; i < maxUrls; i++) {
        try {
          const n = await crawlLeadsFromUrl(urls[i]);
          found += n;
          if (found >= limit) break;
          await new Promise((r) => setTimeout(r, 500));
        } catch { /* continue */ }
      }
      res.json({ searched: urls.length, found });
    } catch (err: any) {
      console.error("[sales/crawl]", err);
      res.status(500).json({ message: "クロールに失敗しました" });
    }
  });

  app.post("/api/admin/sales/send", requireAdmin, async (req, res) => {
    try {
      const { leadIds, subject, body } = req.body;
      if (!leadIds?.length || !subject || !body) {
        return res.status(400).json({ message: "送信対象・件名・本文を入力してください" });
      }
      const leads = await db.select().from(emailLeads).where(sql`${emailLeads.id} = ANY(${sql.raw(`ARRAY['${leadIds.join("','")}']::varchar[]`)})`);
      const withEmail = leads.filter((l) => l.email);
      let sentCount = 0;
      let failedCount = 0;
      for (const lead of withEmail) {
        try {
          const personalizedBody = body
            .replace(/{{companyName}}/g, lead.companyName)
            .replace(/{{company_name}}/g, lead.companyName);
          await sendEmail(lead.email!, subject, personalizedBody);
          await db.update(emailLeads).set({ status: "sent", sentAt: new Date(), sentSubject: subject }).where(eq(emailLeads.id, lead.id));
          sentCount++;
        } catch {
          failedCount++;
        }
      }
      res.json({ sentCount, failedCount, total: withEmail.length });
    } catch (err: any) {
      console.error("[sales/send]", err);
      res.status(500).json({ message: "送信に失敗しました" });
    }
  });

  // ─── Admin: Dashboard stats ─────────────────────────────────────────────
  app.get("/api/admin/stats", requireAdmin, async (_req, res) => {
    try {
      const allUsers = await db.select().from(users).where(sql`${users.role} != 'admin'`);
      const allJobs = await db.select().from(jobListings);
      const allApps = await db.select().from(applications);
      const now = new Date();
      const thisMonthApps = allApps.filter((a) => {
        const d = new Date(a.createdAt);
        return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
      });
      const isPaid = (a: any) => a.paymentStatus === "paid" || a.paymentStatus === "success";
      const paidApps = allApps.filter(isPaid);
      const thisMonthPaid = thisMonthApps.filter(isPaid);
      const totalRevenue = paidApps.length * 3300;
      const monthlyRevenue = thisMonthPaid.length * 3300;
      const unpaidCompanies = [...new Set(allApps.filter((a) => a.paymentStatus === "failed").map((a) => {
        const job = allJobs.find((j) => j.id === a.jobId);
        return job?.userId;
      }).filter(Boolean))].length;
      const activeCompanies = [...new Set(allJobs.filter((j) => j.status === "active").map((j) => j.userId))].length;
      // Area breakdown
      const areaMap: Record<string, number> = {};
      for (const j of allJobs.filter((j) => j.status === "active")) {
        const pref = j.area?.split(/[都道府県市区]/)[0] || "その他";
        areaMap[pref] = (areaMap[pref] || 0) + 1;
      }
      // Recent applications enriched
      const recentApps = allApps.slice(0, 10).map((a) => {
        const job = allJobs.find((j) => j.id === a.jobId);
        const company = allUsers.find((u) => u.id === job?.userId);
        return { ...a, jobTitle: job?.title || "", companyName: company?.companyName || "" };
      });
      // Recent companies
      const recentCompanies = allUsers.slice(-8).reverse().map((u) => ({
        id: u.id, companyName: u.companyName, email: u.email, prefecture: u.prefecture,
        approved: u.approved, createdAt: u.createdAt,
        monthlyApps: thisMonthApps.filter((a) => {
          const job = allJobs.find((j) => j.id === a.jobId);
          return job?.userId === u.id;
        }).length,
      }));
      res.json({
        totalRevenue, monthlyRevenue, totalApps: allApps.length, monthlyApps: thisMonthApps.length,
        activeCompanies, totalCompanies: allUsers.length,
        pendingCompanies: allUsers.filter((u) => !u.approved).length,
        pendingJobs: allJobs.filter((j) => j.status === "pending").length,
        unpaidCompanies, activeJobs: allJobs.filter((j) => j.status === "active").length,
        areaMap, recentApps, recentCompanies,
      });
    } catch (err) {
      console.error("[admin/stats]", err);
      res.status(500).json({ message: "取得に失敗しました" });
    }
  });

  // Admin: Revenue stats
  app.get("/api/admin/revenue-stats", requireAdmin, async (_req, res) => {
    try {
      const allJobs = await db.select().from(jobListings);
      const allApps = await db.select().from(applications);
      const allUsers = await db.select({ id: users.id, companyName: users.companyName }).from(users);
      // Monthly breakdown (last 6 months)
      const monthly: Record<string, { revenue: number; apps: number }> = {};
      for (const a of allApps.filter((a) => a.paymentStatus === "paid" || a.paymentStatus === "success")) {
        const d = new Date(a.createdAt);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        if (!monthly[key]) monthly[key] = { revenue: 0, apps: 0 };
        monthly[key].revenue += 3300;
        monthly[key].apps += 1;
      }
      // Company breakdown
      const companyMap: Record<string, { companyName: string; paidApps: number; failedApps: number }> = {};
      for (const a of allApps) {
        const job = allJobs.find((j) => j.id === a.jobId);
        if (!job) continue;
        const user = allUsers.find((u) => u.id === job.userId);
        const uid = job.userId;
        if (!companyMap[uid]) companyMap[uid] = { companyName: user?.companyName || "不明", paidApps: 0, failedApps: 0 };
        if (a.paymentStatus === "paid" || a.paymentStatus === "success") companyMap[uid].paidApps += 1;
        if (a.paymentStatus === "failed") companyMap[uid].failedApps += 1;
      }
      const companies = Object.entries(companyMap).map(([id, v]) => ({
        userId: id, companyName: v.companyName,
        revenue: v.paidApps * 3300, paidApps: v.paidApps, failedApps: v.failedApps,
      })).sort((a, b) => b.revenue - a.revenue);
      res.json({ monthly, companies });
    } catch (err) {
      console.error("[admin/revenue-stats]", err);
      res.status(500).json({ message: "取得に失敗しました" });
    }
  });

  // Admin: Force stop company
  app.post("/api/admin/users/:id/force-stop", requireAdmin, async (req, res) => {
    try {
      await db.update(jobListings).set({ status: "paused", updatedAt: new Date() }).where(eq(jobListings.userId, req.params.id));
      res.json({ success: true });
    } catch {
      res.status(500).json({ message: "強制停止に失敗しました" });
    }
  });

  // Admin: Get applications enriched with job + company info
  app.get("/api/admin/applications", requireAdmin, async (_req, res) => {
    try {
      const allJobs = await db.select().from(jobListings);
      const allUsers = await db.select({ id: users.id, companyName: users.companyName }).from(users);
      const apps = await db.select().from(applications).orderBy(desc(applications.createdAt));
      const enriched = apps.map((a) => {
        const job = allJobs.find((j) => j.id === a.jobId);
        const user = allUsers.find((u) => u.id === job?.userId);
        return { ...a, jobTitle: job?.title || "", companyName: user?.companyName || "" };
      });
      res.json(enriched);
    } catch {
      res.status(500).json({ message: "取得に失敗しました" });
    }
  });

  // Admin: Retry payment for failed application
  app.post("/api/admin/applications/:id/retry-payment", requireAdmin, async (req, res) => {
    try {
      const [application] = await db.select().from(applications).where(eq(applications.id, req.params.id)).limit(1);
      if (!application) return res.status(404).json({ message: "応募が見つかりません" });
      const [job] = await db.select().from(jobListings).where(eq(jobListings.id, application.jobId)).limit(1);
      if (!job) return res.status(404).json({ message: "求人が見つかりません" });
      const [company] = await db.select().from(users).where(eq(users.id, job.userId)).limit(1);
      if (!company?.squareCustomerId || !company?.squareCardId) {
        return res.status(400).json({ message: "カード情報が登録されていません" });
      }
      const result = await chargeSquareCard({
        customerId: company.squareCustomerId,
        cardId: company.squareCardId,
        amountYen: 3300,
        note: `KEI SAIYOU 応募通知（再試行） - ${job.title}`,
      });
      const success = result.status === "COMPLETED";
      if (success) {
        await db.update(applications).set({ paymentStatus: "paid", updatedAt: new Date() }).where(eq(applications.id, req.params.id));
      }
      res.json({ success });
    } catch {
      res.status(500).json({ message: "再試行に失敗しました" });
    }
  });

  // Admin: Update lead with prefecture
  app.patch("/api/admin/sales/leads/:id", requireAdmin, async (req, res) => {
    try {
      const { status, prefecture } = req.body;
      const update: any = {};
      if (status) update.status = status;
      if (prefecture !== undefined) update.prefecture = prefecture;
      const [updated] = await db.update(emailLeads).set(update).where(eq(emailLeads.id, req.params.id)).returning();
      res.json(updated);
    } catch {
      res.status(500).json({ message: "更新に失敗しました" });
    }
  });

  // ─── Square: save card ──────────────────────────────────────────────────
  app.post("/api/square/save-card", requireAuth, async (req, res) => {
    try {
      const { sourceId } = req.body;
      if (!sourceId) return res.status(400).json({ message: "sourceIdが必要です" });
      const [user] = await db.select().from(users).where(eq(users.id, req.session!.userId!));
      if (!user) return res.status(404).json({ message: "ユーザーが見つかりません" });

      const { createSquareCustomer, saveSquareCard, isSquareConfigured } = await import("./square");
      if (!isSquareConfigured()) {
        return res.json({ message: "Square未設定（テスト環境）", customerId: null, cardId: null });
      }
      let customerId = user.squareCustomerId;
      if (!customerId) {
        customerId = await createSquareCustomer({
          email: user.email,
          companyName: user.companyName,
          contactName: user.contactName || undefined,
          phone: user.phone,
        });
        if (!customerId) throw new Error("Customer creation failed");
        await db.update(users).set({ squareCustomerId: customerId }).where(eq(users.id, user.id));
      }
      const cardId = await saveSquareCard({ customerId, sourceId });
      if (!cardId) throw new Error("Card save failed");
      await db.update(users).set({ squareCardId: cardId }).where(eq(users.id, user.id));
      res.json({ customerId, cardId, message: "カード情報を保存しました" });
    } catch (err: any) {
      console.error("[square/save-card]", err);
      res.status(500).json({ message: err.message || "カード保存に失敗しました" });
    }
  });

  app.get("/api/square/config", (req, res) => {
    res.json({
      applicationId: process.env.SQUARE_APPLICATION_ID || "",
      locationId: process.env.SQUARE_LOCATION_ID || "",
      environment: process.env.SQUARE_ENV === "production" ? "production" : "sandbox",
    });
  });

  app.get("/api/square/status", requireAuth, async (req, res) => {
    try {
      const [user] = await db.select({ squareCustomerId: users.squareCustomerId, squareCardId: users.squareCardId, squareCardLast4: users.squareCardId }).from(users).where(eq(users.id, req.session!.userId!));
      res.json({
        hasCard: !!(user?.squareCustomerId && user?.squareCardId),
        customerId: user?.squareCustomerId,
        cardId: user?.squareCardId,
      });
    } catch {
      res.status(500).json({ message: "取得に失敗しました" });
    }
  });

  // ─── Scheduled jobs (called from index.ts) ──────────────────────────────
  // Auto-pause jobs that have reached monthly limit or have 0 applications in 2 weeks
  return async function runScheduledChecks() {
    try {
      // 1. Reset monthly_spent at start of each month (check if any need resetting)
      const now = new Date();
      if (now.getDate() === 1) {
        await db.update(jobListings).set({ monthlySpent: 0 }).where(eq(jobListings.status, "active"));
        console.log("[schedule] Monthly spend reset");
      }

      // 2. Auto-pause jobs at monthly limit (safety check)
      await db.update(jobListings).set({ status: "paused", updatedAt: new Date() }).where(
        and(
          eq(jobListings.status, "active"),
          sql`${jobListings.monthlySpent} >= ${jobListings.monthlyLimit}`
        )
      );

      // 3. Auto-pause jobs with 0 applications in 14 days
      const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
      const staleJobs = await db.select().from(jobListings).where(
        and(
          eq(jobListings.status, "active"),
          lt(jobListings.publishedAt, twoWeeksAgo),
          sql`(${jobListings.lastApplicationAt} IS NULL OR ${jobListings.lastApplicationAt} < ${twoWeeksAgo})`
        )
      );
      for (const job of staleJobs) {
        await db.update(jobListings).set({ status: "paused", updatedAt: new Date() }).where(eq(jobListings.id, job.id));
        const admins = await db.select().from(users).where(eq(users.role, "admin"));
        for (const admin of admins) {
          await db.insert(notifications).values({
            userId: admin.id,
            type: "job_stale",
            title: "2週間応募ゼロ",
            message: `「${job.title}」が2週間応募ゼロのため自動停止しました。原稿を見直してください。`,
            relatedId: job.id,
          });
        }
      }
      if (staleJobs.length) console.log(`[schedule] Paused ${staleJobs.length} stale jobs`);
    } catch (err) {
      console.error("[schedule] Error:", err);
    }
  };
}
