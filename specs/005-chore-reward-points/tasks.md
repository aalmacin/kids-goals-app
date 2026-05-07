# Tasks: Chore Completion Reward Points

**Input**: Design documents from `/specs/005-chore-reward-points/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Organization**: Tasks grouped by user story — each story is independently implementable and testable.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: User story this task belongs to (US1, US2, US3)

---

## Phase 1: Setup (Database Migration)

**Purpose**: Apply schema changes that all user stories depend on.

- [x] T001 Create supabase/migrations/0007_chore_reward_points.sql — add `reward_points integer NOT NULL DEFAULT 0 CHECK (reward_points >= 0)` to `chores`, add `reward_snapshot integer NOT NULL DEFAULT 0 CHECK (reward_snapshot >= 0)` to `chore_completions`, drop and recreate `activity_log_action_type_check` constraint adding `chore_completion_reward`

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

- [x] T014 [US3] Update components/activity-log/ActivityLogTable.tsx — add `chore_completion_reward: 'Chore Reward 🏆'` to `ACTION_LABELS`; in the `action` column cell renderer, also display `metadata?.chore_name` (string) below the badge when `actionType === 'chore_completion_reward'` (mirrors how `manual_adjustment` shows `reason`)

**Checkpoint**: All three user stories independently functional and visible end-to-end.

---

## Phase 6: Polish & E2E Coverage

**Purpose**: End-to-end test covering the full reward flow across all stories.

- [x] T015 Create __tests__/e2e/us11-chore-reward.spec.ts — E2E test covering: (1) parent configures reward on chore and it appears in library; (2) kid sees +N pts badge on chore tile before and after checking; (3) End Day is triggered and kid balance increases by reward amount; (4) activity log shows chore_completion_reward entry with chore name; (5) negative path: kid unchecks chore before End Day → no reward event

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Depends on T001 — blocks all user stories
- **Phase 3 (US1)**: Depends on Phase 2 completion — no dependency on US2/US3
- **Phase 4 (US2)**: Depends on Phase 2 completion — no dependency on US1/US3
- **Phase 5 (US3)**: Depends on Phase 2 completion — no dependency on US1/US2
- **Phase 6 (Polish)**: Depends on US1, US2, US3 complete

### User Story Dependencies

- **US1 (P1)**: Independent after Phase 2
- **US2 (P2)**: Independent after Phase 2 (does not require US1 to be complete)
- **US3 (P3)**: Independent after Phase 2 (does not require US1 or US2 to be complete)

### Within Each User Story

- US1: T004 → T005 → T006; T007 [P] can be written anytime after T004
- US2: T008 and T009 and T011 [P] in parallel; T010 depends on T008 + T009; T012 [P] after T008; T013 after T009 + T010
- US3: T014 single task

### Parallel Opportunities

```bash
# After Phase 2 completes, launch in parallel:
Task: US1 (T004 → T005 → T006 + T007)
Task: US2 (T008 + T009 + T011 in parallel → T010 → T012 + T013)
Task: US3 (T014)
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

---

## Notes

- `reward_points` in DB maps to `reward` in `Chore` TypeScript type (matching how `penalty` is named)
- `reward_snapshot` maps to `rewardSnapshot` in `ChoreCompletion` TypeScript type
- The `after_activity_log_insert` trigger automatically recalculates `kids.points` — no manual balance update needed in `endDay`
- `calculateChoreRewards` in `lib/points.ts` is a pure function for unit testing; `endDay` uses it to determine which completions generate events
- No reversal event type needed — unchecking before End Day simply means the chore is incomplete, so no reward is granted
