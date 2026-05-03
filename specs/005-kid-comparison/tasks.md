# Tasks: Kid Comparison

**Input**: Design documents from `specs/005-kid-comparison/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, quickstart.md

**Tests**: Not explicitly requested. E2E test included per constitution requirement (Principle V).

**Organization**: Tasks grouped by user story. US2 (daily progress) and US3 (weekly summary) both depend on the compare page route established in US1 and reuse the DB helpers module.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

---

## Phase 1: Setup

**Purpose**: No new project infrastructure needed — this is a new feature in an existing codebase.

(No tasks)

---

## Phase 2: Foundational

**Purpose**: RLS policies and DB helper module that all three user stories depend on.

**⚠️ CRITICAL**: All user story phases depend on this phase completing first.

- [x] T001 Create Supabase migration adding three RLS policies (`kid_select_sibling_kids`, `kid_select_sibling_day_records`, `kid_select_sibling_chore_completions`) in `supabase/migrations/0007_kid_comparison_rls.sql`
- [x] T002 Create `lib/db/compare.ts` with three exported async functions: `getSiblings(familyId)`, `getTodayDailyProgress(siblings, today)`, and `getWeeklyPointsSummary(familyId, siblings, sevenDaysAgo)`

**Checkpoint**: RLS allows cross-sibling reads; DB helpers are ready for use by all user story phases.

---

## Phase 3: User Story 1 - Kid Views Family Leaderboard (Priority: P1) 🎯 MVP

**Goal**: Kids can navigate to `/compare` and see all siblings ranked by total points, with their own row highlighted.

**Independent Test**: Log in as a kid in a multi-kid family, navigate to `/compare`, verify leaderboard renders with correct ranking and self-highlight. Log in as a single-child kid and verify the empty-siblings message.

### Implementation

- [x] T003 [US1] Create `components/compare/Leaderboard.tsx` — renders ranked list of kids using shadcn Card and Badge; accepts `kids: { id, name, points }[]` and `currentKidId: string` props; highlights current kid's row with indigo styling and "You" badge
- [x] T004 [US1] Create `app/(dashboard)/compare/page.tsx` — Server Component that: (1) authenticates user, (2) redirects parent to `/admin`, (3) fetches siblings via `getSiblings`, (4) renders `<Leaderboard>` or empty-siblings message when only one kid, (5) fetches and renders daily progress and weekly summary in parallel
- [x] T005 [US1] Add "Compare" nav link in `components/navbar/NavBar.tsx` for `session.role === 'kid'` pointing to `/compare`

**Checkpoint**: Kids can access `/compare`, see the leaderboard, and identify themselves. Single-child families see an appropriate message.

---

## Phase 4: User Story 2 - Kid Compares Daily Chore Progress (Priority: P2)

**Goal**: The comparison page shows today's chore completion progress (completed/total) for each sibling.

**Independent Test**: Assign chores to multiple kids, complete some chores as Kid A, navigate to `/compare` as Kid B, verify each kid's completion fraction and rest-day indicator are shown correctly.

### Implementation

- [x] T006 [US2] Create `components/compare/DailyProgress.tsx` — renders kid cards showing `completedCount/totalCount` chores with an inline Tailwind progress bar and rest-day Badge; accepts `progress: { kidId, name, completedCount, totalCount, isRestDay }[]` and `currentKidId: string` props
- [x] T007 [US2] Wire `<DailyProgress>` into `app/(dashboard)/compare/page.tsx` using data from `getTodayDailyProgress`

**Checkpoint**: The compare page now shows both the leaderboard and today's chore progress per sibling.

---

## Phase 5: User Story 3 - Kid Views Weekly Summary Comparison (Priority: P3)

**Goal**: The comparison page shows each sibling's points earned over the past 7 days.

**Independent Test**: Ensure kids have activity log entries over the past week, navigate to `/compare`, verify weekly points are displayed and ranked correctly.

### Implementation

- [x] T008 [US3] Create `components/compare/WeeklySummary.tsx` — renders a ranked list of kids by weekly points earned using shadcn Card and Badge; accepts `summary: { kidId, name, weeklyPoints }[]` and `currentKidId: string` props
- [x] T009 [US3] Wire `<WeeklySummary>` into `app/(dashboard)/compare/page.tsx` using data from `getWeeklyPointsSummary`

**Checkpoint**: All three comparison sections (leaderboard, daily progress, weekly summary) are visible on `/compare`.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [x] T010 Verify build succeeds with `bun run build`
- [x] T011 Create Playwright E2E test for compare page in `__tests__/e2e/us11-kid-comparison.spec.ts` — unauthenticated access redirects to login (auth failure path per constitution Principle V)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 2 (Foundational)**: No dependencies — can start immediately
- **Phase 3 (US1)**: Depends on T001, T002
- **Phase 4 (US2)**: Depends on T004 (page exists) + T002 (DB helper); can start after Phase 3 checkpoint
- **Phase 5 (US3)**: Depends on T004 + T002; can start after Phase 3 checkpoint (parallel with Phase 4)
- **Phase 6**: Depends on all previous phases

### User Story Dependencies

- **US1**: Depends on Foundational (T001, T002) — establishes the page
- **US2**: Depends on US1 (page route) + T002 (DB helper function)
- **US3**: Depends on US1 (page route) + T002 (DB helper function); independent of US2

### Parallel Opportunities

- T003 and T005 are in different files — can run in parallel within US1
- T006 and T008 are in different files — can run in parallel across US2/US3
- T007 and T009 both update `compare/page.tsx` — must run sequentially

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete T001 (RLS migration)
2. Complete T002 (`getSiblings` function only)
3. Complete T003–T005 (leaderboard + page + nav link)
4. **STOP and VALIDATE**: Leaderboard works end-to-end
5. Demo/deploy if ready

### Incremental Delivery

1. T001–T002 → Foundation ready
2. T003–T005 → Leaderboard (US1 MVP)
3. T006–T007 → Daily progress (US2)
4. T008–T009 → Weekly summary (US3)
5. T010–T011 → Build verification + E2E test

---

## Notes

- RLS migration must be applied to local Supabase before testing locally (`supabase migration up`)
- `getSiblings` returns all kids in the family including the logged-in kid; highlight self by comparing `kid.id === currentKidId` in UI
- `getTodayDailyProgress` handles kids with no day_record yet (returns `completedCount: 0, totalCount: 0`)
- `getWeeklyPointsSummary` only sums entries where `points_delta IS NOT NULL`
- The compare page is read-only — no Server Actions needed
- Use `bun run build` for all build verification (not npm)
