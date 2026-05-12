# Tasks: Chore Completion Reward Points

**Input**: Design documents from `/specs/005-chore-reward-points/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Organization**: Tasks grouped by user story — each story is independently implementable and testable.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: User story this task belongs to (US1, US2, US3, US4)

---

## Phase 1: Setup (Database Migration)

**Purpose**: Apply schema changes that all user stories depend on.

- [x] T001 Create supabase/migrations/0011_chore_reward_points.sql — add `reward_points integer NOT NULL DEFAULT 0 CHECK (reward_points >= 0)` to `chores`, add `reward_snapshot integer NOT NULL DEFAULT 0 CHECK (reward_snapshot >= 0)` to `chore_completions`, drop and recreate `activity_log_action_type_check` constraint adding `chore_completion_reward`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Type layer updates that all three user stories depend on. Cannot begin until T001 is written (migration defines the column names).

**⚠️ CRITICAL**: No user story implementation can begin until this phase is complete.

- [x] T002 Update lib/database.types.ts — add `reward_points: number` to `chores` Row/Insert/Update types, add `reward_snapshot: number` to `chore_completions` Row/Insert/Update types, add `'chore_completion_reward'` to `activity_log` `action_type` column type
- [x] T003 Update lib/types.ts — add `reward: number` to `Chore` type, add `rewardSnapshot: number` to `ChoreCompletion` type, add `'chore_completion_reward'` to `ActivityLogEntry['actionType']` union

**Checkpoint**: Foundation ready — all three user stories can now begin in parallel.

---

## Phase 3: User Story 1 — Configure Reward Points on a Chore (Priority: P1) 🎯 MVP

**Goal**: Parent can set a `reward_points` value on a chore via the library UI; value is stored and displayed.

**Independent Test**: Create a chore with reward 10, save it, reload `/admin/chores` — reward value appears alongside penalty value. Edit the chore and change the reward to 20 — updated value persists.

- [x] T004 [US1] Update `createChore` and `updateChore` in lib/db/chores.ts to accept and persist a `reward` parameter mapped to the `reward_points` column
- [x] T005 [US1] Update `createChoreAction` and `updateChoreAction` in lib/actions/chores.ts to read `reward` from `formData` (same validation pattern as `penalty`: `Number(formData.get('reward') ?? 0)`) and pass to db functions
- [x] T006 [US1] Update app/(admin)/admin/chores/page.tsx — add "Reward Points" `<Input>` field (type number, min 0, defaultValue 0, name "reward") to the Add Chore form alongside the existing Penalty Points field; display `+{chore.reward_points} pts` reward badge next to the penalty badge in the chore list
- [x] T007 [P] [US1] Update __tests__/integration/chores.test.ts — add test cases: create chore with `reward_points: 5` and verify it is stored; update chore to change `reward_points` and verify new value; verify `reward_points` defaults to 0 when not provided

**Checkpoint**: Parent can fully configure reward points on a chore independently of all other stories.

---

## Phase 4: User Story 2 — Earn Reward Points at End Day (Priority: P2)

**Goal**: `endDay` grants one `chore_completion_reward` event per completed chore with `reward_snapshot > 0`; kid's balance updates via trigger; reward badge shows on both completed and uncompleted chore tiles.

**Independent Test**: Assign a chore with reward 10 to a kid. Kid completes the chore. Trigger End Day. Kid's balance increases by 10. Activity log has one `chore_completion_reward` entry. Kid then starts a new day, checks the chore, unchecks it, and triggers End Day — balance does not increase.

- [x] T008 [P] [US2] Add `calculateChoreRewards(completions: ChoreCompletion[]): number` to lib/points.ts — sums `rewardSnapshot` for all completions where `completedAt !== null` and `rewardSnapshot > 0` (mirrors `calculatePenalties` pattern)
- [x] T009 [P] [US2] Update `getOrCreateDayRecord` in lib/db/day-records.ts — include `reward_points` in the chore fetch query and set `reward_snapshot: chore.reward_points` when inserting `chore_completions` rows (both the new-day path and the backfill path)
- [x] T010 [US2] Update `endDay` in lib/actions/day-records.ts — after inserting the `penalty_applied` event, iterate `completions` where `completedAt !== null && rewardSnapshot > 0` and insert one `activity_log` row per such completion with `action_type: 'chore_completion_reward'`, `points_delta: rewardSnapshot`, `metadata: { chore_name: choreNameSnapshot, completion_id: id }` (depends on T008, T009)
- [x] T011 [P] [US2] Update components/chore-list/ChoreItem.tsx — add a `+{completion.rewardSnapshot} pts` green badge (using `Badge` component) visible when `completion.rewardSnapshot > 0` regardless of completed state; place it alongside the existing penalty badge
- [x] T012 [P] [US2] Update __tests__/unit/points.test.ts — add `calculateChoreRewards` test suite: returns 0 for empty list, sums only completed completions with reward > 0, ignores uncompleted completions, ignores completions with rewardSnapshot of 0
- [x] T013 [US2] Update __tests__/integration/day-records.test.ts — add test cases: verify `reward_snapshot` is set when day record is created; verify `endDay` inserts `chore_completion_reward` events for completed chores with reward > 0; verify no reward event when chore is uncompleted; verify no reward event when `reward_snapshot` is 0 (depends on T009, T010)

**Checkpoint**: End Day flow grants rewards correctly; tile displays reward badge; unit + integration tests pass.

---

## Phase 5: User Story 3 — Reward Points Visible in Activity Log (Priority: P3)

**Goal**: Activity log displays `chore_completion_reward` events with chore name, point delta, and a distinct label.

**Independent Test**: After End Day with rewarded completions, parent views `/activity` — reward entries appear with `+N` delta and a distinct label; not confused with penalty entries.

- [x] T014 [US3] Update components/activity-log/ActivityLogTable.tsx — add `chore_completion_reward: 'Chore Reward'` to `ACTION_LABELS`; in the `action` column cell renderer, also display `metadata?.chore_name` (string) below the badge when `actionType === 'chore_completion_reward'` (mirrors how `manual_adjustment` shows `reason`)

**Checkpoint**: All three user stories independently functional and visible end-to-end.

---

## Phase 6: Polish & E2E Coverage

**Purpose**: End-to-end test covering the full reward flow across all stories.

- [x] T015 Create __tests__/e2e/us11-chore-reward.spec.ts — E2E test covering: (1) parent configures reward on chore and it appears in library; (2) kid sees +N pts badge on chore tile before and after checking; (3) End Day is triggered and kid balance increases by reward amount; (4) activity log shows chore_completion_reward entry with chore name; (5) negative path: kid unchecks chore before End Day → no reward event

---

## Phase 7: User Story 4 — Undo End Day Reverts Reward Points (FR-011, FR-012)

**Goal**: When End Day is undone, one `chore_completion_reward_reversed` event is inserted per original reward event, restoring the kid's balance. Reversal events appear in the activity log with a distinct label.

**Independent Test**: Trigger End Day with a rewarded completed chore — kid's balance increases. Trigger undo End Day — kid's balance returns to pre-End-Day value. Activity log shows a "Chore Reward Reversed" entry with the original chore name and negative point delta.

- [x] T016 Create supabase/migrations/0012_reward_reversal_event_type.sql — drop and recreate `activity_log_action_type_check` constraint to add `'chore_completion_reward_reversed'` alongside all existing action types including `'chore_completion_reward'`
- [x] T017 [P] Update lib/database.types.ts — add `'chore_completion_reward_reversed'` to the `activity_log` `action_type` column type union (depends on T016)
- [x] T018 [P] Update lib/types.ts — add `'chore_completion_reward_reversed'` to `ActivityLogEntry['actionType']` union (depends on T016)
- [x] T019 [US4] Update `undoEndDay` in lib/actions/day-records.ts — after reversing the penalty event, query `activity_log` for all `chore_completion_reward` rows where `day_record_id` matches; for each, insert one `activity_log` row with `action_type: 'chore_completion_reward_reversed'`, `points_delta: -originalRow.points_delta`, `metadata: { chore_name: originalRow.metadata.chore_name, original_event_id: originalRow.id }` (depends on T017, T018)
- [x] T020 [P] [US4] Update components/activity-log/ActivityLogTable.tsx — add `chore_completion_reward_reversed: 'Chore Reward Reversed'` to `ACTION_LABELS`; display `metadata?.chore_name` below the badge when `actionType === 'chore_completion_reward_reversed'` (same pattern as `chore_completion_reward`)
- [x] T021 [US4] Update __tests__/integration/day-records.test.ts — add test cases: verify `undoEndDay` inserts one `chore_completion_reward_reversed` event per prior `chore_completion_reward` event; verify kid balance is restored to pre-End-Day value; verify no reversal events inserted when no reward events existed for that day (depends on T019)
- [x] T022 [US4] Update __tests__/e2e/us11-chore-reward.spec.ts — add E2E path: (1) End Day is triggered with rewarded completion → balance increases; (2) undo End Day is triggered → balance returns to original value; (3) activity log shows "Chore Reward Reversed" entry with chore name and negative delta (depends on T019, T020)

**Checkpoint**: Undo End Day fully reverts reward points; activity log shows reversal events; integration + E2E tests pass.

---

## Phase 8: Bug Fix — Undo End Day Phantom Point Gain (FR-013)

**Goal**: Fix `undoEndDay` so it only reverses events that were actually recorded during that End Day run. Currently it generates penalty reversal adjustments even when no `penalty_applied` event was inserted (all chores were completed), causing a spurious points increase on every undo.

**Reproduction**:
1. Check all chores (no penalty applied at End Day)
2. End Day → balance increases by effort level only (correct)
3. Undo End Day → balance increases again instead of reverting (bug)

**Independent Test**: Check all chores for a kid. Trigger End Day (balance increases by effort amount only). Trigger Undo End Day — balance returns exactly to the pre-End-Day value with no net gain.

- [x] T023 [US4] Fix `undoEndDay` in lib/actions/day-records.ts — before inserting any reversal, query `activity_log` for the actual events recorded for that `day_record_id` during End Day (filter by `action_type IN ('penalty_applied', 'effort_awarded', 'chore_completion_reward')` and the `day_ended` timestamp); only reverse events that are present in the result set; do NOT synthesise reversals for events that do not exist (FR-013)
- [x] T024 [US4] Update __tests__/integration/day-records.test.ts — add test: all chores completed for a kid (no `penalty_applied` event inserted at End Day), trigger `undoEndDay`; assert kid balance decreases by effort amount only; assert no phantom positive adjustments; assert no `penalty_applied_reversed` or equivalent events exist in activity_log after undo (depends on T023)

**Checkpoint**: Undo End Day produces zero net balance change when no penalty was applied; repeating End Day → Undo End Day cycle does not accumulate points.

---

## Phase 9: Bug Fix — EffortDropdown Showing UUID Instead of Label (FR-014)

**Goal**: Fix `EffortDropdown` so the select trigger always displays the human-readable effort label (e.g., "Awesome (+15 pts)") instead of the raw UUID after an option is selected.

**Root cause**: `components/ui/select.tsx` wraps `@base-ui/react/select`. Base UI's `Select.Value` resolves the display label from an internal context populated during popup interaction. In controlled mode (value set externally via `useState`), the popup has not been rendered so no label is in context — Base UI falls back to rendering the raw value string (the UUID).

**Reproduction**:
1. Open End Day dialog (all chores must be complete)
2. Select any effort level
3. Trigger shows UUID (e.g., `8748ed31-c744-473f-bf91-8742b5fcda53`) instead of label

**Independent Test**: Open End Day dialog, select "Awesome (+15 pts)" — the select trigger shows "Awesome (+15 pts)", not a UUID.

- [x] T025 Fix `components/effort-dropdown/EffortDropdown.tsx` — derive `selectedLevel` via `effortLevels.find(l => l.id === value) ?? null` and pass `selectedLevel ? \`${selectedLevel.name} (+${selectedLevel.points} pts)\` : undefined` as children of `SelectValue` to bypass Base UI's internal label-resolution mechanism

**Checkpoint**: Selecting any effort option in the End Day dialog shows the label text immediately with no UUID leakage.

---

## Phase 10: Bug Fix — Penalty Badge Always Shows on Chores Page (Zero-Value)

**Goal**: Hide the penalty badge on the chores admin page when `penalty = 0`, consistent with how the reward badge already behaves on that same page and how both badges behave on the kid dashboard.

**Reproduction**: Go to `/admin/chores`. Any chore with `Penalty Points = 0` shows a `-0 pts` badge.

**Independent Test**: A chore with `penalty = 0` and `reward = 5` shows only the `+5 pts` badge. A chore with `penalty = 3` and `reward = 0` shows only the `-3 pts` badge. A chore with both `= 0` shows no point badges.

- [x] T026 Fix `app/(admin)/admin/chores/page.tsx` — wrap the penalty `<Badge>` on line 98 with `{chore.penalty > 0 && ( ... )}` to mirror the existing `chore.reward_points > 0` guard directly below it

**Checkpoint**: No `-0 pts` badge appears on any chore. Penalty and reward badges only render when their value is greater than 0.

---

## Phase 11: Bug Fix — Edit Form Reward Points Not Persisting (FR-015)

**Goal**: Fix the edit chore form so that reward points changes are visible and errors are surfaced when `updateChoreAction` fails. Currently, when the server action fails (e.g., DB column missing, RLS error), there is no inline feedback — the form resets silently and the badge does not appear.

**Root cause**: `updateChoreAction` has no error handling beyond `throw`. When Next.js 16.x + Turbopack catches the thrown error, it may not always surface the error overlay in the browser. The edit form UI has no success/failure indicator.

**Reproduction**:
1. Go to `/admin/chores`
2. Open the Edit section on any chore
3. Change Reward Points from 0 to 10 and click Save
4. The page refreshes but no `+10 pts` badge appears

**Independent Test**: Edit a chore's reward points, save, and see either a success confirmation OR a visible error message — never a silent no-op.

- [x] T027 Fix `app/(admin)/admin/chores/page.tsx` and `lib/actions/chores.ts` — extract the edit chore form into a client component (`ChoreEditForm`) that uses `useActionState` with `updateChoreAction` returning `{ error: string | null }` so save failures display an inline error message below the form

**Checkpoint**: Editing reward points shows the new badge value on success, or an inline error message on failure — no silent no-ops.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Depends on T001 — blocks all user stories
- **Phase 3 (US1)**: Depends on Phase 2 completion — no dependency on US2/US3/US4
- **Phase 4 (US2)**: Depends on Phase 2 completion — no dependency on US1/US3/US4
- **Phase 5 (US3)**: Depends on Phase 2 completion — no dependency on US1/US2/US4
- **Phase 6 (Polish)**: Depends on US1, US2, US3 complete
- **Phase 7 (US4)**: Depends on Phase 2 completion and Phase 4 (US2) complete — reversal requires reward granting to already work

### User Story Dependencies

- **US1 (P1)**: Independent after Phase 2
- **US2 (P2)**: Independent after Phase 2 (does not require US1 to be complete)
- **US3 (P3)**: Independent after Phase 2 (does not require US1 or US2 to be complete)
- **US4**: Depends on US2 complete (reversal is the inverse of US2's End Day reward granting)

### Within Each User Story

- US1: T004 → T005 → T006; T007 [P] can be written anytime after T004
- US2: T008 and T009 and T011 [P] in parallel; T010 depends on T008 + T009; T012 [P] after T008; T013 after T009 + T010
- US3: T014 single task
- US4: T016 → T017 + T018 [P] → T019 → T020 [P] + T021 → T022

### Parallel Opportunities

```bash
# After Phase 2 completes, launch in parallel:
Task: US1 (T004 → T005 → T006 + T007)
Task: US2 (T008 + T009 + T011 in parallel → T010 → T012 + T013)
Task: US3 (T014)

# After US2 completes:
Task: US4 (T016 → T017 + T018 → T019 → T020 + T021 → T022)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: T001
2. Complete Phase 2: T002 + T003
3. Complete Phase 3: T004 → T005 → T006 → T007
4. **STOP and VALIDATE**: Parent can configure reward points on a chore
5. Proceed to US2

### Incremental Delivery

1. Setup + Foundational → foundation ready
2. US1 → parent can set reward values (library-side complete)
3. US2 → kids earn rewards at End Day (core mechanic complete)
4. US3 → activity log shows reward events (visibility complete)
5. Phase 6 → E2E coverage
6. US4 → undo End Day reverts rewards (reversal mechanic complete)

---

## Notes

- `reward_points` in DB maps to `reward` in `Chore` TypeScript type (matching how `penalty` is named)
- `reward_snapshot` maps to `rewardSnapshot` in `ChoreCompletion` TypeScript type
- The `after_activity_log_insert` trigger automatically recalculates `kids.points` — no manual balance update needed in `endDay` or `undoEndDay`
- `calculateChoreRewards` in `lib/points.ts` is a pure function for unit testing; `endDay` uses it to determine which completions generate events
- No reversal event needed for unchecking before End Day — the reward was never credited to the balance; `chore_completion_reward_reversed` is exclusively for undo End Day
- T016 creates a new migration (0012) rather than modifying 0011, to avoid re-applying an already-written migration against local Supabase
