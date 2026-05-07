# Tasks: Chore Day Scheduling

**Input**: Design documents from `/specs/005-schedule-chore-days/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/server-actions.md, quickstart.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)

## Path Conventions

Repository root layout (Next.js App Router, see plan.md for full structure):
- `lib/` — server-side logic, db helpers, server actions
- `components/` — React components
- `app/` — Next.js pages and layouts
- `supabase/migrations/` — Supabase SQL migration files
- `__tests__/` — unit, integration, E2E tests

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Install missing UI primitives and create the database migration.

- [x] T001 Install shadcn ToggleGroup component via `npx shadcn@latest add toggle-group` (adds `components/ui/toggle-group.tsx` and `components/ui/toggle.tsx`)
- [x] T002 [P] Create database migration `supabase/migrations/0007_chore_allowed_days.sql` with `ALTER TABLE chores ADD COLUMN allowed_days smallint[] NULL` and `ALTER TABLE families ADD COLUMN timezone text NOT NULL DEFAULT 'UTC'`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared utilities and type updates required by all three user stories.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T003 Create `lib/chore-schedule.ts` implementing `isChoreAvailableOn(allowedDays: number[] | null, dayOfWeek: number): boolean`, `dayOfWeekFromDate(date: string): number`, and `getNextAvailableDate(allowedDays: number[], fromDate: Date): Date | null` (see data-model.md for signatures; treat null or empty array as always-available)
- [x] T004 Update `lib/types.ts` to add `allowedDays: number[]` to the `Chore` type and add a new exported `Family` type with fields `id`, `name`, `parentId`, `timezone`, `createdAt`

**Checkpoint**: Foundation ready — `lib/chore-schedule.ts` and updated types available for all stories.

---

## Phase 3: User Story 1 — Set Allowed Days for a Chore (Priority: P1) 🎯 MVP

**Goal**: Parents can select which days of the week a chore is available and save the schedule from the admin chores page.

**Independent Test**: Log in as parent → Admin → Chores → set Mon/Wed/Fri on a chore → save → verify chore shows those days; update to weekdays → verify; clear → verify "Every day".

### Implementation for User Story 1

- [x] T005 [US1] Update `lib/db/chores.ts` — add `allowedDays?: number[]` parameter to `createChore` (mapped to `allowed_days`) and extend the `updates` type in `updateChore` to include `allowed_days?: number[] | null`
- [x] T006 [US1] Update `lib/actions/chores.ts` — parse `allowedDays` JSON field from FormData in `createChoreAction` and `updateChoreAction`; add new `updateChoreScheduleAction(choreId: string, allowedDays: number[]): Promise<void>` that calls `requireParentFamily()`, validates day values are 0–6, updates the chore, and calls `revalidatePath('/admin/chores')`
- [x] T007 [US1] Create `components/chore-list/DaySchedulePicker.tsx` — a client component using shadcn `ToggleGroup` in multiple mode; accepts `value: number[]` and `onChange: (days: number[]) => void` props; renders 7 toggles labeled Su/Mo/Tu/We/Th/Fr/Sa mapped to 0–6; an empty selection means "every day"
- [x] T008 [US1] Update `app/(admin)/admin/chores/page.tsx` — integrate `DaySchedulePicker` into the chore create/edit form; wire it to `updateChoreScheduleAction`; map the chore's `allowed_days` (from DB snake_case) to `allowedDays` when passing to the picker

**Checkpoint**: User Story 1 is fully functional — parents can set, update, and clear chore schedules.

---

## Phase 4: User Story 2 — Children See Only Available Chores for Today (Priority: P2)

**Goal**: The child's chore list only shows scheduled chores as actionable; schedule is enforced server-side on completion.

**Independent Test**: Set a chore to Tuesdays only; log in as kid on a non-Tuesday → chore appears unavailable with next available day shown; direct `toggleChore` call returns error.

### Implementation for User Story 2

- [x] T009 [US2] Update `lib/db/day-records.ts` — in `getOrCreateDayRecord`, include `allowed_days` in the chores SELECT query; filter out completions for chores where `!isChoreAvailableOn(chore.allowed_days, dayOfWeekFromDate(newRecord.date))` before inserting; apply the same filter in the backfill path for existing day records
- [x] T010 [US2] Update `lib/actions/day-records.ts` — in `toggleChore`, when `completed` is `true`, fetch the chore's `allowed_days` via `chore_completions → chore_assignments → chores`; call `isChoreAvailableOn` with the day-of-week from `day_records.date`; throw `new Error('Chore not available on this day')` if blocked
- [x] T011 [US2] Update `components/chore-list/ChoreItem.tsx` — accept optional `isAvailableToday: boolean` and `nextAvailableDate: Date | null` props; when `isAvailableToday` is false, render the chore in a visually muted/disabled state, disable the completion checkbox, and display a "Available [day]" label derived from `nextAvailableDate`
- [x] T012 [US2] Update `components/chore-list/ChoreList.tsx` and/or `app/(dashboard)/page.tsx` — compute `isAvailableToday` and `nextAvailableDate` for each chore using `isChoreAvailableOn` and `getNextAvailableDate` from `lib/chore-schedule.ts`; pass them down to `ChoreItem`

**Checkpoint**: User Story 2 complete — kids see availability state and completion is blocked server-side on non-scheduled days.

---

## Phase 5: User Story 3 — View Chore Schedule Summary (Priority: P3)

**Goal**: Parents see the day schedule for each chore at a glance in the chore list.

**Independent Test**: Log in as parent → Admin → Chores → chore with Mon/Wed/Fri schedule shows those days; chore without schedule shows "Every day".

### Implementation for User Story 3

- [x] T013 [P] [US3] Create `components/chore-list/ChoreScheduleBadge.tsx` — a display-only component that accepts `allowedDays: number[]` and renders a compact label (e.g., "Mon, Wed, Fri" for `[1,3,5]`, or "Every day" for empty/null); use shadcn `Badge` for styling
- [x] T014 [US3] Update `app/(admin)/admin/chores/page.tsx` — render `ChoreScheduleBadge` next to each chore's name in the chore library list, passing `chore.allowed_days ?? []`

**Checkpoint**: All three user stories are complete and independently functional.

---

## Phase 6: Timezone Correctness (FR-009)

**Problem**: `today` was computed as UTC date (`new Date().toISOString().split('T')[0]`), causing wrong day-of-week for families in non-UTC timezones. Family timezone was stored in DB but never used.

- [x] T018 Add `todayInTimezone(timezone: string): string` to `lib/chore-schedule.ts` — returns current date as `YYYY-MM-DD` in the given IANA timezone using `Intl.DateTimeFormat('en-CA')`
- [x] T019 Update `getNextAvailableDate` in `lib/chore-schedule.ts` to accept optional `timezone?: string` parameter; compute day-of-week via `Intl.DateTimeFormat` when timezone is provided, falling back to `getDay()` for backward compatibility
- [x] T020 Update `app/(dashboard)/page.tsx` — fetch `families.timezone` via `kid.family_id`; replace UTC `today` computation with `todayInTimezone(familyTimezone)`; pass `familyTimezone` to `getNextAvailableDate`
- [x] T021 Add unit tests for `todayInTimezone` and timezone-parameterized `getNextAvailableDate` in `__tests__/unit/chore-schedule.test.ts`

**Checkpoint**: "Today" is now always the correct local date for the family. Schedule availability and chore day display are aligned to the parent's configured timezone.

---

## Phase 7: Polish & Cross-Cutting Concerns

- [x] T015 [P] Create `__tests__/unit/chore-schedule.test.ts` — unit tests for all cases in quickstart.md: `isChoreAvailableOn` (null, empty, weekday schedule), `dayOfWeekFromDate`, `getNextAvailableDate`
- [x] T016 [P] Create `__tests__/integration/chore-schedule.test.ts` — integration tests against local Supabase verifying: `updateChoreScheduleAction` persists schedule; `toggleChore` blocks completion on wrong day; `getOrCreateDayRecord` does not seed completions for schedule-blocked chores
- [x] T017 Create `__tests__/e2e/us-chore-schedule.spec.ts` — Playwright E2E covering: parent sets/updates/clears schedule (US1 happy + update path); kid sees unavailable chore with next day text (US2 happy path); server rejects toggle on non-scheduled day (US2 failure path); parent sees schedule summary in chore list (US3 happy path)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately; T001 and T002 are parallel
- **Foundational (Phase 2)**: Requires Phase 1 complete — T003 and T004 are parallel; BLOCKS all user stories
- **US1 (Phase 3)**: Requires Phase 2 — T005 → T006 → T007 → T008 (sequential within story)
- **US2 (Phase 4)**: Requires Phase 2 + T003 — T009 → T010 are sequential; T011 and T012 depend on T011 being done first
- **US3 (Phase 5)**: Requires Phase 2 — T013 and T014 are independent of US1/US2 implementation
- **Timezone (Phase 6)**: Requires Phase 2 (T003) — T018 → T019 → T020; T021 can run in parallel with T020
- **Polish (Phase 7)**: Requires all user stories and Phase 6 complete

### User Story Dependencies

- **US1 (P1)**: Depends on Foundational only
- **US2 (P2)**: Depends on Foundational only (`isChoreAvailableOn` from T003)
- **US3 (P3)**: Depends on Foundational only (`Chore.allowedDays` type from T004)

### Parallel Opportunities

- T001 and T002 (Phase 1) can run in parallel
- T003 and T004 (Phase 2) can run in parallel
- After Phase 2: US1, US2, US3 can be started in parallel by different developers
- T013 (US3 badge component) can run in parallel with any US1/US2 task

---

## Parallel Example: US2

```text
# After Phase 2 completes, these can start in parallel:
T009 — lib/db/day-records.ts schedule filtering
T011 — components/chore-list/ChoreItem.tsx availability display

# Then T010 (toggleChore guard) after T009
# Then T012 (pass props) after T011
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001, T002)
2. Complete Phase 2: Foundational (T003, T004)
3. Complete Phase 3: US1 — parents can set schedules (T005–T008)
4. **STOP and VALIDATE**: Parent can set/update/clear chore schedules end-to-end
5. Ship if sufficient — schedule is saved but not yet enforced for kids

### Incremental Delivery

1. Setup + Foundational → schema and utilities ready
2. US1 → parents can configure schedules
3. US2 → kids see availability; server enforces restrictions
4. US3 → parents see schedule summary at a glance
5. Polish → tests validate all paths

---

## Notes

- [P] tasks operate on different files with no shared state — safe to parallelize
- `isChoreAvailableOn(null, n)` and `isChoreAvailableOn([], n)` MUST both return `true` (backward compatibility)
- The migration adds columns with safe defaults — no data migration needed
- `DaySchedulePicker` is a new component; `ChoreScheduleBadge` is display-only — both are isolated
- Do NOT add toggle-group to shadcn manually; use the CLI command in T001 to get the correct version
