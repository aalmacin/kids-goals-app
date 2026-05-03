# Tasks: Fix Kids Pages 404 and Missing Chores

**Input**: Design documents from `specs/004-fix-kids-pages-404/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, quickstart.md

**Tests**: Not explicitly requested. E2E test included per constitution requirement (Principle V).

**Organization**: Tasks grouped by user story. Both stories are addressed by the same fix since "chores not showing" is caused by the 404 routing issue.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

---

## Phase 1: Setup

**Purpose**: No project setup needed — this is a bug fix in an existing codebase.

(No tasks)

---

## Phase 2: Foundational

**Purpose**: No foundational changes needed — existing infrastructure is correct.

(No tasks)

---

## Phase 3: User Story 1 - Kids Can Access Dashboard Pages (Priority: P1) + User Story 2 - Assigned Chores Display (Priority: P1)

**Goal**: Fix NavBar links to use correct route paths so all kid-facing pages load and chores display on the dashboard.

**Independent Test**: Log in as a kid, click each nav link (Today, Rewards, Activity, Calendar), and verify all pages load without 404. Verify assigned chores appear on the dashboard.

### Implementation

- [x] T001 [US1] Fix logo link from `/dashboard` to `/` in `components/navbar/NavBar.tsx`
- [x] T002 [US1] Fix kid "Today" link from `/dashboard` to `/` in `components/navbar/NavBar.tsx`
- [x] T003 [US1] Fix kid "Rewards" link from `/dashboard/rewards` to `/rewards` in `components/navbar/NavBar.tsx`
- [x] T004 [US1] Fix kid "Activity" link from `/dashboard/activity` to `/activity` in `components/navbar/NavBar.tsx`
- [x] T005 [US1] Fix kid "Calendar" link from `/dashboard/calendar` to `/calendar` in `components/navbar/NavBar.tsx`
- [x] T006 [US1] Fix parent "Activity" link from `/dashboard/activity` to `/activity` in `components/navbar/NavBar.tsx`
- [x] T007 [US1] Verify build succeeds with `npm run build`

**Checkpoint**: All nav links should now work. Kids can access all pages and see their assigned chores.

---

## Phase 4: User Story 3 - Activity Log Shows Only Own Activity (Priority: P1)

**Goal**: Filter activity log entries by kidId when logged in as a kid.

**Independent Test**: Log in as a kid in a family with multiple kids. Verify only own activity entries appear.

### Implementation

- [x] T008 [US3] Filter activity log by kidId for kid users in `app/(dashboard)/activity/page.tsx`

**Checkpoint**: Kid activity log shows only own entries. Parent view still shows all family activity.

---

## Phase 5: User Story 4 - Calendar Date Navigation Works (Priority: P1)

**Goal**: Fix calendar date click to navigate to correct URL.

**Independent Test**: Navigate to calendar, click a date, verify dashboard loads for that date.

### Implementation

- [x] T009 [US4] Fix calendar navigation from `/dashboard?date=` to `/?date=` in `components/calendar/CalendarView.tsx`

**Checkpoint**: Calendar date clicks load the correct dashboard view.

---

## Phase 6: User Story 5 - Chores Appear After Late Assignment (Priority: P1)

**Goal**: Backfill chore completions for assignments added after the day record was created.

**Independent Test**: Create a kid, visit dashboard (creates empty day record), assign chores via admin, refresh dashboard, verify chores appear.

### Implementation

- [x] T010 [US5] Backfill completions for new assignments on existing day records in `lib/db/day-records.ts`

**Checkpoint**: Newly assigned chores appear on dashboard even if day record was created before assignment.

---

## Phase 7: User Story 6 - Chore Checkbox Renders Without Duplication (Priority: P1)

**Goal**: Fix duplicate checkbox caused by CSP blocking base-ui's inline styles on native input.

**Independent Test**: Log in as a kid with chores, verify each chore row shows exactly one checkbox.

### Implementation

- [x] T011 [US6] Add `[&_input]:sr-only` to Checkbox component to hide native input via CSS in `components/ui/checkbox.tsx`

**Checkpoint**: Each chore displays a single checkbox control.

---

## Phase 8: Polish & Cross-Cutting Concerns

- [x] T012 Verify build succeeds with `npm run build`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 3**: No dependencies — can start immediately
- **Phase 4–7**: Independent of each other, can run in parallel
- **Phase 8**: Depends on all previous phases

### User Story Dependencies

- **US1+US2** (NavBar links): Independent
- **US3** (Activity filtering): Independent
- **US4** (Calendar nav): Independent
- **US5** (Chore backfill): Independent
- **US6** (Checkbox duplication): Independent

### Parallel Opportunities

- T001–T006 are all in `NavBar.tsx` (sequential)
- T008, T009, T010, T011 are in different files (parallelizable)

---

## Implementation Strategy

### All fixes applied

1. T001–T007: NavBar link fixes + build verification
2. T008: Activity log kid filtering
3. T009: Calendar navigation fix
4. T010: Chore backfill for existing day records
5. T011: Checkbox duplicate fix
6. T012: Final build verification

---

## Notes

- Root cause of 404s: `(dashboard)` is a Next.js route group — parenthesized folders don't create URL segments
- Same `/dashboard` prefix bug existed in both `NavBar.tsx` and `CalendarView.tsx`
- Activity log RLS allows family-wide access; application-level filtering is needed for kid users
- Chore backfill handles the case where parent assigns chores after kid has already visited the dashboard
- Duplicate checkbox caused by CSP nonce blocking base-ui's inline styles on the native `<input>`; fixed with `[&_input]:sr-only` CSS class
