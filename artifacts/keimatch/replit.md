# 軽貨物マッチ - 軽貨物案件マッチングプラットフォーム

## Overview
軽貨物マッチは、軽貨物ドライバーと荷主を効率的にマッチングさせる案件マッチングプラットフォームです。軽バン・軽トラックなどの軽貨物車両を活用した配送案件と空き車両のマッチングを最適化し、ラストマイル配送の効率化とコスト削減に貢献します。AIを活用した高度なマッチング機能とユーザーフレンドリーなインターフェースを提供し、軽貨物業界のDXを推進します。

## User Preferences
I prefer clear, concise language in all explanations.
I value an iterative development approach, with frequent communication and opportunities for feedback.
Before implementing any major changes or new features, please describe your proposed approach and await my approval.
Do not make changes to files related to authentication logic without explicit instruction.
Ensure all UI/UX changes align with the established design system (turquoise/teal theme, shadcn/ui).

## System Architecture
**Frontend**: React, TypeScript, Vite, TailwindCSS, shadcn/ui. Navigation: wouter. Data fetching: TanStack Query. Fixed header + fixed left sidebar layout for dashboard pages.

**Backend**: Express.js + TypeScript API with PostgreSQL via Drizzle ORM.

**Authentication**: Session-based with express-session + connect-pg-simple. Passwords hashed with bcrypt. Roles: "user" and "admin". New registrations require admin approval.

**Core Features**:
- **Listing Management**: 軽貨物案件（荷物）と空き車両の登録・管理
- **Vehicle Types**: 軽バン、軽トラック、軽冷凍車、軽冷蔵車、軽ワゴン、バイク便
- **Matching System**: 軽貨物案件と空き車両のマッチング
- **Dispatch Request System**: 配車依頼書の生成・送信
- **Notification System**: アプリ内・メール・LINE通知
- **Admin Dashboard**: ユーザー管理、申請承認、収益管理、コンテンツ管理
- **SEO Column Articles**: 軽貨物関連の自動SEO記事生成
- **Payment Integration**: Square Web Payments SDK
- **YouTube Integration**: 動画取得・表示・自動生成
- **Email Marketing & Lead Crawler**: 軽貨物事業者向けリード生成
- **LP Generation**: ランディングページ作成・公開

**Design System**: Turquoise/teal theme with shadcn/ui components.

## External Dependencies
- PostgreSQL, Square Web Payments SDK, Nodemailer, LINE Messaging API
- bcrypt, multer, Vite, TailwindCSS, shadcn/ui, wouter, TanStack Query
- OpenAI (AI features), googleapis (YouTube)
