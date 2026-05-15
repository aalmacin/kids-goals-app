# Implementation Plan: One-Time and Repeated Tasks — Edit Support

**Branch**: `005-add-missing-edits` | **Date**: 2026-05-15 | **Spec**: `specs/005-one-time-repeated-tasks/spec.md`
**Input**: Feature specification from `/specs/005-one-time-repeated-tasks/spec.md`

## Summary

The core task feature (one-time and repeated tasks with creation, completion, undo, and deletion) is already fully implemented. This plan covers the remaining gap: **task editing** — allowing parents to update a task's name and point value while keeping type, once_per_day, and max_completions immutable after creation. The snapshot pattern already in use ensures edits don't retroactively affect activity log entries.

## Technical Context

**Language/Version**: TypeScript 5 (strict mode)
**Primary Dependencies**: Next.js 16.2.4, React 19.2.4, Supabase JS 2.104.1, TanStack Query 5.100.5, shadcn/ui
**Storage**: Supabase (PostgreSQL) with RLS
**Testing**: Vitest (unit/integration), Playwright (E2E)
**Target Platform**: Web (PWA)
**Project Type**: Web application (Next.js App Router)
**Performance Goals**: Task edit < 1 second round-trip
**Constraints**: RLS-enforced access control, snapshot-based historical data integrity
**Scale/Scope**: Family-scale (< 100 tasks per family)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Next.js Patterns | PASS | Server Actions for mutations, no API routes |
| II. Supabase Patterns | PASS | RLS on tasks table, typed client, real-time for activity log |
| III. TanStack First | PASS | TanStack Query for data fetching, TanStack Store for UI state |
| IV. shadcn Components First | PASS | Edit dialog/form will use shadcn Dialog, Input, Button, Select |
| V. Test Coverage | PASS | E2E test tasks will be included in tasks.md |

No violations. No complexity tracking needed.

## Project Structure

### Documentation (this feature)

```text
specs/005-one-time-repeated-tasks/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit-tasks command)
```

### Source Code (repository root)

```text
app/
├── (admin)/admin/tasks/page.tsx          # Task management page (add edit UI)
├── (dashboard)/page.tsx                  # Kid dashboard (no changes needed)

lib/
├── actions/tasks.ts                      # Add updateTaskAction
├── db/tasks.ts                           # Add updateTask query
├── types.ts                              # No changes (Task type already correct)

components/
├── admin/
│   ├── CreateTaskForm.tsx                # Existing (no changes)
│   └── EditTaskDialog.tsx                # NEW: Edit dialog component

supabase/
└── migrations/
    └── 0015_task_edit_rls.sql            # UPDATE RLS policy for tasks (if needed)
```

**Structure Decision**: Single Next.js app with Supabase backend. New code is minimal — one new component, one new server action, one new DB function, and potentially one migration for UPDATE RLS policy.

## Complexity Tracking

No constitution violations to justify.
