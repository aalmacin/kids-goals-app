# Implementation Plan: Fix Inconsistent Reversal

**Branch**: `005-fix-inconsistent-reversal` | **Date**: 2026-05-16 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/005-fix-inconsistent-reversal/spec.md`
**User guidance**: Disable effort feature after ending the day

## Summary

Fix inconsistent reversal behavior across chore unchecking, end-day, and rest-day undo actions (one-undo-per-day rule). Additionally, disable the task (effort) feature after a kid ends the day, making End Day a complete terminal action for all daily point-earning activities.

The core reversal work (T001–T024) is fully implemented. This plan documents the remaining gap: tasks remain interactive after ending the day, allowing kids to earn extra points after declaring their day done.

## Technical Context

**Language/Version**: TypeScript (strict mode, no `any`)
**Primary Dependencies**: Next.js App Router, Supabase, shadcn/ui, TanStack Query/Store
**Storage**: PostgreSQL via Supabase (RLS-enforced)
**Testing**: Vitest (unit/integration), Playwright (E2E)
**Target Platform**: Web (Next.js app)
**Project Type**: Web application (Next.js App Router)
**Performance Goals**: Standard SSR response times; no new DB queries beyond the existing `getOrCreateDayRecord`
**Constraints**: No schema migrations needed — `day_records.ended_at` already exists
**Scale/Scope**: Single-family app; one kid's dashboard per session

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Next.js Patterns (Server Actions, no `/api` for mutations) | PASS | Guard added to existing server action; no new API routes |
| II. Supabase Patterns (RLS, typed client) | PASS | Read `day_records.ended_at` via existing typed Supabase client |
| III. TanStack First | PASS | No new client state; existing patterns unchanged |
| IV. shadcn Components First | PASS | No new custom components needed |
| V. Test Coverage (E2E mandatory for user-facing flows) | PASS | E2E test required for task-locked-after-end-day flow |

No violations. No entries needed in Complexity Tracking.

## Project Structure

### Documentation (this feature)

```text
specs/005-fix-inconsistent-reversal/
├── plan.md              # This file
├── research.md          # Phase 0 output (existing)
├── data-model.md        # Phase 1 output (existing)
├── quickstart.md        # Phase 1 output (existing)
└── tasks.md             # Phase 2 output (existing — T001–T024 all complete)
```

### Source Code (relevant files)

```text
app/(dashboard)/page.tsx                     # Pass isEnded to TaskSection
components/task-list/TaskSection.tsx         # Accept isEnded; hide when ended
lib/actions/tasks.ts                         # Add day-ended guard to completeTaskAction
lib/undo-eligibility.ts                      # Fix canUndoRestDay to include !endedAt
__tests__/unit/undo-eligibility.test.ts      # Add test for canUndoRestDay when ended
__tests__/e2e/task-locked-after-end-day.spec.ts  # New E2E test
```

**Structure Decision**: Single Next.js project. No new files except the E2E test. All changes are additive to existing files.

---

## Phase 0: Research

### Finding 1 — TaskSection remains interactive after ending the day

`app/(dashboard)/page.tsx` renders `<TaskSection>` unconditionally — outside the `{!isEnded}` block. `TaskSection` has no `isEnded` prop. `TaskItem` calls `completeTaskAction` and `undoLastTaskCompletionAction` with no day-ended guard.

**Impact**: Kids can complete repeated tasks and undo task completions after declaring their day done. This is inconsistent with End Day acting as a terminal daily action.

**Fix**: Pass `isEnded` to `TaskSection`; hide the section when the day is ended. Add server-side guard in `completeTaskAction` (and optionally `undoLastTaskCompletionAction`) that checks today's `day_records.ended_at`.

### Finding 2 — Effort dropdown (EffortDropdown) is already correctly disabled

`EndDayButton` (which contains `EffortDropdown`) lives inside `{!isEnded}` in `page.tsx`. No effort selection UI is shown after ending. This is correct; no fix needed.

### Finding 3 — canUndoRestDay missing !endedAt guard

```ts
export function canUndoRestDay(dayRecord: DayRecord, today: string): boolean {
  return (
    dayRecord.isRestDay &&
    dayRecord.undoRestDayCount === 0 &&
    dayRecord.date === today
    // missing: && dayRecord.endedAt === null
  )
}
```

The spec states: "Undo rest day is only available before the day is ended." The UI correctly hides it (inside `!isEnded`), but the eligibility function itself is inconsistent with the spec. Any future caller not wrapped in `!isEnded` would get a wrong result.

**Fix**: Add `&& dayRecord.endedAt === null` to `canUndoRestDay`.

### Decision: No schema changes required

All guards use the existing `day_records.ended_at` column. No migration needed.

---

## Phase 1: Design

### Data model changes

None. `day_records.ended_at` is the existing signal for all new guards.

### Contracts

No new server action signatures. `completeTaskAction(taskId: string)` is unchanged externally; the guard is internal.

### Implementation design

#### 1. `lib/undo-eligibility.ts`

Add `&& dayRecord.endedAt === null` to `canUndoRestDay`:

```ts
export function canUndoRestDay(dayRecord: DayRecord, today: string): boolean {
  return (
    dayRecord.isRestDay &&
    dayRecord.undoRestDayCount === 0 &&
    dayRecord.date === today &&
    dayRecord.endedAt === null
  )
}
```

#### 2. `lib/actions/tasks.ts` — `completeTaskAction`

After fetching the kid, check today's day record:

```ts
// Guard: block task completion after day is ended
const timezone = await getFamilyTimezone(kid.family_id)
const today = todayInTimezone(timezone)
const { data: todayRecord } = await supabase
  .from('day_records')
  .select('ended_at')
  .eq('kid_id', kid.id)
  .eq('date', today)
  .maybeSingle()
if (todayRecord?.ended_at) throw new Error('Cannot complete tasks after ending the day')
```

#### 3. `components/task-list/TaskSection.tsx`

Add `isEnded: boolean` prop. Return `null` when `isEnded`:

```tsx
interface TaskSectionProps {
  tasks: TaskWithCounts[]
  isEnded: boolean
}

export function TaskSection({ tasks, isEnded }: TaskSectionProps) {
  if (isEnded || tasks.length === 0) return null
  // ... rest unchanged
}
```

#### 4. `app/(dashboard)/page.tsx`

Pass `isEnded` to `TaskSection`:

```tsx
<TaskSection tasks={availableTasks.filter((t) => t.taskType === 'repeated')} isEnded={isEnded} />
```

### Agent context update

CLAUDE.md already points to `specs/005-fix-inconsistent-reversal/plan.md` — no change needed.

---

## Post-Design Constitution Check

| Principle | Status |
|-----------|--------|
| I. Next.js Patterns | PASS — server action guard, no new API routes |
| II. Supabase Patterns | PASS — typed client, RLS applies to `day_records` |
| III. TanStack First | PASS — no new state management |
| IV. shadcn Components First | PASS — no new components |
| V. Test Coverage | PASS — unit test for `canUndoRestDay`, E2E test for task-lock flow |
