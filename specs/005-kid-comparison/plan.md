# Implementation Plan: Family Page

**Branch**: `005-kid-comparison` | **Date**: 2026-05-03 | **Spec**: specs/005-kid-comparison/spec.md
**Input**: Feature specification from `specs/005-kid-comparison/spec.md`

## Summary

Replace the existing `/compare` "sibling comparison" page with a `/family` page that shows all kids in the family (including the logged-in kid) across three sections: leaderboard, daily chore progress, and weekly summary. The primary bug fix is removing the `siblings.length <= 1` guard. The migration from "compare" to "family" involves renaming the DB module, types, components, route, and NavBar link. Real-time updates are added via TanStack Query + Supabase Realtime.

## Technical Context

**Language/Version**: TypeScript (strict mode, no `any`)
**Primary Dependencies**: Next.js 16 App Router, Supabase JS v2, TanStack Query v5, shadcn/ui
**Storage**: Supabase PostgreSQL (existing schema, no migrations needed)
**Testing**: Playwright (E2E), Vitest (unit/integration)
**Target Platform**: Web (Next.js SSR + client hydration)
**Project Type**: Web application
**Performance Goals**: Family page initial load < 2s (SC-001); real-time updates via Supabase Realtime
**Constraints**: No `/api` routes for data; Server Actions only; RLS on all tables; bun only
**Scale/Scope**: Typically ≤ 5 kids per family; all queries are O(n) where n = family size

## Constitution Check

| Principle | Status | Notes |
|-----------|--------|-------|
| I — Next.js (no `/api` for data, Server Actions) | ✅ Pass | Family page is a Server Component; no new API routes |
| II — Supabase RLS + Realtime | ✅ Pass | RLS policies in migration 0007; Realtime subscription for `kids` table |
| III — TanStack Query/Store/Table | ✅ Pass | TanStack Query with `initialData` for client hydration and Realtime invalidation |
| IV — shadcn first | ✅ Pass | Card, Badge, Progress used; no custom primitives |
| V — Playwright E2E + Vitest | ✅ Pass | E2E test covers happy path and auth failure path |

No violations. Complexity Tracking not required.

## Project Structure

### Documentation (this feature)

```text
specs/005-kid-comparison/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit-tasks command)
```

### Source Code (files affected by this feature)

```text
lib/db/
├── family.ts            # NEW: renamed from compare.ts; FamilyMember type, getFamilyMembers()
└── compare.ts           # REMOVE: replaced by family.ts

components/family/
├── Leaderboard.tsx      # MOVE: renamed from components/compare/Leaderboard.tsx
├── DailyProgress.tsx    # MOVE: renamed from components/compare/DailyProgress.tsx
└── WeeklySummary.tsx    # MOVE: renamed from components/compare/WeeklySummary.tsx

components/
└── family/
    └── FamilyPageClient.tsx  # NEW: 'use client' wrapper; TanStack Query + Realtime subscription

app/(dashboard)/
├── family/
│   └── page.tsx         # NEW: Family page server component
└── compare/
    └── page.tsx         # CHANGE: redirect('/family')

components/navbar/
└── NavBar.tsx           # CHANGE: /compare → /family, label "Compare" → "Family"

__tests__/e2e/
└── us11-family-page.spec.ts  # NEW: rename/update from kid-comparison spec
```

## Design Decisions

### Bug Fix: Remove the `siblings.length <= 1` guard

The existing guard in `compare/page.tsx` shows a "no siblings" message when only 1 kid is returned. On the Family page, a single kid is a valid state — the page renders their card. The guard is removed entirely.

### Hybrid Data Fetch

- Server Component fetches `getFamilyMembers`, `getTodayDailyProgress`, `getWeeklyPointsSummary`
- Passes results as `initialData` to `<FamilyPageClient>`
- `FamilyPageClient` uses TanStack Query with `initialData` — zero loading flash
- Supabase Realtime subscription on `kids` UPDATE events filtered by `family_id` invalidates `['familyMembers', familyId]`

### Family Lookup Fallback

If `getFamilyMembers(kid.family_id)` returns empty (RLS issue or data problem), the page falls back to `[{ id: kid.id, name: kid.name, points: kid.points }]` and renders a single-member view.

### No New Migration

Migration `0007_kid_comparison_rls.sql` already contains all required RLS policies. Running `bunx supabase migration up` locally is sufficient.
