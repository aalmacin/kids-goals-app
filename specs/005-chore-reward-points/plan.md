# Implementation Plan: Chore Completion Reward Points

**Branch**: `005-chore-reward-points` | **Date**: 2026-05-12 | **Spec**: specs/005-chore-reward-points/spec.md

## Summary

Enable parents to assign reward points to chores. When a kid completes a chore at End Day, points are credited to their balance and logged as a `chore_completion_reward` activity event. Includes three bug fixes: EffortDropdown UUID display (FR-014), penalty badge zero-value display, and edit-form reward update failure (FR-015).

## Technical Context

**Language/Version**: TypeScript / Next.js 16.2.4 (App Router, Turbopack)
**Primary Dependencies**: @base-ui/react 1.4.1, Supabase (PostgreSQL + RLS), @serwist/next
**Storage**: Supabase PostgreSQL — `chores.reward_points`, `chore_completions.reward_snapshot`, `activity_log.action_type`
**Testing**: Vitest (unit + integration), Playwright (E2E)
**Target Platform**: Web — iOS/Android PWA via Serwist
**Project Type**: Web application (Next.js full-stack)
**Performance Goals**: Standard web app; no special latency targets
**Constraints**: RLS enforced on all tables; `after_activity_log_insert` trigger auto-recalculates `kids.points`
**Scale/Scope**: Family-scale (< 10 kids per family)

## Constitution Check

- Single project structure: PASS
- Minimal dependencies: PASS — no new dependencies added
- Server Actions pattern: PASS — consistent with existing codebase
- RLS: PASS — parent_all_chores policy covers all chore mutations

## Project Structure

### Documentation (this feature)

```text
specs/005-chore-reward-points/
├── plan.md              # This file
├── research.md          # Base UI, Supabase, Next.js patterns
├── data-model.md        # Schema changes and type mappings
├── quickstart.md        # Manual verification flows
└── tasks.md             # Full task list (T001–T027)
```

### Source Code (repository root)

```text
app/(admin)/admin/chores/page.tsx    # Chore library UI — Add + Edit forms
lib/actions/chores.ts                # Server Actions: createChoreAction, updateChoreAction
lib/actions/day-records.ts           # endDay, undoEndDay — reward event insertion
lib/db/chores.ts                     # createChore, updateChore — DB layer
lib/db/day-records.ts                # getOrCreateDayRecord — reward_snapshot seeding
lib/points.ts                        # calculateChoreRewards helper
lib/types.ts                         # Chore, ChoreCompletion, ActivityLogEntry types
lib/database.types.ts                # Supabase generated types
components/chore-list/ChoreItem.tsx  # Kid dashboard chore tile — reward badge
components/effort-dropdown/          # EffortDropdown — UUID display fix (T025)
components/activity-log/             # ActivityLogTable — chore_completion_reward label
supabase/migrations/
├── 0011_chore_reward_points.sql     # reward_points + reward_snapshot columns
└── 0012_reward_reversal_event_type.sql
```

**Structure Decision**: Single Next.js project. No new directories. All changes are additive to existing files.

## Implementation Status

### Completed Tasks (T001–T026)

All core feature tasks are complete:

- **T001–T003**: Migration and type layer
- **T004–T007**: US1 — Configure reward points on chore (parent library UI)
- **T008–T013**: US2 — Earn reward points at End Day
- **T014**: US3 — Activity log display
- **T015**: E2E coverage
- **T016–T024**: US4 — Undo End Day reversal + phantom points fix (FR-013)
- **T025**: EffortDropdown UUID display bug fix (FR-014)
- **T026**: Penalty badge zero-value display fix

### Bug Fix Under Investigation: Edit Form Reward Update (FR-015)

**Symptom**: Editing a chore's Reward Points via the edit form and clicking Save does not persist the new value — the badge does not appear after page refresh.

**Code investigation findings**:

- `updateChoreAction` (`lib/actions/chores.ts:56`): correctly reads `reward = Number(formData.get('reward') ?? 0)` and passes `reward_points: reward` to `updateChore`
- `updateChore` (`lib/db/chores.ts:42`): correctly sends `reward_points` in the Supabase `.update()` call; `if (error) throw error` ensures failures propagate
- `<Input name="reward">` (`app/(admin)/admin/chores/page.tsx:141`): verified that `@base-ui/react/input` (wraps `Field.Control`) correctly forwards `name` prop to the native `<input>` — `name = fieldName ?? nameProp` where `fieldName` is `undefined` (no `Field.Root` parent), so `nameProp = "reward"` is used
- RLS policy `parent_all_chores`: `FOR ALL` — parent can update any chore in their family
- Type definitions in `lib/database.types.ts`: `reward_points` present in `Update` type

**Root cause**: Two-layer problem:
1. **Environment**: The `supabase_db_kids-goals` container is not running locally. If the migration (`0011_chore_reward_points.sql`) has not been applied to the connected database (local or remote), Supabase returns a DB error (`column "reward_points" does not exist`). The Server Action throws, but in some Turbopack + Next.js 16.x configurations the error is swallowed at the client level — the form appears to submit without visible feedback.
2. **UX gap**: The edit form has no inline error/success feedback. When the server action fails, users see the form reset with no indication of failure. The only visible indicator of success is the `+N pts` badge appearing in the chore list — absence of the badge signals failure but without explanation.

**Fix (T027)**:
- `updateChoreAction` now returns `{ error: string | null; savedAt: number }` with try/catch and `console.error` logging
- `ChoreEditForm` client component owns the `<details>` wrapper and uses `useActionState`; on success it closes the panel via `detailsRef.current.open = false` and calls `router.refresh()` to re-fetch server component data (required because `revalidatePath` alone does not trigger an immediate re-render when called from a `useActionState` action)
- `ChoreScheduleEditor` button renamed to "Save Schedule"; edit form button is "Save Changes"
