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
- ⬜ ② 不要機能の削除: マッチング機能・案件管理・KEI MATCH固有API
- ⬜ ③ 求人管理: 企業が求人を登録・編集・停止
- ⬜ ④ XMLフィード: GET /feed/indeed.xml
- ⬜ ⑤ 応募受付: POST /api/apply + LINE/メール通知 + Square課金
- ⬜ ⑥ 企業ダッシュボード: 応募者一覧・求人管理・請求履歴
- ⬜ ⑦ アドミン画面: 全企業管理・KPIダッシュボード
- ⬜ ⑧ Square決済: 自動課金・Webhook

### Brand Design
- Primary color: `hsl(22, 88%, 48%)` — warm orange
- Font: Open Sans (extrabold for brand name)
- Logo: Text-based "KEI SAIYOU" (no image logo)
- Pricing: ¥3,000 / 応募通知1件（ベーシックプランのみ）
