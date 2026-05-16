# Implementation Plan: Fix Inconsistent Reversal

**Branch**: `005-fix-inconsistent-reversal` | **Date**: 2026-05-16 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/005-fix-inconsistent-reversal/spec.md`
**User guidance**: Chore uncheck limits, hide tasks after End Day, remove Undo Day and Effort Levels

## Summary

Fix inconsistent reversal behavior: limit chore unchecking to once per day, and make End Day a complete terminal action (tasks hidden, completion blocked server-side). The Undo End Day, Undo Rest Day, and Effort Levels features were removed on 2026-05-16.

All implementation is complete (T001–T031).

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

### Source Code (key files)

```text
app/(dashboard)/page.tsx                          # Pass isEnded to TaskSection; removed effort fetching
components/task-list/TaskSection.tsx              # Accept isEnded; hide when ended
lib/actions/tasks.ts                              # Add day-ended guard to completeTaskAction
lib/undo-eligibility.ts                           # canUncheckChore only (undo day functions removed)
__tests__/unit/undo-eligibility.test.ts           # canUncheckChore tests only
__tests__/e2e/task-locked-after-end-day.spec.ts   # E2E: tasks hidden after End Day
```

**Removed files**: `UndoEndDayButton.tsx`, `UndoRestDayButton.tsx`, `EffortDropdown.tsx`, `lib/actions/effort-levels.ts`, `lib/db/effort-levels.ts`, `app/(admin)/admin/effort/`, undo day E2E and integration tests.

---

## Phase 0: Research

### Finding 1 — TaskSection remains interactive after ending the day

`app/(dashboard)/page.tsx` renders `<TaskSection>` unconditionally — outside the `{!isEnded}` block. `TaskSection` has no `isEnded` prop. `TaskItem` calls `completeTaskAction` with no day-ended guard.

**Fix**: Pass `isEnded` to `TaskSection`; hide the section when the day is ended. Add server-side guard in `completeTaskAction` that checks today's `day_records.ended_at`.

### Decision: No schema changes required

All guards use the existing `day_records.ended_at` column.

---

## Phase 1: Design

### Data model changes

None. `day_records.ended_at` is the existing signal for all guards.

### Contracts

`completeTaskAction(taskId: string)` — unchanged signature; guard is internal. `endDay(dayRecordId: string)` — `effortLevelId` parameter removed.

### Implementation design

#### 1. `lib/actions/tasks.ts` — `completeTaskAction`

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

#### 2. `components/task-list/TaskSection.tsx`

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

#### 3. `app/(dashboard)/page.tsx`

Pass `isEnded` to `TaskSection`:

```tsx
<TaskSection tasks={availableTasks.filter((t) => t.taskType === 'repeated')} isEnded={isEnded} />
```

---

## Post-Design Constitution Check

| Principle | Status |
|-----------|--------|
| I. Next.js Patterns | PASS — server action guard, no new API routes |
| II. Supabase Patterns | PASS — typed client, RLS applies to `day_records` |
| III. TanStack First | PASS — no new state management |
| IV. shadcn Components First | PASS — no new components |
| V. Test Coverage | PASS — E2E test for task-lock flow |
