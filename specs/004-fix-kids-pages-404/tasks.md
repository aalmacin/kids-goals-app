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

- [ ] T001 [US1] Fix logo link from `/dashboard` to `/` in `components/navbar/NavBar.tsx`
- [ ] T002 [US1] Fix kid "Today" link from `/dashboard` to `/` in `components/navbar/NavBar.tsx`
- [ ] T003 [US1] Fix kid "Rewards" link from `/dashboard/rewards` to `/rewards` in `components/navbar/NavBar.tsx`
- [ ] T004 [US1] Fix kid "Activity" link from `/dashboard/activity` to `/activity` in `components/navbar/NavBar.tsx`
- [ ] T005 [US1] Fix kid "Calendar" link from `/dashboard/calendar` to `/calendar` in `components/navbar/NavBar.tsx`
- [ ] T006 [US1] Fix parent "Activity" link from `/dashboard/activity` to `/activity` in `components/navbar/NavBar.tsx`
- [ ] T007 [US1] Verify build succeeds with `npm run build`

**Checkpoint**: All nav links should now work. Kids can access all pages and see their assigned chores.

---

## Phase 4: Polish & Cross-Cutting Concerns

- [ ] T008 Run quickstart.md validation (build + manual nav link verification)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 3**: No dependencies — can start immediately
- **Phase 4**: Depends on Phase 3 completion

### User Story Dependencies

- **User Story 1 (P1)** and **User Story 2 (P1)** are resolved by the same fix — no inter-story dependencies

### Parallel Opportunities

- T001–T006 are all edits to the same file (`NavBar.tsx`) so they must be done sequentially (or as a single edit)

---

## Implementation Strategy

### MVP First

1. Complete T001–T006 (single file edit in `NavBar.tsx`)
2. Run T007 (build verification)
3. Run T008 (manual verification)
4. Done — both user stories resolved

### Single Edit Approach

All 6 link fixes are in the same file and can be done as a single edit operation. The task breakdown exists for traceability, but in practice this is one change.

---

## Notes

- All tasks target a single file: `components/navbar/NavBar.tsx`
- Root cause: `(dashboard)` is a Next.js route group — parenthesized folders don't create URL segments
- The "chores not showing" bug is a symptom of the 404 — once kids can reach `/`, chores display correctly
