# Tasks: Logo and Favicon

**Input**: Design documents from `specs/003-logo-favicon/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Copy icon assets to the project

- [ ] T001 [P] Copy favicon.ico from ~/Documents/2026/Kids Goals App/favicon.ico to app/favicon.ico (replace existing)
- [ ] T002 [P] Copy favicon.svg to public/favicon.svg
- [ ] T003 [P] Copy favicon-16.png to public/favicon-16.png
- [ ] T004 [P] Copy favicon-32.png to public/favicon-32.png
- [ ] T005 [P] Copy favicon-192.png to public/favicon-192.png
- [ ] T006 [P] Copy favicon-512.png to public/favicon-512.png
- [ ] T007 [P] Copy apple-touch-icon-180.png to public/apple-touch-icon.png
- [ ] T008 [P] Copy kids_goals_app_logo.svg to public/logo.svg

**Checkpoint**: All static assets are in place

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Configure Next.js metadata and manifest to reference the new icons

**CRITICAL**: No user story work can begin until this phase is complete

- [ ] T009 Update metadata icons configuration in app/layout.tsx to include favicon.svg, favicon-16.png, favicon-32.png, and apple-touch-icon references
- [ ] T010 Update app/manifest.ts to reference favicon-192.png and favicon-512.png (replace current icon-192x192.png and icon-512x512.png references)
- [ ] T011 Remove unused default icon files from public/ (file.svg, globe.svg, next.svg, vercel.svg, window.svg)

**Checkpoint**: Foundation ready - favicons and PWA icons serve correctly

---

## Phase 3: User Story 1 - App Identity in Browser (Priority: P1)

**Goal**: Display logo in app header and favicon in browser tab

**Independent Test**: Open app in browser, verify favicon in tab and logo in header

### Implementation for User Story 1

- [ ] T012 [US1] Create logo component in components/app-logo.tsx that renders public/logo.svg with text fallback
- [ ] T013 [US1] Add app-logo component to the app header/navigation area (identify existing header component or create minimal one in app layout)

**Checkpoint**: Logo visible in header, favicon in browser tab, bookmark shows icon

---

## Phase 4: User Story 2 - Mobile Home Screen Icon (Priority: P2)

**Goal**: PWA installation shows correct branded icon on mobile home screens

**Independent Test**: Add app to home screen on mobile device, verify icon displays

### Implementation for User Story 2

- [ ] T014 [US2] Verify manifest.ts icons resolve correctly in DevTools > Application > Manifest
- [ ] T015 [US2] Test PWA install prompt shows correct icon (manual verification via DevTools)

**Checkpoint**: PWA install uses branded icon on mobile devices

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Testing and cleanup

- [ ] T016 [P] Add Playwright E2E test verifying favicon and logo presence in __tests__/e2e/logo-favicon.spec.ts
- [ ] T017 Run quickstart.md validation (bun dev, check favicon in tab, logo in header, manifest icons)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - all copy tasks run in parallel
- **Foundational (Phase 2)**: Depends on Phase 1 (assets must be in place before configuring references)
- **User Story 1 (Phase 3)**: Depends on Phase 2 (metadata must be configured)
- **User Story 2 (Phase 4)**: Depends on Phase 2 (manifest must be configured)
- **Polish (Phase 5)**: Depends on Phases 3 and 4

### User Story Dependencies

- **User Story 1 (P1)**: Independent after Phase 2
- **User Story 2 (P2)**: Independent after Phase 2, can run in parallel with US1

### Parallel Opportunities

- All Phase 1 tasks (T001-T008) can run in parallel
- US1 and US2 can proceed in parallel after Phase 2
- T016 (E2E test) can be written in parallel with T017

---

## Parallel Example: Phase 1

```bash
# All asset copies can run simultaneously:
Task: "Copy favicon.ico to app/favicon.ico"
Task: "Copy favicon.svg to public/favicon.svg"
Task: "Copy favicon-16.png to public/favicon-16.png"
Task: "Copy favicon-32.png to public/favicon-32.png"
Task: "Copy favicon-192.png to public/favicon-192.png"
Task: "Copy favicon-512.png to public/favicon-512.png"
Task: "Copy apple-touch-icon-180.png to public/apple-touch-icon.png"
Task: "Copy kids_goals_app_logo.svg to public/logo.svg"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Copy assets
2. Complete Phase 2: Configure metadata and manifest
3. Complete Phase 3: Logo component in header
4. **STOP and VALIDATE**: Favicon in tab, logo in header
5. Deploy/demo if ready

### Incremental Delivery

1. Phase 1 + Phase 2 → Icons configured
2. Add User Story 1 → Logo in header (MVP)
3. Add User Story 2 → PWA icon verified
4. Polish → E2E test coverage

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each phase
