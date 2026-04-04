# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

## KEI SAIYOU Application

Located in `artifacts/keimatch/` — 軽貨物特化の採用プラットフォーム (Light cargo-focused recruitment platform).

Rebranded from KEI MATCH (cargo matching) → **KEI SAIYOU** (light cargo driver recruitment).

### Tech Stack
- React + Vite (frontend, wouter routing, TanStack Query)
- Express 5 (backend)
- PostgreSQL + Drizzle ORM
- Tailwind CSS + shadcn/ui
- Session-based auth (bcrypt + passport-local)
- TypeScript

### Running
- Workflow: "artifacts/keimatch: keimatch" (PORT=3000)
- Dev command: `PORT=3000 NODE_ENV=development /home/runner/.npm/_npx/fd45a72a545557e9/node_modules/.bin/tsx /home/runner/workspace/artifacts/keimatch/server/index.ts`
- DB schema push: `cd artifacts/keimatch && npx drizzle-kit push`
- Preview path: `/` (root)

### Build Progress
- ✅ ① ブランド変更: KEI MATCH → KEI SAIYOU (colors, header, footer, home, login, register, terms)
- ✅ ② DBスキーマ拡張: job_listings (jobCategory, workHours, holidays, benefits, requiresLicense/BlackNumber/Vehicle/Experience), applications (reviewStatus), emailLeads (prefecture)
- ✅ ③ バックエンドAPI: /api/apply, /api/jobs, /api/my/billing, /api/admin/stats, /api/admin/revenue-stats, /api/admin/applications, /api/admin/users/:id/force-stop, PATCH /api/admin/sales/leads/:id, retry-payment
- ✅ ④ XMLフィード: GET /feed/indeed.xml (Indeed自動連携)
- ✅ ⑤ 応募受付: POST /api/apply + LINE/メール通知 + Square課金 (¥3,000/応募)
- ✅ ⑥ 企業ページ: dashboard, jobs (新フィールド追加), applications, payment (課金履歴・上限設定), user-settings (都道府県・パスワード変更・退会申請)
- ✅ ⑦ 管理ページ: admin-dashboard, admin-revenue, admin-indeed-feed, admin-users (force-stop), admin-listings, admin-applications (求職者応募管理), admin-email-marketing (prefecture), admin-notifications, admin-settings
- ✅ ⑧ Square決済: 自動課金・Webhook・再試行（カード登録なしの場合はモックモード）

### Admin Credentials
- Email: `info@sinjapan.jp`
- Password: `Kazuya8008`

### Key APIs (saiyou-routes.ts)
- POST /api/apply/:jobId — 応募受付 (¥3,000 Square課金)
- GET /api/jobs — 企業の求人一覧
- GET /api/my/applications — 企業への全応募
- GET/PATCH /api/user/monthly-limit — 上限金額管理
- GET /api/my/billing — 課金履歴
- GET /api/admin/stats — KPIダッシュボード
- GET /api/admin/revenue-stats — 収益詳細
- POST /api/admin/users/:id/force-stop — 強制停止
- GET /api/admin/applications — 全応募管理
- POST /api/admin/applications/:id/retry-payment — 決済再試行
- GET /feed/indeed.xml — Indeed XMLフィード

### Brand Design
- Primary color: `hsl(22, 88%, 48%)` — warm orange
- Font: Open Sans (extrabold for brand name)
- Logo: Text-based "KEI SAIYOU" (no image logo)
- Pricing: ¥3,000 / 応募通知1件（ベーシックプランのみ）
