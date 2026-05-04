# Tasks: Family Page

**Input**: Design documents from `specs/005-kid-comparison/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/family-page.md

**Tests**: E2E test included per constitution requirement (Principle V). No TDD explicitly requested.

**Organization**: Tasks grouped by user story. US2 (daily progress) and US3 (weekly summary) both depend on the foundational `lib/db/family.ts` module and the Family page route established in US1.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

---

## Phase 1: Setup

**Purpose**: No new project infrastructure needed — migrating an existing feature.

(No tasks)

---

## Phase 2: Foundational

**Purpose**: New DB module with renamed types and updated functions; required by all user story phases.

**⚠️ CRITICAL**: All user story phases depend on this phase completing first.

- [ ] T001 Create `lib/db/family.ts` — export `FamilyMember` type (renamed from `SiblingKid`), `DailyProgressEntry` (add `pointsEarnedToday: number` field), `WeeklySummaryEntry`; implement `getFamilyMembers(familyId)` (renamed from `getSiblings`), `getTodayDailyProgress(members, today)` (extend to sum `activity_log.points_delta` per kid where `DATE(created_at) = today` into `pointsEarnedToday`), and `getWeeklyPointsSummary(familyId, members, sevenDaysAgo)`

**Checkpoint**: `lib/db/family.ts` compiles with strict TypeScript; all three functions exportable.

---

## Phase 3: User Story 1 - Kid Views Family Leaderboard (Priority: P1) 🎯 MVP

**Goal**: Kids navigate to `/family`, see all family members (including themselves) ranked by total points. `/compare` redirects to `/family`. NavBar shows "Family" link.

**Independent Test**: Log in as a kid in a multi-kid family, navigate to `/family`, verify leaderboard renders with correct ranking and self-highlight. Navigate to `/compare` and verify redirect to `/family`. Log in as a single-kid family member and verify their card renders alone (no error message).

### Implementation

- [ ] T002 [P] [US1] Create `components/family/Leaderboard.tsx` — accepts `kids: FamilyMember[]` and `currentKidId: string`; renders ranked Cards using shadcn Card + Badge; highlights current kid with `border-indigo-400 bg-indigo-50` and "You" badge; imports from `lib/db/family`
- [ ] T003 [P] [US1] Update `app/(dashboard)/compare/page.tsx` — replace all content with `redirect('/family')` (single import + single call); remove all other imports
- [ ] T004 [P] [US1] Update `components/navbar/NavBar.tsx` — change href `/compare` → `/family` and label "Compare" → "Family" for `session.role === 'kid'` nav links
- [ ] T005 [US1] Create `components/family/FamilyPageClient.tsx` — `'use client'` component accepting `FamilyPageClientProps` per `contracts/family-page.md`; uses TanStack Query `useQuery(['familyMembers', familyId], ...)` with `initialData: initialMembers`; subscribes to Supabase Realtime `kids` table `UPDATE` events filtered by `family_id` and calls `queryClient.invalidateQueries(['familyMembers', familyId])` on event; renders `<Leaderboard>` section (depends on T002)
- [ ] T006 [US1] Create `app/(dashboard)/family/page.tsx` — Server Component; authenticates via `supabase.auth.getUser()`, redirects to `/login` if unauthenticated; redirects to `/admin` if parent; queries kid by `supabase_user_id`; calls `getFamilyMembers(kid.family_id)` with fallback to `[{ id: kid.id, name: kid.name, points: kid.points }]` when empty; fetches `getTodayDailyProgress` and `getWeeklyPointsSummary` in parallel; renders `<FamilyPageClient>` with all initial data props (depends on T001, T005)

**Checkpoint**: Kids can access `/family` and see the leaderboard. `/compare` redirects correctly. NavBar shows "Family". Single-kid families see their own card.

---

## Phase 4: User Story 2 - Kid Views Family Daily Chore Progress (Priority: P2)

**Goal**: The Family page shows today's chore completion progress (completed/total) and points earned today for each family member.

**Independent Test**: Assign chores to multiple kids, complete some as Kid A, log in as Kid B, navigate to `/family`, verify each kid's completion fraction, progress bar, rest-day indicator, and today's earned points.

### Implementation

- [ ] T007 [P] [US2] Create `components/family/DailyProgress.tsx` — accepts `progress: DailyProgressEntry[]` and `currentKidId: string`; renders Cards with chore progress fraction, Tailwind progress bar, rest-day Badge, "Done ✓" Badge, and `pointsEarnedToday` when > 0; imports from `lib/db/family`
- [ ] T008 [US2] Add daily progress section to `components/family/FamilyPageClient.tsx` — add `useQuery(['dailyProgress', familyId, today], ...)` with `initialData: initialDailyProgress`; render `<DailyProgress>` section below Leaderboard (depends on T007)

**Checkpoint**: Family page now shows leaderboard + daily chore progress with real data per family member.

---

## Phase 5: User Story 3 - Kid Views Weekly Summary (Priority: P3)

**Goal**: The Family page shows each family member's points earned over the past 7 days.

**Independent Test**: Ensure kids have activity log entries over the past 7 days, navigate to `/family`, verify weekly points are displayed and ranked correctly.

### Implementation

- [ ] T009 [P] [US3] Create `components/family/WeeklySummary.tsx` — accepts `summary: WeeklySummaryEntry[]` and `currentKidId: string`; renders ranked Cards showing `+N ⭐` weekly points with self-highlight; imports from `lib/db/family`
- [ ] T010 [US3] Add weekly summary section to `components/family/FamilyPageClient.tsx` — add `useQuery(['weeklySummary', familyId, sevenDaysAgo], ...)` with `initialData: initialWeeklySummary`; render `<WeeklySummary>` section below DailyProgress (depends on T009)

**Checkpoint**: All three sections (leaderboard, daily progress, weekly summary) are visible on `/family`.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [ ] T011 [P] Delete `lib/db/compare.ts` — replaced by `lib/db/family.ts`
- [ ] T012 [P] Delete `components/compare/` directory — all three components replaced by `components/family/`
- [ ] T013 Update Playwright E2E test in `__tests__/e2e/` — update route from `/compare` to `/family`, remove "no siblings" scenario, add single-member render scenario; keep unauthenticated redirect test (constitution Principle V)
- [ ] T014 Verify build succeeds with `bun run build`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 2 (Foundational)**: No dependencies — can start immediately
- **Phase 3 (US1)**: Depends on T001 (DB module); T002–T004 can start in parallel; T005 depends on T002; T006 depends on T001 + T005
- **Phase 4 (US2)**: Depends on T006 (page exists) + T001 (DB module); can start after Phase 3 checkpoint
- **Phase 5 (US3)**: Depends on T006 + T001; can start after Phase 3 checkpoint (parallel with Phase 4)
- **Phase 6 (Polish)**: Depends on all previous phases

### User Story Dependencies

- **US1**: Depends on T001 — establishes the `/family` route
- **US2**: Depends on US1 (FamilyPageClient exists) + T001 (DailyProgressEntry type)
- **US3**: Depends on US1 (FamilyPageClient exists) + T001 (WeeklySummaryEntry type); independent of US2

### Parallel Opportunities

- T002, T003, T004 are in different files — can run in parallel within US1
- T007 and T009 are in different files — can run in parallel across US2/US3
- T008 and T010 both modify `FamilyPageClient.tsx` — must run sequentially
- T011 and T012 are in different locations — can run in parallel in Polish

---

## Parallel Example: User Story 1

```bash
# These can run in parallel (different files):
Task: "Create components/family/Leaderboard.tsx"
Task: "Update app/(dashboard)/compare/page.tsx redirect"
Task: "Update components/navbar/NavBar.tsx Family link"

# Then sequentially:
Task: "Create components/family/FamilyPageClient.tsx" (needs Leaderboard)
Task: "Create app/(dashboard)/family/page.tsx" (needs FamilyPageClient + DB module)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete T001 (`lib/db/family.ts`)
2. Complete T002–T004 in parallel (Leaderboard, redirect, NavBar)
3. Complete T005 (FamilyPageClient with Leaderboard section)
4. Complete T006 (family/page.tsx)
5. **STOP and VALIDATE**: Family page works end-to-end; redirect from `/compare` works
6. Deploy/demo if ready

### Incremental Delivery

1. T001 → DB module ready
2. T002–T006 → Family page with leaderboard (US1 MVP)
3. T007–T008 → Daily progress added (US2)
4. T009–T010 → Weekly summary added (US3)
5. T011–T014 → Cleanup, tests, build verification

---

## Notes

- `lib/db/family.ts` must be created before any component that imports `FamilyMember` or related types
- `getFamilyMembers` returns all family members including the logged-in kid — no guard needed; self-highlight uses `kid.id === currentKidId`
- Family page fallback: if `getFamilyMembers` returns empty, render `[{ id: kid.id, name: kid.name, points: kid.points }]`
- Supabase Realtime requires the Supabase client to be initialized in the client component context
- Use `bun run build` for all build verification (not npm)
- Ensure `bunx supabase migration up` has been run locally before testing (migration 0007 must be active)
