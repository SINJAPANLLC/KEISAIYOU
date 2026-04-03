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

## KeiMatch Application

Located in `artifacts/keimatch/` — 軽貨物案件マッチングサービス (Light cargo job matching service).

### Tech Stack
- React + Vite (frontend)
- Express 5 (backend)
- PostgreSQL + Drizzle ORM
- Tailwind CSS + shadcn/ui
- Session-based auth (bcrypt + passport-local)
- TypeScript

### Running
- Dev server: `cd artifacts/keimatch && NODE_ENV=development /home/runner/.npm/_npx/fd45a72a545557e9/node_modules/.bin/tsx server/index.ts`
- Workflow: "Start application" (port 5000)
- DB schema push: `cd artifacts/keimatch && npx drizzle-kit push`

### Features
- Cargo job listings (案件管理)
- Truck listings (車両管理)
- User/company registration
- Admin dashboard
- Email notifications
- Column articles
- YouTube video integration
