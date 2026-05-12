# Implementation Plan: One-Time and Repeated Tasks

**Branch**: `005-one-time-repeated-tasks` | **Date**: 2026-05-12 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/005-one-time-repeated-tasks/spec.md`

## Summary

Add one-time tasks (completable once per kid, with confirmation dialog) and repeated tasks (unlimited or capped completions) to Kids Goals. Each completion awards points through the existing event-sourced `activity_log` trigger. Parents manage tasks via a new `/admin/tasks` page (with a navbar link); kids complete tasks from their dashboard.

## Technical Context

**Language/Version**: TypeScript 5.x (strict, no `any`)
**Primary Dependencies**: Next.js App Router + Server Actions, Supabase JS v2, shadcn/ui (AlertDialog, Card, Badge, Button, Input, Label, Select), TanStack Query (for any client-side caching needed), Vitest, Playwright
**Storage**: Supabase PostgreSQL — two new tables: `tasks`, `task_completions`
**Testing**: Vitest (unit + integration with local Supabase), Playwright (E2E)
**Target Platform**: Web (Next.js full-stack)
**Project Type**: web-service / full-stack Next.js app
**Performance Goals**: Task completion feedback within 1 second; standard web latency
**Constraints**: RLS on all new tables; Server Actions only for mutations; no `/api` routes for data; shadcn/ui components first
**Scale/Scope**: Small family app (~1–10 kids per family)

## Constitution Check

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Next.js Patterns | ✅ Pass | All mutations via Server Actions. No `/api` routes introduced. |
| II. Supabase Patterns | ✅ Pass | RLS enabled on `tasks` and `task_completions`. Auth unchanged. Activity log event-sourcing preserved. |
| III. TanStack First | ✅ Pass | No custom fetch hooks. Client state via `useTransition` (same pattern as existing ChoreItem). TanStack Query used if client-side task list refresh is needed. |
| IV. shadcn Components First | ✅ Pass | `AlertDialog` for confirmation, `Card`/`Button`/`Badge`/`Input`/`Label`/`Select` for task CRUD UI. |
| V. Test Coverage | ✅ Pass | E2E tests for one-time and repeated task happy paths + failure paths. Unit tests for completion guard logic. Integration tests for RLS and server action contracts. |

## Project Structure

### Documentation (this feature)

```text
specs/005-one-time-repeated-tasks/
├── plan.md              ← this file
├── research.md          ← Phase 0 decisions
├── data-model.md        ← Phase 1 schema + types
├── quickstart.md        ← Phase 1 setup guide
├── contracts/
│   └── server-actions.md  ← Phase 1 action contracts
└── tasks.md             ← Phase 2 output (/speckit-tasks)
```

### Source Code

```text
app/
├── (admin)/admin/
│   ├── layout.tsx              ← add "Tasks" nav link
│   └── tasks/
│       └── page.tsx            ← new: task CRUD page
└── (dashboard)/
    └── page.tsx                ← add tasks section

components/
└── task-list/
    ├── TaskItem.tsx            ← new: kid task item with AlertDialog
    └── TaskList.tsx            ← new: task list wrapper

lib/
├── actions/
│   └── tasks.ts                ← new: server actions (parent + kid)
├── db/
│   └── tasks.ts                ← new: DB query functions
├── types.ts                    ← add Task, TaskCompletion types; extend ActivityLogEntry
└── database.types.ts           ← add tasks, task_completions table types

supabase/migrations/
└── 0007_tasks.sql              ← new: tasks + task_completions tables, RLS, action_type update

__tests__/
├── e2e/
│   ├── one-time-task.spec.ts   ← new
│   └── repeated-task.spec.ts   ← new
├── integration/
│   └── tasks.test.ts           ← new: RLS + server action tests
└── unit/
    └── task-completion-guard.test.ts  ← new: completion guard logic
```

## Complexity Tracking

No constitution violations.
