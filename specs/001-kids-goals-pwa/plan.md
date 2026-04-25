# Implementation Plan: Kids Goals PWA

**Branch**: `001-kids-goals-pwa` | **Date**: 2026-04-25 | **Spec**: [spec.md](./spec.md)

## Summary

Build a family-oriented Progressive Web App for tracking kids' daily chores, managing rewards and effort levels, and maintaining a point economy. The stack is Next.js 16 (App Router, Server Actions, `proxy.ts` for CSP), Supabase (Auth, PostgreSQL with RLS, Realtime), TanStack (Query, Store, Table), shadcn/ui, with Playwright E2E and Vitest unit/integration testing.

## Technical Context

**Language/Version**: TypeScript 5 — strict mode, no `any`, no `@ts-ignore` without comment
**Primary Dependencies**: Next.js 16.2.4, Supabase JS v2, TanStack Query v5, TanStack Store v0.7, TanStack Table v8, shadcn/ui, Serwist (offline/SW), Vitest, Playwright
**Storage**: Supabase PostgreSQL with RLS on every table
**Testing**: Vitest (unit + integration against local Supabase), Playwright (E2E against seeded local Supabase)
**Target Platform**: PWA — iOS Safari, Android Chrome, desktop browsers
**Project Type**: Web application (Next.js App Router)
**Performance Goals**: Point balance updates visible within 2 seconds (Realtime); kid login + chore flow under 2 minutes
**Constraints**: Offline read-capable via Serwist service worker; nonce-based CSP via `proxy.ts`; no `/api` routes for data; Server Actions only
**Scale/Scope**: Family-scale — O(10) kids per family, O(50) chores, O(1000) activity log entries/month

## Constitution Check

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Next.js Patterns — nonce CSP via proxy.ts | PASS | `proxy.ts` generates per-request nonce; all pages dynamically rendered |
| I. Next.js Patterns — no API routes for data | PASS | All mutations/queries via Server Actions |
| II. Supabase — RLS on all tables | PASS | Every table has RLS policies defined in data-model.md |
| II. Supabase — Auth for both account types | PASS | Parents: email/password; kids: synthetic-email Supabase accounts (see research.md) |
| II. Supabase — Realtime for live data | PASS | Activity log and points subscribe via Supabase Realtime |
| II. Supabase — no Edge Functions | PASS | All logic in Server Actions |
| III. TanStack First — Query for server state | PASS | TanStack Query wraps all server action fetches on client |
| III. TanStack First — Store for UI state | PASS | TanStack Store for local UI state (selected date, modal open state, etc.) |
| III. TanStack First — Table for tabular data | PASS | Activity log rendered via TanStack Table |
| IV. shadcn Components First | PASS | All UI components start from shadcn/ui primitives |
| V. Test Coverage — Playwright E2E | PASS | E2E tests for all 10 user stories |
| V. Test Coverage — Vitest unit | PASS | Unit tests for points calc, penalty logic, effort rewards |
| V. Test Coverage — Integration RLS + actions | PASS | Integration tests against local Supabase |

**No violations. All gates pass.**

## Project Structure

### Documentation (this feature)

```text
specs/001-kids-goals-pwa/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── server-actions.md
└── tasks.md             # Phase 2 output (/speckit-tasks)
```

### Source Code (repository root)

```text
app/
├── (auth)/
│   ├── login/page.tsx           # Parent email/password login
│   └── kid-login/page.tsx       # Kid login: family + name + passcode
├── (dashboard)/
│   ├── layout.tsx               # Shared shell: navbar with points badge
│   ├── page.tsx                 # Today's chore view (kid) / overview (parent)
│   ├── calendar/page.tsx        # Calendar view with End Day markers
│   ├── rewards/page.tsx         # Rewards catalog (kid) / manage rewards (parent)
│   └── activity/page.tsx        # Activity log (TanStack Table)
├── (admin)/
│   ├── layout.tsx
│   ├── kids/page.tsx            # Add/edit kids
│   ├── chores/page.tsx          # Manage chore library + assignments
│   ├── effort/page.tsx          # Manage effort levels
│   └── family/page.tsx          # Family name settings
├── manifest.ts                  # PWA web app manifest
├── layout.tsx                   # Root layout (nonce passed to Script tags)
└── globals.css

lib/
├── actions/                     # Server Actions ('use server')
│   ├── auth.ts                  # Login, logout, kid session
│   ├── chores.ts                # CRUD chore library, assignments
│   ├── day-records.ts           # Check/uncheck chore, rest day, end day
│   ├── rewards.ts               # CRUD rewards, redeem
│   ├── kids.ts                  # CRUD kids
│   └── effort-levels.ts         # CRUD effort levels
├── db/                          # Typed Supabase query helpers
│   ├── families.ts
│   ├── kids.ts
│   ├── chores.ts
│   ├── day-records.ts
│   ├── rewards.ts
│   ├── effort-levels.ts
│   └── activity-log.ts
├── points.ts                    # Pure business logic: penalties, effort rewards
├── supabase/
│   ├── client.ts                # Browser Supabase client
│   └── server.ts                # Server Supabase client (cookies)
└── types.ts                     # Shared TypeScript types

components/
├── ui/                          # shadcn/ui generated components
├── chore-list/                  # ChoreItem, ChoreList
├── calendar/                    # CalendarView, DayCell
├── navbar/                      # PointsBadge, NavBar
├── effort-dropdown/             # EffortDropdown
├── reward-card/                 # RewardCard, RewardsGrid
└── activity-log/                # ActivityLogTable

proxy.ts                         # CSP nonce generation (replaces middleware.ts)
public/
└── sw.js                        # Serwist service worker

__tests__/
├── unit/                        # Vitest: points.ts, penalty logic
├── integration/                 # Vitest + supabase local: RLS, server actions
└── e2e/                         # Playwright: all 10 user story happy/failure paths
```

**Structure Decision**: Standard Next.js App Router with route groups: `(auth)` for unauthenticated pages, `(dashboard)` for the shared kid/parent shell, `(admin)` for parent-only management pages. Server Actions colocated in `lib/actions/`. Business logic in `lib/points.ts` is framework-agnostic for easy unit testing.

## Complexity Tracking

No constitution violations requiring justification.
