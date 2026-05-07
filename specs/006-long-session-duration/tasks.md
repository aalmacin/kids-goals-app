---

description: "Task list for Long PWA Session Duration"
---

# Tasks: Long PWA Session Duration

**Input**: Design documents from `specs/006-long-session-duration/`
**Prerequisites**: plan.md, spec.md, data-model.md, research.md

**Tests**: E2E tests are MANDATORY per Principle V. Unit and integration tests are included per explicit plan.md requirements.

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Configure Supabase session lifetime — foundational to all user stories.

- [ ] T001 Configure `supabase/config.toml` to set `[auth.sessions] timebox = 31536000` and `inactivity_timeout = 0` under `[auth]` set `jwt_expiry = 3600`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Session age calculation helpers required by the pre-expiry warning (US3). Must be complete before US3.

**⚠️ CRITICAL**: US3 cannot begin until this phase is complete.

- [ ] T002 Create `lib/session.ts` exporting `EXPIRY_DAYS = 365`, `WARNING_DAYS = 30`, `calculateDaysRemaining(sessionStartedAt: number): number` (returns days until expiry, negative if past), and `isSessionExpiring(sessionStartedAt: number): boolean` (returns true when daysRemaining <= WARNING_DAYS)

**Checkpoint**: Foundation ready — user story implementation can begin.

---

## Phase 3: User Story 1 — Stay Logged In Across Extended Periods (Priority: P1) MVP

**Goal**: Users remain authenticated for up to 1 year by setting the `kg_session_started` cookie on login and clearing it on logout.

**Independent Test**: Log in, close the app, reopen after a simulated delay, and verify the user is still authenticated without re-authentication.

### Implementation for User Story 1

- [ ] T003 [US1] Modify `lib/actions/auth.ts` to set `kg_session_started` cookie in `loginParent` and `loginKid` actions — value: `Date.now().toString()`, maxAge: 31536000, httpOnly: true, sameSite: 'lax', secure: true in production
- [ ] T004 [US1] Modify `lib/actions/auth.ts` to delete `kg_session_started` cookie in the `logout` action via `cookies().delete('kg_session_started')`

### Tests for User Story 1

- [ ] T005 [P] [US1] Create `__tests__/integration/session.test.ts` testing that `kg_session_started` is set on successful login and cleared on logout
- [ ] T006 [P] [US1] Create `__tests__/e2e/session-expiry.spec.ts` with E2E scenarios: user stays logged in after reopening the app, and session persists across simulated days of inactivity

**Checkpoint**: Login cookie lifecycle is fully functional and independently verifiable.

---

## Phase 4: User Story 2 — Session Expiry After 1 Year (Priority: P2)

**Goal**: After 1 year, Supabase's refresh token expiry (configured in Phase 1) automatically invalidates the session and redirects the user to login. No additional implementation code required beyond T001.

**Independent Test**: Simulate a session with an age exceeding 365 days; verify the user is signed out and directed to the login screen on next app access.

### Tests for User Story 2

- [ ] T007 [P] [US2] Create `__tests__/unit/session.test.ts` with unit tests for `calculateDaysRemaining` (zero days remaining, negative days, mid-range values) and `isSessionExpiring` (boundary at exactly 30 days, above and below threshold)
- [ ] T008 [P] [US2] Add E2E test to `__tests__/e2e/session-expiry.spec.ts` for session expiry: simulate a 1-year-old session (override cookie value) and verify user is signed out and shown the login screen

**Checkpoint**: Session expiry behaviour is verified end-to-end.

---

## Phase 5: User Story 3 — Pre-Expiry Warning (Priority: P2)

**Goal**: Display an in-app warning banner 30 days before session expiry, with a "Stay logged in" button that resets the session clock.

**Independent Test**: Simulate a session within the 30-day warning window; verify the banner appears in both dashboard and admin layouts. Click "Stay logged in" and verify the banner is dismissed and the session cookie is reset.

### Implementation for User Story 3

- [ ] T009 [P] [US3] Create `components/session/SessionExpiryWarning.tsx` as a client component — renders shadcn `Alert` (destructive variant) showing days remaining, a dismiss button (local state, reappears on next navigation), and a "Stay logged in" button that calls the `refreshSession` server action
- [ ] T010 [US3] Add `refreshSession` server action to `lib/actions/auth.ts` — calls `supabase.auth.refreshSession()`, deletes `kg_session_started`, then re-sets it to `Date.now().toString()` with the same cookie attributes as login
- [ ] T011 [US3] Modify `app/(dashboard)/layout.tsx` to read `cookies().get('kg_session_started')`, call `isSessionExpiring` from `lib/session.ts`, and render `<SessionExpiryWarning daysRemaining={calculateDaysRemaining(value)} />` above the main content when expiring
- [ ] T012 [P] [US3] Modify `app/(admin)/admin/layout.tsx` to apply the same session expiry check and `SessionExpiryWarning` rendering as T011

### Tests for User Story 3

- [ ] T013 [P] [US3] Add E2E tests to `__tests__/e2e/session-expiry.spec.ts` for: warning banner appears when session is within 30 days of expiry, banner is dismissable per page, and "Stay logged in" resets the session and removes the banner

**Checkpoint**: Pre-expiry warning is fully functional in both dashboard and admin layouts.

---

## Phase 6: User Story 4 — Seamless Re-authentication After Expiry (Priority: P3)

**Goal**: When a session has expired, the user sees a clear, friendly login prompt — no confusing errors. After re-authenticating, they are taken back into the app. This is inherent Supabase behaviour once US1–US3 are complete; only test coverage is needed.

**Independent Test**: Trigger session expiry (clear auth cookies); verify the user is redirected to the login screen with an appropriate message. After login, verify they are routed into the app.

### Tests for User Story 4

- [ ] T014 [P] [US4] Add E2E test to `__tests__/e2e/session-expiry.spec.ts` for expired session flow: simulate expired session, verify user sees the login page with a clear session-expired message, and after login is redirected back into the app

**Checkpoint**: All four user stories are independently functional and verified.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final validation pass across all stories.

- [ ] T015 Verify TypeScript strict mode compliance across all new and modified files: `lib/session.ts`, `lib/actions/auth.ts`, `components/session/SessionExpiryWarning.tsx`, both layout files

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 — BLOCKS US3
- **US1 (Phase 3)**: Depends on Phase 1 only — can start after T001
- **US2 (Phase 4)**: Depends on Phase 2 (unit tests use `lib/session.ts`) — can proceed after T002
- **US3 (Phase 5)**: Depends on Phase 2 (T002) and Phase 3 (T003, T004 for refreshSession context) — T009 can start in parallel with T011/T012 once T002 done
- **US4 (Phase 6)**: Depends on Phase 3 complete (auth actions) — test only
- **Polish (Phase 7)**: Depends on all phases complete

### User Story Dependencies

- **US1 (P1)**: After T001 — no other story dependency
- **US2 (P2)**: After T002 — no other story dependency
- **US3 (P2)**: After T002, T003, T004 — depends on login/logout cookie handling and session helpers
- **US4 (P3)**: After US1 complete — inherits auth redirect behaviour

### Within Each User Story

- T003 before T004 (same file — sequential)
- T004 before T010 (same file — sequential)
- T009 [P] with T010 (different files)
- T011 [P] with T012 (different files, both depend on T009 and T010)

---

## Parallel Execution Examples

### User Story 1

```
# After T003 + T004 complete:
Task T005: Integration tests in __tests__/integration/session.test.ts
Task T006: E2E tests in __tests__/e2e/session-expiry.spec.ts
```

### User Story 3

```
# After T002, T003, T004 complete:
Task T009: Create components/session/SessionExpiryWarning.tsx
Task T010: Add refreshSession to lib/actions/auth.ts  [sequential with T009 if same agent]

# After T009 + T010 complete:
Task T011: Modify app/(dashboard)/layout.tsx
Task T012: Modify app/(admin)/admin/layout.tsx
Task T013: Add E2E tests in __tests__/e2e/session-expiry.spec.ts
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: T001 (supabase config)
2. Complete Phase 3: T003, T004 (cookie set/clear on login/logout)
3. Validate: Log in and verify `kg_session_started` cookie is present; log out and verify it is cleared
4. Add tests: T005 (integration), T006 (E2E)
5. **STOP and validate** — users now stay logged in for up to 1 year

### Incremental Delivery

1. Phase 1 + Phase 3 → US1 done (sessions persist for 1 year) — MVP
2. Phase 2 + Phase 4 → US2 verified (expiry confirmed via tests)
3. Phase 5 → US3 done (warning banner live in dashboard + admin)
4. Phase 6 → US4 verified (re-auth UX confirmed via E2E)
5. Phase 7 → TypeScript cleanup

---

## Notes

- [P] tasks = different files, no shared state — safe to run in parallel
- [Story] label maps each task to its user story for traceability
- T003, T004, T010 all modify `lib/actions/auth.ts` — must run sequentially
- `lib/session.ts` is pure logic with no side effects — unit tests are fast and deterministic
- E2E tests for session expiry require overriding the `kg_session_started` cookie value to simulate age — use Playwright's `browserContext.addCookies()`
