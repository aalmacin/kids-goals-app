# Tasks: Points Event Sourcing & Manual Adjustment

**Input**: Design documents from `specs/002-points-event-sourcing/`
**Prerequisites**: plan.md ✓, spec.md ✓, research.md ✓, data-model.md ✓, contracts/server-actions.md ✓

**Organization**: Tasks grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: User story this task belongs to (US1, US2, US3)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Apply the database migration that is the foundation for all three user stories.

- [x] T001 Write `supabase/migrations/0006_event_sourcing.sql`: seed existing balances as manual_adjustment events, update activity_log action_type CHECK constraint to include 'manual_adjustment', create `recalculate_kid_points()` trigger function, create `after_activity_log_insert` trigger, drop `apply_points_delta` function
- [ ] T002 Apply migration locally: `supabase db reset` and verify trigger exists and `apply_points_delta` is gone

**Checkpoint**: DB trigger live, RPC dropped, `manual_adjustment` action_type accepted by constraint

---

## Phase 2: Foundational (Type Updates — Blocking Prerequisites)

**Purpose**: Update TypeScript types to reflect the new action_type before any app code is written.

**⚠️ CRITICAL**: No server action or UI work can begin until these types are consistent.

- [x] T003 Add `'manual_adjustment'` to the `actionType` union in `lib/types.ts` (the `ActivityLogEntry.actionType` field)
- [x] T004 Update `lib/database.types.ts`: add `'manual_adjustment'` to the `action_type` enum for the `activity_log` table Insert/Row types (manual edit since this is a generated file; note in comment that regenerating from Supabase CLI after migration is the long-term solution)

**Checkpoint**: TypeScript compiles with `manual_adjustment` as a valid action_type

---

## Phase 3: User Story 1 — Event-Sourced Point Ledger (Priority: P1) 🎯 MVP

**Goal**: Remove all `apply_points_delta` RPC calls from application code. The trigger now maintains `kids.points` automatically on every `activity_log` insert.

**Independent Test**: Complete a rest day purchase, end a day (triggering penalty + effort reward), and redeem a reward. Verify `kids.points` equals `SUM(activity_log.points_delta)` for that kid without any direct points writes from the app.

### Implementation for User Story 1

- [x] T005 [P] [US1] Remove `supabase.rpc('apply_points_delta', ...)` call from `declareRestDay` in `lib/actions/day-records.ts` (the activity_log insert remains unchanged; trigger handles the balance update)
- [x] T006 [P] [US1] Remove both `supabase.rpc('apply_points_delta', ...)` calls from `endDay` in `lib/actions/day-records.ts` (penalty delta call and effort reward delta call; activity_log inserts remain)
- [x] T007 [P] [US1] Remove `supabase.rpc('apply_points_delta', ...)` call from `redeemReward` in `lib/actions/rewards.ts` (activity_log insert remains unchanged)

### Tests for User Story 1

- [x] T008 [US1] Write Vitest integration test in `__tests__/integration/points-event-sourcing.test.ts`: after inserting activity_log rows for penalty, effort reward, and rest day purchase, assert `kids.points` equals the sum of all `points_delta` entries for that kid

**Checkpoint**: All existing point flows (rest day, end day, rewards) continue working; `kids.points` is maintained exclusively by the trigger

---

## Phase 4: User Story 2 — Parent Manual Point Adjustment (Priority: P2)

**Goal**: Parents can add or subtract points for any kid from the kids admin page. Each adjustment creates an activity_log event with `action_type: 'manual_adjustment'`.

**Independent Test**: A parent submits +50 and then -30 adjustments for a kid (with and without reason). Verify `kids.points` updates correctly and two `manual_adjustment` entries appear in `activity_log`.

### Implementation for User Story 2

- [x] T009 [US2] Add `adjustKidPoints(kidId: string, delta: number, reason?: string)` Server Action to `lib/actions/kids.ts`: verify parent session, verify kidId belongs to parent's family, validate delta is a non-zero integer and reason ≤ 500 chars if provided, insert activity_log row with `actor_type: 'parent'`, `action_type: 'manual_adjustment'`, `points_delta: delta`, `metadata: { reason, adjusted_by_parent_id }`, then revalidatePath('/admin/kids')
- [x] T010 [US2] Add inline point adjustment form per kid card in `app/(admin)/admin/kids/page.tsx`: number input (label "Adjust Points", accepts positive/negative integers), optional text input for reason (label "Reason (optional)"), submit button using `adjustKidPoints` Server Action bound to the kid's id; use shadcn Input, Label, Button components

### Tests for User Story 2

- [x] T011 [P] [US2] Write Vitest integration test in `__tests__/integration/adjust-kid-points.test.ts`: positive delta increases balance, negative delta decreases balance (floor at 0), reason stored in metadata, kid session rejected with error, kidId from different family rejected
- [x] T012 [P] [US2] Write Playwright E2E test in `__tests__/e2e/adjust-kid-points.spec.ts`: parent logs in, navigates to /admin/kids, submits +50 adjustment with reason for a kid, verifies badge updates; submits -30 without reason, verifies badge updates; attempts same action as kid session (should fail/not see the form)

**Checkpoint**: Parent can add and subtract points inline; each adjustment is persisted in activity_log

---

## Phase 5: User Story 3 — Audit Trail Visibility (Priority: P3)

**Goal**: The activity log page displays `manual_adjustment` events with their type label, point delta, timestamp, and reason (when present).

**Independent Test**: After a manual adjustment with a reason, the parent views the activity page and sees the event listed with the delta, timestamp, and reason visible.

### Implementation for User Story 3

- [x] T013 [US3] Update the activity log display in `components/activity-log/ActivityLogTable.tsx` (or equivalent): add a human-readable label for `manual_adjustment` action type (e.g. "Manual Adjustment"); render the `reason` field from `metadata` when present as a secondary line or tooltip; ensure the column renders gracefully when reason is absent
- [x] T014 [US3] Write Playwright E2E test in `__tests__/e2e/audit-trail.spec.ts`: parent performs a manual adjustment with a reason, navigates to /activity, verifies the event appears with correct delta and reason text; performs an adjustment without reason, verifies the event appears without a reason field shown

**Checkpoint**: Full audit trail visible for all event types including manual adjustments

---

## Phase 6: Polish & Cross-Cutting Concerns

- [ ] T015 [P] Run `bun run vitest` and confirm all integration tests pass (T008, T011)
- [ ] T016 [P] Run `bun run playwright test` and confirm all E2E tests pass (T012, T014)
- [ ] T017 Verify `kids.points` equals `SUM(activity_log.points_delta)` for all kids in local DB (run the reconciliation query from quickstart.md)
- [x] T018 Verify TypeScript compiles clean: `bun run tsc --noEmit`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (DB Migration)**: No dependencies — start immediately
- **Phase 2 (Types)**: Depends on Phase 1 (migration defines the new action_type) — BLOCKS all app code
- **Phase 3 (US1)**: Depends on Phase 2 — safe to begin after types are updated
- **Phase 4 (US2)**: Depends on Phase 2; US1 completion recommended (trigger proven working)
- **Phase 5 (US3)**: Depends on Phase 4 (needs manual_adjustment events to exist to test display)
- **Phase 6 (Polish)**: Depends on all story phases complete

### User Story Dependencies

- **US1 (P1)**: Can start after Phase 2 — no dependencies on US2/US3
- **US2 (P2)**: Can start after Phase 2 — US1 proves trigger is working but is not a hard blocker
- **US3 (P3)**: Depends on US2 (needs the manual_adjustment event type in the UI)

### Parallel Opportunities

- T005, T006, T007 — removing RPC calls — all touch different server actions, can run in parallel
- T011, T012 — tests for US2 — different files, can run in parallel after T009/T010
- T015, T016, T018 — final validation — all independent, can run in parallel

---

## Parallel Example: User Story 1

```bash
# All three RPC-removal tasks can run together (different files):
Task T005: Remove RPC call from declareRestDay in lib/actions/day-records.ts
Task T006: Remove RPC calls from endDay in lib/actions/day-records.ts
Task T007: Remove RPC call from redeemReward in lib/actions/rewards.ts
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: DB migration
2. Complete Phase 2: Type updates
3. Complete Phase 3: Remove RPC calls, write integration test
4. **STOP and VALIDATE**: Confirm all existing flows still work, balance accurate
5. Proceed to US2 only after US1 is green

### Incremental Delivery

1. Phase 1 + 2 → DB and types ready
2. US1 → existing flows event-sourced → validate
3. US2 → manual adjustment UI → validate
4. US3 → audit trail display → validate

---

## Notes

- [P] tasks = different files, no shared state, safe to parallelise
- Migration (T001) must be applied before any app code changes are tested
- `lib/database.types.ts` is generated; manual edit is acceptable short-term (noted in T004)
- Zero-floor on `kids.points` is enforced by the trigger (`GREATEST(0, SUM(...))`) — no app-level guard needed
- All shadcn components are already installed; no new dependencies required
