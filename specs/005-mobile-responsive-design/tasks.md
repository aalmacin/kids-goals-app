# Tasks: Mobile-Friendly Responsive Design

**Input**: Design documents from `/specs/005-mobile-responsive-design/`
**Prerequisites**: plan.md, spec.md, research.md

**Organization**: Tasks grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to
- Exact file paths in all descriptions

---

## Phase 1: Setup

N/A — project is fully configured. No new packages, no schema changes, no infrastructure needed.

---

## Phase 2: Foundational

N/A — all user stories are independent UI-only changes with no shared prerequisites.

---

## Phase 3: User Story 1 - Kid Views Dashboard on Phone (Priority: P1) MVP

**Goal**: Dashboard renders without horizontal scroll on 375px viewports; hamburger nav is accessible and tappable.

**Independent Test**: Open dashboard at 375px in DevTools — all content visible, no horizontal scroll, hamburger opens Sheet drawer with all nav links.

### Implementation for User Story 1

- [x] T001 [P] [US1] Create `components/navbar/MobileMenu.tsx` — new `'use client'` component accepting `session`, `kidPoints`, `kidId`, `familyName` props; uses `useState` to control Sheet open/close; renders `<Button variant="ghost" size="icon">` with `<Menu>` icon as `SheetTrigger`; Sheet side="right" contains stacked nav links and logout form
- [x] T002 [US1] Modify `components/navbar/NavBar.tsx` — add `hidden md:flex` to existing desktop nav links container; add `<MobileMenu>` component with `md:hidden` class passing all required props
- [x] T003 [P] [US1] Modify `app/(dashboard)/layout.tsx` — change `p-6` to `p-4 md:p-6` on the `<main>` container

**Checkpoint**: Dashboard is fully usable on a 375px phone — no horizontal scroll, hamburger opens all nav links.

---

## Phase 4: User Story 2 - Parent Manages Family on Tablet (Priority: P2)

**Goal**: Admin layout has hamburger nav on mobile; admin kids page card actions stack vertically on small screens.

**Independent Test**: Open admin pages at 768px — layout uses space effectively; open at 375px — hamburger opens admin nav Sheet; kid cards stack info above action controls.

### Implementation for User Story 2

- [x] T004 [P] [US2] Create `components/admin/AdminMobileMenu.tsx` — new `'use client'` component accepting `familyExists: boolean` prop; same Sheet + hamburger pattern as `MobileMenu`; Sheet contains admin nav links (`Kids`, `Chores`, `Effort`, `Family`, `Rewards`) conditionally rendered based on `familyExists`
- [x] T005 [US2] Modify `app/(admin)/admin/layout.tsx` — add `hidden md:flex` to desktop nav links; add `<AdminMobileMenu familyExists={...}>` with `md:hidden`; change main container padding from `p-6` to `p-4 md:p-6`
- [x] T006 [US2] Modify `app/(admin)/admin/kids/page.tsx` — change kid card layout from `flex items-center justify-between p-4` to `p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3`; wrap action controls (points adjust form + delete button) in `<div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">`

**Checkpoint**: Admin is fully usable on mobile — hamburger opens all admin nav links; kid cards are readable and all controls accessible on 375px.

---

## Phase 5: User Story 3 - Login Pages Work on Any Screen Size (Priority: P3)

**Goal**: Login and kid-login pages render correctly at 320px, 375px, and 768px with no overflow and fully usable form controls.

**Independent Test**: Open login and kid-login pages at 320px — form fields, labels, and submit button fully visible without horizontal scroll or overflow.

### Implementation for User Story 3

- [x] T007 [P] [US3] Audit login page (locate under `app/` — search for the login route) — ensure form container uses `w-full max-w-md mx-auto px-4` or equivalent; verify all inputs, labels, and submit button have no fixed widths that overflow at 320px; apply Tailwind responsive fixes as needed
- [x] T008 [P] [US3] Audit kid-login page (locate under `app/` — search for kid-login or kids login route) — apply same responsive fixes: fluid container width, no overflow at 320px, inputs and buttons meet 44px tap target minimum

**Checkpoint**: Both login pages render correctly and are fully functional at 320px without pinch-to-zoom.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: E2E test coverage across all user stories

- [x] T009 Create `__tests__/e2e/mobile-responsive.spec.ts` — Playwright tests at `{ width: 375, height: 812 }` viewport; use `page.setViewportSize` in `beforeEach`; cover: (1) login page renders without horizontal scroll — assert `document.documentElement.scrollWidth <= 375`, (2) dashboard hamburger button visible and opens Sheet drawer, (3) admin hamburger button visible and opens Sheet drawer

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1–2**: N/A
- **Phase 3 (US1)**: No dependencies — start immediately
- **Phase 4 (US2)**: No dependencies on US1 — can start in parallel with US1
- **Phase 5 (US3)**: No dependencies on US1 or US2 — can start in parallel
- **Phase 6 (Polish)**: Depends on US1 and US2 completion (tests cover both hamburger menus)

### User Story Dependencies

- **US1 (P1)**: Independent — no dependency on US2 or US3
- **US2 (P2)**: Independent — no dependency on US1 or US3
- **US3 (P3)**: Independent — no dependency on US1 or US2

### Within Each User Story

- T001 before T002 (MobileMenu must exist before NavBar imports it)
- T003 is independent of T001/T002 (different file)
- T004 before T005 (AdminMobileMenu must exist before layout imports it)
- T006 is independent of T004/T005 (different file)
- T007 and T008 are independent of each other

### Parallel Opportunities

- T001 and T003 can run in parallel (different files)
- T004 and T006 can run in parallel (different files)
- T007 and T008 can run in parallel (different files)
- After US1 foundational work: US2 and US3 can all run fully in parallel

---

## Parallel Example: User Story 1

```bash
# These two tasks touch different files — run in parallel:
Task T001: Create components/navbar/MobileMenu.tsx
Task T003: Modify app/(dashboard)/layout.tsx padding

# Then sequentially:
Task T002: Modify components/navbar/NavBar.tsx (depends on T001)
```

---

## Parallel Example: User Story 2

```bash
# These two tasks touch different files — run in parallel:
Task T004: Create components/admin/AdminMobileMenu.tsx
Task T006: Modify app/(admin)/admin/kids/page.tsx

# Then sequentially:
Task T005: Modify app/(admin)/admin/layout.tsx (depends on T004)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 3: US1 (T001 → T003 in parallel, then T002)
2. **STOP and VALIDATE**: Test dashboard at 375px — no horizontal scroll, hamburger works
3. Demo/deploy MVP

### Incremental Delivery

1. Phase 3 (US1) → validate dashboard mobile → deploy
2. Phase 4 (US2) → validate admin mobile → deploy
3. Phase 5 (US3) → validate login pages → deploy
4. Phase 6 (Polish) → E2E test coverage

### Parallel Team Strategy

With multiple developers, after US1's MobileMenu is created:
- Developer A: US1 (T001, T003, T002)
- Developer B: US2 (T004, T006, T005)
- Developer C: US3 (T007, T008)

---

## Notes

- [P] tasks = different files, no inter-task dependencies
- [Story] label maps each task to its user story for traceability
- No new npm packages — `Sheet` from shadcn and `Menu` from lucide-react are already installed
- No database or auth changes
- Tailwind responsive prefixes (`sm:`, `md:`) are the primary implementation mechanism
- `'use client'` directive required on MobileMenu and AdminMobileMenu; parent layouts remain server components
