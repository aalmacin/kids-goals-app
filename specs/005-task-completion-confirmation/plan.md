# Implementation Plan: Task Completion Confirmation

**Branch**: `task-confirmation` | **Date**: 2026-05-15 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `specs/005-task-completion-confirmation/spec.md`

## Summary

Add confirmation dialogs for repeated task completions and all task undo actions (repeated tasks currently complete without confirmation, and undo has no confirmation for any task type). Additionally, separate one-time tasks from the Today page into a dedicated `/tasks` page accessible via the kid nav bar, with available and completed sections.

## Technical Context

**Language/Version**: TypeScript (strict mode)
**Primary Dependencies**: Next.js (App Router, Server Actions), shadcn/ui (AlertDialog), TanStack Query
**Storage**: Supabase PostgreSQL (existing `tasks` and `task_completions` tables)
**Testing**: Vitest (unit/integration), Playwright (E2E)
**Target Platform**: Web (PWA)
**Project Type**: Web application (Next.js)
**Performance Goals**: Standard web app — confirmation interactions under 2 seconds
**Constraints**: Must use existing AlertDialog pattern, Server Actions for mutations
**Scale/Scope**: Small feature — 2 new dialogs, 1 new page, nav bar updates

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Next.js Patterns | PASS | Server Actions for data mutations, new page uses App Router |
| II. Supabase Patterns | PASS | Existing RLS-enabled tables, no new DB access patterns |
| III. TanStack First | PASS | No new client state management needed beyond existing patterns |
| IV. shadcn Components First | PASS | AlertDialog is a shadcn component already in use |
| V. Test Coverage | PASS | E2E tests will be included in tasks.md for all user-facing flows |

No violations. No complexity tracking needed.

## Project Structure

### Documentation (this feature)

```text
specs/005-task-completion-confirmation/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit-tasks command)
```

### Source Code (repository root)

```text
app/
├── (dashboard)/
│   ├── page.tsx              # Today page — MODIFY: remove one-time tasks from TaskSection
│   └── tasks/
│       └── page.tsx          # NEW: One-time tasks page
components/
├── navbar/
│   ├── NavBar.tsx            # MODIFY: add "Tasks" link for kid role
│   └── MobileMenu.tsx        # MODIFY: add "Tasks" link for kid role
├── task-list/
│   ├── TaskItem.tsx          # MODIFY: wrap repeated tasks in AlertDialog, wrap undo in AlertDialog
│   ├── TaskList.tsx           # No changes needed
│   └── TaskSection.tsx        # No changes needed — filtering done in page.tsx before passing tasks
__tests__/
├── e2e/                      # E2E tests for new flows
└── unit/                     # Unit tests if applicable
```

**Structure Decision**: Next.js App Router with `(dashboard)` route group. New `/tasks` page under `app/(dashboard)/tasks/page.tsx`. Components modified in-place.
