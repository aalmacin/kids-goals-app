# Tasks: Kids Goals PWA

**Input**: Design documents from `specs/001-kids-goals-pwa/`
**Prerequisites**: plan.md, spec.md, data-model.md, contracts/server-actions.md, research.md, quickstart.md

**Tests**: Required by Constitution Principle V — Playwright E2E (all user flows), Vitest unit (business logic), Vitest integration (RLS + server actions).

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (US1–US10)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Install dependencies, configure tooling, and initialize project scaffolding.

- [X] T001 Install runtime dependencies: `@supabase/supabase-js @supabase/ssr @tanstack/react-query @tanstack/store @tanstack/react-table serwist @serwist/next lucide-react class-variance-authority clsx tailwind-merge` in package.json
- [X] T002 [P] Install dev dependencies: `vitest @vitejs/plugin-react @vitest/coverage-v8 playwright @playwright/test supabase` in package.json
- [X] T003 [P] Initialize shadcn/ui: run `npx shadcn@latest init` and add base components (button, card, dialog, dropdown-menu, input, label, badge, calendar, navigation-menu, sheet, toast, select) to components/ui/
- [X] T004 Configure Vitest in vitest.config.ts with React plugin, alias `@/` → project root, and separate workspaces for unit (`__tests__/unit`) and integration (`__tests__/integration`)
- [X] T005 [P] Configure Playwright in playwright.config.ts targeting `http://localhost:3000`, with test dir `__tests__/e2e`, seeded local Supabase as dependency
- [X] T006 [P] Configure `proxy.ts` at project root: generate per-request CSP nonce, set `x-nonce` header, set `Content-Security-Policy` header, add matcher to exclude static assets and prefetches
- [X] T007 [P] Create `app/manifest.ts` exporting PWA web app manifest (name: "Kids Goals", display: "standalone", icons: 192×192 and 512×512)
- [X] T008 [P] Update `app/layout.tsx` root layout: read nonce from `headers()`, pass to `<Script>` tags; wrap app in TanStack Query `QueryClientProvider` via `app/providers.tsx`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Database schema, RLS, auth clients, shared types, and points business logic. No user story can begin until complete.

**⚠️ CRITICAL**: All user story work is blocked until this phase is complete.

- [X] T009 Initialize Supabase local project: run `supabase init`, configure `supabase/config.toml`, create `supabase/seed.sql` with test family/kid/chore fixtures
- [X] T010 Create DB migration `supabase/migrations/0001_initial_schema.sql`: all 9 tables (families, kids, chores, chore_assignments, effort_levels, rewards, day_records, chore_completions, reward_redemptions, activity_log) with columns, constraints, and indexes from data-model.md
- [X] T011 Create DB migration `supabase/migrations/0002_rls_policies.sql`: enable RLS on all tables, create parent and kid policies for each table per RLS strategy in data-model.md
- [X] T012 [P] Create DB migration `supabase/migrations/0003_points_function.sql`: `apply_points_delta(kid_id uuid, delta integer)` function with `GREATEST(0, points + delta)` floor and `SECURITY DEFINER`
- [X] T013 [P] Create DB migration `supabase/migrations/0004_indexes.sql`: all indexes from data-model.md (chore_assignments.kid_id, day_records.kid_id+date, chore_completions.day_record_id, activity_log.family_id+created_at, reward_redemptions.kid_id)
- [X] T014 Generate Supabase TypeScript types to `lib/database.types.ts` via `supabase gen types typescript --local`
- [X] T015 Implement `lib/supabase/server.ts`: server-side Supabase client using `@supabase/ssr` `createServerClient` with cookie handlers for Server Components and Server Actions
- [X] T016 [P] Implement `lib/supabase/client.ts`: browser-side Supabase client using `@supabase/ssr` `createBrowserClient` for Realtime subscriptions
- [X] T017 [P] Define shared TypeScript types in `lib/types.ts`: `Kid`, `Chore`, `ChoreAssignment`, `DayRecord`, `ChoreCompletion`, `Reward`, `EffortLevel`, `ActivityLogEntry` matching contracts/server-actions.md
- [X] T018 Implement pure business logic in `lib/points.ts`: `calculatePenalties(completions: ChoreCompletion[])`, `calculateEffortReward(effortLevel: EffortLevel | null)`, `canAffordRestDay(points: number)`
- [X] T019 Write unit tests for `lib/points.ts` in `__tests__/unit/points.test.ts`: penalty calculation with zero and non-zero penalties, effort reward null/defined, rest day affordability threshold, points floor at zero

---

## Phase 3: User Story 1 — Parent Authentication & Family Setup (Priority: P1) 🎯 MVP

**Goal**: Parent registers with email/password, sets unique family name, accesses admin dashboard.

**Independent Test**: Register a new parent, set a family name, verify dashboard loads — no kids or chores needed.

### Tests for User Story 1

- [X] T020 [P] [US1] Write integration test in `__tests__/integration/auth.test.ts`: `loginParent` succeeds with valid credentials, fails with wrong password; `logout` clears session; family uniqueness constraint rejects duplicate name
- [X] T021 [P] [US1] Write E2E test in `__tests__/e2e/us1-parent-auth.spec.ts`: happy path (register → family setup → dashboard); failure paths (duplicate family name shows error, wrong password rejected, logout returns to login)

### Implementation for User Story 1

- [X] T022 [US1] Implement `lib/db/families.ts`: `createFamily`, `getFamilyByName`, `getFamilyByParentId`, `updateFamilyName` using typed Supabase server client
- [X] T023 [US1] Implement auth server actions in `lib/actions/auth.ts`: `loginParent` (Supabase email/password), `logout` (clear session), and `setupFamily` (create family row, enforce unique name)
- [X] T024 [US1] Create parent login page `app/(auth)/login/page.tsx`: shadcn Card + Form with email/password fields, error display, link to registration, calls `loginParent` server action
- [X] T025 [US1] Create family setup page `app/(admin)/family/page.tsx`: shadcn Form for family name input, duplicate-name error handling, redirects to admin dashboard on success
- [X] T026 [US1] Create admin layout `app/(admin)/layout.tsx`: parent-only guard (redirect to login if no parent session), navigation links to Kids, Chores, Effort, Family, Rewards
- [X] T027 [P] [US1] Create dashboard layout `app/(dashboard)/layout.tsx`: shared nav bar shell (PointsBadge placeholder for now), redirect to login if no session

**Checkpoint**: Parent can register, set family name, log in, see admin dashboard, and log out independently.

---

## Phase 4: User Story 2 — Kid Account Management (Priority: P2)

**Goal**: Parent adds kids with name/birthday/passcode; kids log in via family + name + passcode.

**Independent Test**: Parent adds a kid; that kid logs in and sees their empty dashboard.

### Tests for User Story 2

- [X] T028 [P] [US2] Write integration test in `__tests__/integration/kids.test.ts`: `addKid` creates kid + Supabase Auth user; duplicate name in same family is rejected; `loginKid` resolves synthetic email and returns session; wrong passcode returns error
- [X] T029 [P] [US2] Write E2E test in `__tests__/e2e/us2-kid-management.spec.ts`: happy path (add kid → kid logs in → kid logs out); failure paths (duplicate name error, wrong passcode rejected)

### Implementation for User Story 2

- [X] T030 [US2] Implement `lib/db/kids.ts`: `createKid`, `getKidsByFamily`, `getKidByFamilyAndName`, `updateKid`, `deleteKid` using typed Supabase server client
- [X] T031 [US2] Implement kids server actions in `lib/actions/kids.ts`: `addKid` (create Supabase Auth user with synthetic email `kid-{uuid}@{family-slug}.internal`, create kids row), `updateKid`, `removeKid`, `getKids`; enforce unique name per family
- [X] T032 [US2] Extend `lib/actions/auth.ts` with `loginKid`: look up kid by family + name, construct synthetic email, call `supabase.auth.signInWithPassword` with passcode
- [X] T033 [US2] Create kid login page `app/(auth)/kid-login/page.tsx`: shadcn Card with family name, kid name, and passcode fields; error display; calls `loginKid` server action
- [X] T034 [US2] Create kids management page `app/(admin)/kids/page.tsx`: list existing kids (name, birthday, points), add kid form (name, birthday, 4–6 digit passcode), edit/delete actions; all via TanStack Query + kids server actions
- [X] T035 [US2] Implement `components/navbar/NavBar.tsx` and `components/navbar/PointsBadge.tsx`: show kid's current points when kid session active; show parent nav links when parent session active; integrate into dashboard layout

**Checkpoint**: Parent can add kids; kids can log in and see their empty dashboard with points badge.

---

## Phase 5: User Story 3 — Chore Library & Per-Kid Assignment (Priority: P3)

**Goal**: Parent builds a family chore library and assigns individual copies to kids.

**Independent Test**: Parent creates a chore, assigns it to one kid; that kid sees it; sibling does not.

### Tests for User Story 3

- [X] T036 [P] [US3] Write integration test in `__tests__/integration/chores.test.ts`: RLS — kid can only see own assignments; `assignChore` creates independent copy per kid; `deleteChore` soft-deletes (chore no longer appears, assignment row remains)
- [X] T037 [P] [US3] Write E2E test in `__tests__/e2e/us3-chore-management.spec.ts`: happy path (create chore → assign to kid A → verify kid A sees it, kid B does not); soft-delete (delete chore → kid A no longer sees it)

### Implementation for User Story 3

- [X] T038 [US3] Implement `lib/db/chores.ts`: `createChore`, `getChoreLibrary`, `updateChore`, `softDeleteChore`, `assignChore`, `unassignChore`, `getChoreAssignments` using typed Supabase server client
- [X] T039 [US3] Implement chore server actions in `lib/actions/chores.ts`: `createChore`, `updateChore`, `deleteChore` (soft), `assignChore`, `unassignChore`, `getChoreLibrary`, `getChoreAssignments` with family ownership checks
- [X] T040 [P] [US3] Create `components/ui/IconPicker.tsx`: grid of selectable colorful icons (from lucide-react) for use in chore and reward forms
- [X] T041 [US3] Create chore library management page `app/(admin)/chores/page.tsx`: library list with add/edit/soft-delete; per-kid assignment panel showing which kids have each chore assigned; all via TanStack Query + chore server actions

**Checkpoint**: Parent manages chore library and assignments; each kid sees only their assigned chores.

---

## Phase 6: User Story 4 — Kid Daily Chore Tracking (Priority: P4)

**Goal**: Kid sees today's assigned chores and can check/uncheck them; effort dropdown appears when all are done.

**Independent Test**: Kid logs in, sees chores, checks one off, unchecks it, checks all to reveal effort dropdown.

### Tests for User Story 4

- [X] T042 [P] [US4] Write integration test in `__tests__/integration/day-records.test.ts`: `getDayRecord` auto-creates day_record and seeds chore_completions; `toggleChoreCompletion` sets/clears completed_at; toggle blocked if day_record.ended_at is set
- [X] T043 [P] [US4] Write E2E test in `__tests__/e2e/us4-chore-tracking.spec.ts`: happy path (check chore → persists on reload → uncheck → all complete → effort dropdown appears); failure path (ended day blocks check/uncheck)

### Implementation for User Story 4

- [X] T044 [US4] Implement `lib/db/day-records.ts`: `getOrCreateDayRecord` (upserts day_record and seeds chore_completion rows from assignments), `toggleChoreCompletion`, `getChoreCompletionsForDay` using typed Supabase server client
- [X] T045 [US4] Implement day-record server actions in `lib/actions/day-records.ts`: `getDayRecord`, `toggleChoreCompletion` (checks day not ended before allowing); activity log entry on each toggle
- [X] T046 [P] [US4] Create `components/chore-list/ChoreItem.tsx`: shadcn Checkbox + icon + chore name + penalty badge; optimistic update via TanStack Query mutation
- [X] T047 [P] [US4] Create `components/chore-list/ChoreList.tsx`: renders ChoreItem list; hides non-important chores when rest day active; shows effort dropdown when all complete
- [X] T048 [US4] Create today's dashboard page `app/(dashboard)/page.tsx`: fetches DayRecord for current date via TanStack Query; renders ChoreList + date header; shows "all done" state when no chores assigned

**Checkpoint**: Kid sees, checks, and unchecks daily chores; effort dropdown appears on full completion.

---

## Phase 7: User Story 5 — Rest Day (Priority: P5)

**Goal**: Kid pays 100 points for a rest day; only important chores shown; insufficient points blocked.

**Independent Test**: Kid with 100+ points triggers rest day, confirms, sees only important chores.

### Tests for User Story 5

- [X] T049 [P] [US5] Extend unit tests in `__tests__/unit/points.test.ts`: `canAffordRestDay` returns false when points < 100, true at exactly 100
- [X] T050 [P] [US5] Write E2E test in `__tests__/e2e/us5-rest-day.spec.ts`: happy path (kid confirms rest day → 100 pts deducted → non-important chores hidden); failure path (insufficient points → error message shown)

### Implementation for User Story 5

- [X] T051 [US5] Implement `declareRestDay` in `lib/actions/day-records.ts`: verify points >= 100, call `apply_points_delta(-100)`, set day_record.is_rest_day = true, write activity_log entry; idempotent (no-op if already rest day)
- [X] T052 [US5] Create `lib/store.ts` using TanStack Store: `uiStore` with `restDayModalOpen`, `endDayModalOpen`, `selectedDate` state
- [X] T053 [US5] Add rest day button and confirmation dialog to `app/(dashboard)/page.tsx`: shadcn AlertDialog for confirmation; call `declareRestDay` on confirm; show error if insufficient points; `ChoreList` already filters non-important when `isRestDay` true

**Checkpoint**: Kid can trigger rest day with confirmation; important-only chores shown; points deducted.

---

## Phase 8: User Story 6 — End Day & Penalties (Priority: P6)

**Goal**: Kid or parent triggers End Day; incomplete chores penalized; effort points awarded; day becomes read-only.

**Independent Test**: Kid with incomplete chores ends day; sees points reduced by penalty sum; day locked.

### Tests for User Story 6

- [X] T054 [P] [US6] Extend unit tests in `__tests__/unit/points.test.ts`: `calculatePenalties` sums only incomplete chores using snapshot values; rest day skips non-important chores
- [X] T055 [P] [US6] Write integration test in `__tests__/integration/day-records.test.ts`: `endDay` applies penalties atomically via `apply_points_delta`; points cannot go below zero; second call to `endDay` is a no-op
- [X] T056 [P] [US6] Write E2E test in `__tests__/e2e/us6-end-day.spec.ts`: happy path (all chores done + effort selected → effort points awarded, day read-only); failure path (incomplete chores → penalties applied, points reduced, day read-only)

### Implementation for User Story 6

- [X] T057 [US6] Implement `endDay` in `lib/actions/day-records.ts`: fetch incomplete chore_completions, call `apply_points_delta` for each penalty, apply effort reward if effortLevelId provided, set day_record.ended_at, write activity_log entries for each penalty and effort award
- [X] T058 [P] [US6] Create `components/effort-dropdown/EffortDropdown.tsx`: shadcn Select populated with family effort levels; visible only when all chores complete and day not ended; TanStack Query for effort levels
- [X] T059 [P] [US6] Create `components/end-day/EndDayButton.tsx`: shadcn AlertDialog confirmation; calls `endDay` server action with selected effort level; available to both kid and parent
- [X] T060 [US6] Wire `EffortDropdown` and `EndDayButton` into `app/(dashboard)/page.tsx`; disable chore toggles when day record `ended_at` is set

**Checkpoint**: End Day applies penalties/rewards, makes day read-only, and is available to both kid and parent.

---

## Phase 9: User Story 7 — Rewards System (Priority: P7)

**Goal**: Parent creates rewards; kids browse and redeem using points.

**Independent Test**: Parent creates a reward; kid with enough points redeems it; points reduced; redemption logged.

### Tests for User Story 7

- [X] T061 [P] [US7] Write integration test in `__tests__/integration/rewards.test.ts`: `redeemReward` calls `apply_points_delta` atomically; insufficient points returns error without mutating balance; reward_redemption row created with name/cost snapshots
- [X] T062 [P] [US7] Write E2E test in `__tests__/e2e/us7-rewards.spec.ts`: happy path (parent creates reward → kid redeems → points reduced → activity log shows redemption); failure path (kid has insufficient points → error shown, balance unchanged)

### Implementation for User Story 7

- [X] T063 [US7] Implement `lib/db/rewards.ts`: `createReward`, `getRewards`, `updateReward`, `softDeleteReward`, `createRedemption` using typed Supabase server client
- [X] T064 [US7] Implement rewards server actions in `lib/actions/rewards.ts`: `createReward`, `updateReward`, `deleteReward` (soft), `getRewards`, `redeemReward` (check balance, call `apply_points_delta`, insert reward_redemption, write activity_log)
- [X] T065 [P] [US7] Create `components/reward-card/RewardCard.tsx` and `RewardsGrid.tsx`: shadcn Card with icon, name, point cost; redeem button with confirmation dialog; disabled/greyed when points insufficient
- [X] T066 [US7] Create rewards page `app/(dashboard)/rewards/page.tsx`: shows RewardsGrid for kids; shows rewards management form (add/edit/delete) for parents; role-based rendering via session check

**Checkpoint**: Parents manage rewards; kids browse and redeem with point deduction.

---

## Phase 10: User Story 8 — Effort Levels Management (Priority: P8)

**Goal**: Parent defines named effort levels with point rewards; kids select at end-of-day.

**Independent Test**: Parent creates effort levels; kid completes all chores and selects an effort level at End Day.

### Tests for User Story 8

- [X] T067 [P] [US8] Write E2E test in `__tests__/e2e/us8-effort-levels.spec.ts`: happy path (parent creates "Great" effort at 50pts → kid completes all chores → selects "Great" → End Day → 50pts awarded)

### Implementation for User Story 8

- [X] T068 [US8] Implement `lib/db/effort-levels.ts`: `createEffortLevel`, `getEffortLevels`, `updateEffortLevel`, `deleteEffortLevel` using typed Supabase server client
- [X] T069 [US8] Implement effort level server actions in `lib/actions/effort-levels.ts`: `createEffortLevel`, `updateEffortLevel`, `deleteEffortLevel`, `getEffortLevels` with family ownership check
- [X] T070 [US8] Create effort levels management page `app/(admin)/effort/page.tsx`: list effort levels with add/edit/delete form; shadcn Table for listing; all via TanStack Query

**Checkpoint**: Parent manages effort levels; they appear in the EffortDropdown during End Day.

---

## Phase 11: User Story 9 — Activity Log (Priority: P9)

**Goal**: All key events recorded; parent and kid can view full family activity log.

**Independent Test**: Check a chore and redeem a reward; both events appear in the activity log.

### Tests for User Story 9

- [X] T071 [P] [US9] Write integration test in `__tests__/integration/activity-log.test.ts`: RLS — kid can only see entries for own family; parent can see all family entries; `getActivityLog` returns entries in reverse chronological order
- [X] T072 [P] [US9] Write E2E test in `__tests__/e2e/us9-activity-log.spec.ts`: after chore_completed, rest_day_purchased, reward_redeemed, and day_ended events — all appear in activity log with correct action_type, kid name, and points_delta

### Implementation for User Story 9

- [X] T073 [US9] Implement `lib/db/activity-log.ts`: `insertActivityLog`, `getActivityLog` (paginated, family-scoped) using typed Supabase server client; confirm all server actions that mutate state already call this
- [X] T074 [US9] Implement activity log server action in `lib/actions/activity-log.ts`: `getActivityLog` with optional kidId filter and cursor pagination
- [X] T075 [P] [US9] Create `components/activity-log/ActivityLogTable.tsx`: TanStack Table with columns (date, kid name, action, points delta); subscribe to Supabase Realtime `activity_log` channel to auto-refresh via `queryClient.invalidateQueries`
- [X] T076 [US9] Create activity log page `app/(dashboard)/activity/page.tsx`: renders ActivityLogTable; loads initial data server-side via TanStack Query; Realtime subscription wired in client component wrapper

**Checkpoint**: Activity log captures all events in real time; viewable by parent and kid.

---

## Phase 12: User Story 10 — Calendar & Past Dates (Priority: P10)

**Goal**: Calendar marks completed days; any past date remains editable until End Day is triggered.

**Independent Test**: End a day; calendar marks it; tap another past date without End Day and still update chores.

### Tests for User Story 10

- [X] T077 [P] [US10] Write E2E test in `__tests__/e2e/us10-calendar.spec.ts`: happy path (End Day on today → calendar marks date → tap past non-ended date → chore toggle works → End Day locks it); deprioritized UI (current date visually primary)

### Implementation for User Story 10

- [X] T078 [US10] Create `components/calendar/CalendarView.tsx`: shadcn Calendar component; mark dates with `ended_at` set using a custom DayCell; current date highlighted as primary; clicking any date navigates to that date's view
- [X] T079 [US10] Create calendar page `app/(dashboard)/calendar/page.tsx`: renders CalendarView; fetches all day_record dates for the family via TanStack Query to determine which dates are marked
- [X] T080 [US10] Update `app/(dashboard)/page.tsx` to accept an optional `?date=YYYY-MM-DD` query parameter; load DayRecord for that date; show read-only state if `ended_at` is set, editable state otherwise

**Checkpoint**: Calendar marks ended days; clicking any past date shows its state (read-only or editable).

---

## Phase 13: Polish & Cross-Cutting Concerns

**Purpose**: Offline support, Realtime wiring, PWA install, UI polish, final test run.

- [X] T081 Configure Serwist in `next.config.ts` with `@serwist/next`; create `app/sw.ts` service worker entry with `CacheFirst` for app shell (precached) and `StaleWhileRevalidate` for dashboard pages
- [X] T082 [P] Add Supabase Realtime subscription in `components/navbar/PointsBadge.tsx`: subscribe to `kids` table changes for own kid_id, call `queryClient.invalidateQueries(['points'])` on update
- [X] T083 [P] Create `components/pwa/InstallPrompt.tsx`: detect `beforeinstallprompt` event; show iOS install instructions on Safari; integrate into dashboard layout
- [X] T084 [P] Kid-friendly UI pass: apply consistent color scheme (bright, playful), add icon animations on chore completion (shadcn transition classes), add confetti or celebration state on End Day
- [X] T085 [P] Run full Playwright E2E suite against seeded local Supabase; fix any failures
- [X] T086 [P] Run full Vitest unit + integration suite; verify 100% coverage of `lib/points.ts` and all RLS integration tests pass

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 — **BLOCKS all user stories**
- **Phase 3–12 (User Stories)**: All depend on Phase 2 completion; can proceed in priority order
- **Phase 13 (Polish)**: Depends on all desired user stories complete

### User Story Dependencies

- **US1 (P1)**: Unblocked after Phase 2 — no story dependencies
- **US2 (P2)**: Depends on US1 (needs parent session + family to add kids)
- **US3 (P3)**: Depends on US2 (needs kids to assign chores to)
- **US4 (P4)**: Depends on US3 (needs chore assignments to track)
- **US5 (P5)**: Depends on US4 (rest day filters the chore list)
- **US6 (P6)**: Depends on US4 (end day finalizes chore completions)
- **US7 (P7)**: Depends on US2 (needs kids with point balances)
- **US8 (P8)**: Depends on US6 (effort levels used in End Day flow)
- **US9 (P9)**: Depends on US4+ (activity log populated by chore/reward events)
- **US10 (P10)**: Depends on US6 (calendar marks days with ended_at)

### Within Each User Story

- Integration/unit tests FIRST (write and confirm they fail before implementation)
- E2E tests SECOND (write stub, confirm failure)
- DB helpers → server actions → UI components → page
- Commit after each story checkpoint

### Parallel Opportunities

- Within Phase 1: T002, T003, T005, T006, T007, T008 can all run in parallel after T001
- Within Phase 2: T012, T013 can run in parallel after T010; T015, T016, T017 can run in parallel
- Within each story: Integration test [P] and E2E test [P] can be written in parallel
- US7 can be worked in parallel with US5/US6 (different tables and pages)

---

## Parallel Example: User Story 4 (Chore Tracking)

```
Parallel write:
  T042: Integration test for day-records
  T043: E2E test for chore tracking

Then sequential:
  T044: lib/db/day-records.ts
  T045: lib/actions/day-records.ts

Parallel after T045:
  T046: ChoreItem component
  T047: ChoreList component

Then sequential:
  T048: Dashboard page (depends on T046, T047)
```

---

## Implementation Strategy

### MVP First (User Stories 1–4)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (**CRITICAL**)
3. Complete Phase 3: US1 — Parent auth
4. Complete Phase 4: US2 — Kid accounts
5. Complete Phase 5: US3 — Chore library
6. Complete Phase 6: US4 — Daily tracking
7. **STOP and VALIDATE**: Parent + kid can log in, see and check chores independently

### Incremental Delivery

- After US4: Core daily loop is functional (check chores, family setup)
- After US6: Point economy active (penalties + effort rewards)
- After US7: Kids can spend points on rewards
- After US10: Full feature parity with spec

---

## Notes

- All tasks follow `- [ ] TXX [P?] [Story?] Description with file path` format
- [P] = different files, no in-flight dependencies
- Constitution requires tests — test tasks are mandatory, not optional
- Write tests first, ensure they fail, then implement
- `lib/points.ts` must be pure functions (no Supabase calls) for easy unit testing
- Server actions must call `lib/db/*` helpers (never query Supabase directly)
- All server actions must verify auth before accessing data
