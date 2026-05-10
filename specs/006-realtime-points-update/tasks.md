# Tasks: Realtime Points Update on Day Completion

**Input**: Design documents from `/specs/006-realtime-points-update/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅

**Tests**: E2E tests are MANDATORY for both user stories (UI flows present). Integration test for `undoEndDay` is included per constitution Principle V.

**Organization**: Tasks are grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to

---

## Phase 1: Setup (No new project infrastructure needed)

No project scaffolding required — this feature modifies an existing Next.js + Supabase application.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: DB migration must land before the `undoEndDay` action can be implemented. US1 fixes are independent of this migration but this phase unblocks US2.

**⚠️ CRITICAL**: US2 implementation cannot begin until T001 is complete.

- [x] T001 Create `supabase/migrations/0010_undo_end_day.sql` — drop and re-add the `activity_log_action_type_check` constraint to include `day_undone`, `penalty_reversed`, `effort_reversed` (see data-model.md for exact SQL)

**Checkpoint**: Migration 0010 is written and `bun run db:reset` succeeds — US2 implementation can now begin.

---

## Phase 3: User Story 1 — Points Reflect Immediately After Day Completion (Priority: P1) 🎯 MVP

**Goal**: Every points display updates within 1 second of day completion on the same screen, without a page reload.

**Independent Test**: Log in as a kid, end today's day, observe the points badge in the navbar — it must increment immediately without any navigation.

### E2E Test for User Story 1

- [x] T002 [US1] Write E2E test in `__tests__/e2e/us12-realtime-points.spec.ts` covering: end day → verify navbar badge updates immediately without navigation (SC-001, SC-002)

### Implementation for User Story 1

- [x] T003 [P] [US1] Fix `PointsBadge` in `components/navbar/PointsBadge.tsx` — add `useEffect(() => { setPoints(initialPoints) }, [initialPoints])` after the existing `useState` declaration so updated server-rendered props are reflected on re-render
- [x] T004 [P] [US1] Fix `revalidatePath` targets in `lib/actions/day-records.ts` — change all three occurrences of `revalidatePath('/dashboard')` (in `toggleChore`, `declareRestDay`, and `endDay`) to `revalidatePath('/')` so the layout cache is correctly invalidated

**Checkpoint**: US1 is complete when T002–T004 are done and the E2E test passes. Points badge updates immediately on day completion.

---

## Phase 4: User Story 2 — Kid Can Undo an Accidental Day Completion (Priority: P2)

**Goal**: After ending a day, the kid can tap "Undo End Day", confirm, and have the day re-opened with points immediately reflecting the reversal.

**Independent Test**: Log in as a kid, end today's day, tap "Undo End Day", confirm — the day re-opens (chore list is editable again), and the points badge immediately reverts to its pre-completion value.

### Tests for User Story 2

- [x] T005 [P] [US2] Write integration test in `__tests__/integration/undo-end-day.test.ts` — test that `undoEndDay` correctly inserts reversal log entries, resets `day_records.ended_at` to null, and recalculates `kids.points` (depends on T001 migration being applied)
- [x] T006 [P] [US2] Extend E2E test file `__tests__/e2e/us12-realtime-points.spec.ts` — add scenario: end day → undo end day (confirm dialog) → verify day re-opens and badge reverts immediately (FR-004, FR-006, FR-007)

### Implementation for User Story 2

- [x] T007 [US2] Implement `undoEndDay` server action in `lib/actions/day-records.ts` (depends on T001):
  - Verify authenticated kid owns the day record and `ended_at IS NOT NULL`
  - Fetch `activity_log` rows where `metadata->>'day_record_id' = dayRecordId` and `action_type IN ('penalty_applied', 'effort_awarded')`
  - Insert `penalty_reversed` with `points_delta = -(original delta)` for each `penalty_applied` row
  - Insert `effort_reversed` with `points_delta = -(original delta)` for each `effort_awarded` row
  - Insert `day_undone` with `points_delta = null`
  - Update `day_records SET ended_at = null, effort_level_id = null`
  - Call `revalidatePath('/')`
- [x] T008 [P] [US2] Create `components/end-day/UndoEndDayButton.tsx` — shadcn `AlertDialog` with confirmation message ("Undo ending this day? Your chore selections stay, but your points from this completion will be reversed."), calls `undoEndDay(dayRecordId)` via `useTransition`, disabled while pending (depends on T007 signature being defined)
- [x] T009 [P] [US2] Update `EndDayButton` in `components/end-day/EndDayButton.tsx` — remove "This cannot be undone." from the `AlertDialogDescription` (FR-007 undo is now available)
- [x] T010 [US2] Update `app/(dashboard)/page.tsx` — render `UndoEndDayButton` when `isEnded` is true (alongside or replacing the static "Day Ended ✓" badge); pass `dayRecordId={dayRecord.id}` (depends on T008)

**Checkpoint**: US2 is complete when T005–T010 are done and both E2E scenarios pass. Day can be undone from today's view and from calendar-linked day view (`/?date=<past-date>`).

---

## Phase 5: Polish & Cross-Cutting Concerns

- [x] T011 [P] Run full test suite `bun run test` (vitest unit + integration) and confirm no regressions from `revalidatePath` or action changes
- [x] T012 [P] Run Playwright E2E suite `bunx playwright test __tests__/e2e/us12-realtime-points.spec.ts` and confirm both US1 and US2 scenarios pass locally

---

## Dependencies & Execution Order

### Phase Dependencies

- **Foundational (Phase 2)**: No dependencies — start immediately
- **US1 (Phase 3)**: Independent of the migration; can start in parallel with Phase 2
- **US2 (Phase 4)**: Depends on T001 (migration) for server action implementation; T005 (integration test) and T008 (UndoEndDayButton) can start in parallel with T007

### User Story Dependencies

- **US1**: No dependency on US2 — fully independent
- **US2**: Depends on Phase 2 migration (T001) — otherwise independent of US1

### Within US2

```
T001 (migration) → T007 (server action) → T010 (dashboard page update)
T001 (migration) → T005 (integration test) [P with T007]
T007 (contract defined) → T008 (UndoEndDayButton) [P with T009]
T008 + T010 done → T006 (E2E test)
```

---

## Parallel Opportunities

### US1 (T003 and T004 in parallel)

```
Task: T003 — Fix PointsBadge useEffect in components/navbar/PointsBadge.tsx
Task: T004 — Fix revalidatePath in lib/actions/day-records.ts
```

### US2 (after T001 migration)

```
Task: T005 — Integration test for undoEndDay (different file)
Task: T007 — undoEndDay server action (same file as endDay — not parallel with other action edits)
```

```
Task: T008 — UndoEndDayButton component (after T007 contract is defined)
Task: T009 — EndDayButton dialog text update (independent file)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete T003 + T004 (parallel) — fix the `useState` bug and `revalidatePath`
2. Complete T002 — write and validate the E2E test
3. **STOP and VALIDATE**: Confirm badge updates immediately on day completion
4. Ship US1 — core bug is fixed

### Incremental Delivery

1. US1 (T002–T004) → immediate points fix ✓
2. T001 (migration) → unblocks US2
3. US2 (T005–T010) → undo end day ✓
4. T011–T012 (polish) → full suite green ✓

---

## Notes

- [P] tasks = different files, no shared state dependencies
- Migration T001 must be applied (`bun run db:reset`) before integration tests for US2 will pass
- `undoEndDay` narrows activity_log entries by `metadata->>'day_record_id'` (JSONB field set by `endDay`)
- E2E tests target a seeded local Supabase instance per the constitution
- US1 fix is 2 small file edits — no migration, no new components
