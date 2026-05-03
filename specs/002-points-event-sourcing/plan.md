# Implementation Plan: Points Event Sourcing & Manual Adjustment

**Branch**: `002-points-event-sourcing` | **Date**: 2026-04-30 | **Spec**: [spec.md](./spec.md)

## Summary

Refactor all point-balance updates to use `activity_log` as the source of truth, with `kids.points` maintained as a read-optimised cache via a Postgres AFTER INSERT trigger. Remove the `apply_points_delta` RPC. Add a `manual_adjustment` event type and a parent-facing inline form on the kids admin page to submit signed point adjustments with an optional reason.

## Technical Context

**Language/Version**: TypeScript 5 — strict mode, no `any`, no `@ts-ignore` without comment
**Primary Dependencies**: Next.js 16.2.4, Supabase JS v2, TanStack Query v5, shadcn/ui, Vitest, Playwright
**Storage**: Supabase PostgreSQL with RLS; new trigger on `activity_log`
**Testing**: Vitest (unit + integration against local Supabase), Playwright (E2E)
**Target Platform**: PWA — iOS Safari, Android Chrome, desktop browsers
**Project Type**: Web application (Next.js App Router)
**Performance Goals**: Balance updates visible within 2 seconds (Realtime — unchanged)
**Constraints**: Server Actions only; no `/api` routes; nonce-based CSP via `proxy.ts`
**Scale/Scope**: Family-scale — O(10) kids, O(1000) activity log entries/month

## Constitution Check

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Next.js Patterns — nonce CSP via proxy.ts | PASS | No proxy changes; existing setup unchanged |
| I. Next.js Patterns — no API routes for data | PASS | `adjustKidPoints` is a Server Action |
| II. Supabase — RLS on all tables | PASS | No new tables; existing RLS policies cover `manual_adjustment` inserts |
| II. Supabase — Auth for both account types | PASS | `adjustKidPoints` requires parent session |
| II. Supabase — Realtime for live data | PASS | Trigger updates `kids.points`; Realtime subscription fires on the kids row update |
| II. Supabase — no Edge Functions | PASS | All logic in Server Actions + DB trigger |
| III. TanStack First — Query for server state | PASS | TanStack Query wraps server action fetches on client |
| III. TanStack First — Store for UI state | PASS | TanStack Store manages adjustment form open/close state |
| IV. shadcn Components First | PASS | Adjustment form uses shadcn Input, Button, Label |
| V. Test Coverage — Playwright E2E | PASS | E2E for parent adjustment happy path + auth failure path |
| V. Test Coverage — Vitest unit | PASS | Unit test: trigger behaviour simulated; points floor at zero |
| V. Test Coverage — Integration RLS + actions | PASS | Integration: `adjustKidPoints` with parent session; reject with kid session |

**No violations. All gates pass.**

## Project Structure

### Documentation (this feature)

```text
specs/002-points-event-sourcing/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   └── server-actions.md
└── tasks.md             # Phase 2 output (/speckit-tasks)
```

### Source Code (modified files)

```text
supabase/migrations/
└── 0006_event_sourcing.sql       # New: trigger, constraint update, seed, drop RPC

lib/
├── types.ts                      # Add 'manual_adjustment' to ActionType union
├── actions/
│   ├── kids.ts                   # Add adjustKidPoints server action
│   ├── day-records.ts            # Remove apply_points_delta RPC calls
│   └── rewards.ts                # Remove apply_points_delta RPC call

app/
└── (admin)/admin/kids/page.tsx   # Add inline adjustment form per kid
```

**Structure Decision**: All changes are additive or simplifications within the existing layout. No new directories or route groups needed.

## Complexity Tracking

No constitution violations requiring justification.
