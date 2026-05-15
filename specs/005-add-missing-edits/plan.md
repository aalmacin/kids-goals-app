# Implementation Plan: Add Missing Edit UIs

**Branch**: `005-add-missing-edits` | **Date**: 2026-05-15 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/005-add-missing-edits/spec.md`

## Summary

Add edit dialog UIs to the Chore Library and Effort Levels admin pages. Backend update actions (`updateChoreAction`, `updateEffortLevelAction`) already exist — this feature wires them into the UI via dialog components using the existing shadcn Dialog primitive.

## Technical Context

**Language/Version**: TypeScript (strict mode), Next.js 16.2.4
**Primary Dependencies**: React 19, shadcn/ui (Dialog, Input, Label, Button), lucide-react (Pencil icon), IconPicker component
**Storage**: Supabase PostgreSQL (existing `chores` and `effort_levels` tables, no schema changes needed)
**Testing**: Playwright (E2E), Vitest (unit)
**Target Platform**: Web (PWA)
**Project Type**: Web application (Next.js App Router)
**Performance Goals**: N/A (admin UI, low traffic)
**Constraints**: Server components for pages, client components for dialogs (state management for open/close)
**Scale/Scope**: 2 new client components, 2 page edits

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Next.js Patterns | PASS | Uses server actions (no API routes). Dialogs are client components calling server actions directly. |
| II. Supabase Patterns | PASS | No new DB access — reuses existing `updateChore` and `updateEffortLevel` DB helpers with RLS. |
| III. TanStack First | PASS | No new client state management needed — dialog open/close uses local `useState`. Server action + `revalidatePath` handles data refresh. |
| IV. shadcn Components First | PASS | Uses existing shadcn Dialog, Input, Label, Button components. IconPicker is an existing custom component. |
| V. Test Coverage | PASS | E2E tests required for edit flows (happy path + validation failure). |

## Project Structure

### Documentation (this feature)

```text
specs/005-add-missing-edits/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit-tasks)
```

### Source Code (repository root)

```text
components/
├── edit-chore-dialog.tsx          # NEW - Client component with edit dialog for chores
└── edit-effort-level-dialog.tsx   # NEW - Client component with edit dialog for effort levels

app/(admin)/admin/
├── chores/page.tsx                # MODIFIED - Import and render EditChoreDialog
└── effort/page.tsx                # MODIFIED - Import and render EditEffortLevelDialog

lib/actions/
├── chores.ts                      # EXISTING - updateChoreAction (no changes)
└── effort-levels.ts               # EXISTING - updateEffortLevelAction (no changes)
```

**Structure Decision**: Two new client components in `components/` following existing flat component organization. Pages modified minimally to import and render the edit dialogs.

## Complexity Tracking

No constitution violations. No complexity justifications needed.
