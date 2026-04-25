# Feature Specification: Kids Goals PWA

**Feature Branch**: `001-kids-goals-pwa`
**Created**: 2026-04-25
**Status**: Draft

## Clarifications

### Session 2026-04-25

- Q: Are chores shared across all kids in a family, or assigned individually? → A: Chores exist in a family-level library. The parent assigns copies to specific kids. Each kid's copy is independent — completing it for one kid does not affect another kid's assignment.
- Q: Must kid names be unique within a family? → A: Yes. Kid names must be unique within a family; the parent sees an error if they attempt to add a duplicate name.
- Q: Who can trigger End Day — kid, parent, or both? → A: Both the kid and the parent can trigger End Day. Incomplete chores automatically incur penalties at that point, so there is no incentive to trigger it early. Paying 100 points for a rest day is the only way to reduce the chore burden before End Day.
- Q: What happens to historical records when a chore is deleted from the library? → A: Soft delete. The chore is hidden from active use and no longer assignable, but all historical activity log entries and DayRecord completions retain the chore name and data.
- Q: What happens to a past date if End Day was never pressed? → A: No expiration or automatic read-only. Past dates become deprioritized in the UI (current day is the primary focus) but both kids and parents can still update chore completions and trigger End Day on any past date indefinitely.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Parent Authentication & Family Setup (Priority: P1)

A parent registers with an email and password, sets a unique family name, and gains access to the admin dashboard. Without this, no other functionality exists.

**Why this priority**: This is the entry point for the entire app. All other features depend on a family being established.

**Independent Test**: A parent can register, set a family name, and see the admin dashboard — no kids or chores needed.

**Acceptance Scenarios**:

1. **Given** an unregistered email, **When** the parent submits email and password, **Then** an account is created and the parent is redirected to family setup.
2. **Given** a parent without a family name, **When** they enter a unique family name and submit, **Then** the family is created and they are taken to the admin dashboard.
3. **Given** a family name already taken by another family, **When** a parent tries to register with that name, **Then** an error is shown and they must choose a different name.
4. **Given** a registered parent, **When** they log in with correct credentials, **Then** they are taken to the admin dashboard.
5. **Given** a logged-in parent, **When** they log out, **Then** they are returned to the login screen.

---

### User Story 2 - Kid Account Management (Priority: P2)

A parent can add kids to their family, each with a name, birthday, and passcode. Kids can then log in using their family name, their own name, and passcode.

**Why this priority**: Kids need accounts before any chore or reward tracking can happen.

**Independent Test**: A parent adds a kid, and that kid can then log in — no chores or rewards needed yet.

**Acceptance Scenarios**:

1. **Given** a logged-in parent, **When** they add a kid with a name, birthday, and passcode, **Then** the kid appears in the family's kid list.
2. **Given** a kid account exists, **When** the kid selects their family name, enters their name and passcode correctly, **Then** they are logged in and see their dashboard.
3. **Given** a kid entering an incorrect passcode, **When** they submit, **Then** login is rejected with an error message.
4. **Given** a logged-in kid, **When** they log out, **Then** they are returned to the login screen.

---

### User Story 3 - Chore Library & Per-Kid Assignment (Priority: P3)

A parent creates chores in a family-level library. Each chore has a name, penalty, importance flag, and icon. The parent then assigns individual copies of library chores to specific kids. Each kid's copy tracks independently.

**Why this priority**: Chores are the core unit of daily tracking; without them there is nothing to complete or penalize.

**Independent Test**: A parent creates a chore in the library, assigns it to one kid, and that kid — but not their sibling — sees it on their dashboard.

**Acceptance Scenarios**:

1. **Given** a logged-in parent, **When** they create a chore with a name, penalty value, importance flag, and icon, **Then** the chore is saved to the family chore library.
2. **Given** a chore exists in the library, **When** the parent assigns it to a specific kid, **Then** that kid sees it on their dashboard; other kids are unaffected.
3. **Given** two kids are each assigned the same library chore, **When** one kid marks it complete, **Then** the other kid's copy remains incomplete.
4. **Given** an existing chore in the library, **When** the parent edits it (name, penalty, importance, icon), **Then** the changes are saved to the library definition.
5. **Given** an existing chore assignment for a kid, **When** the parent removes that assignment, **Then** the chore no longer appears on that kid's dashboard.

---

### User Story 4 - Kid Daily Chore Tracking (Priority: P4)

A logged-in kid sees today's chores on their dashboard. They can check off completed chores and uncheck them if they made a mistake.

**Why this priority**: This is the primary daily interaction for kids.

**Independent Test**: A kid can see their assigned chores for the current day, check one off, and uncheck it.

**Acceptance Scenarios**:

1. **Given** a logged-in kid with chores assigned, **When** they view the dashboard, **Then** they see all their assigned chores for today.
2. **Given** an unchecked chore, **When** the kid taps to complete it, **Then** the chore is marked as done.
3. **Given** a checked chore, **When** the kid taps it again, **Then** the chore is unchecked (mistake correction).
4. **Given** all chores completed, **When** the kid views the dashboard, **Then** all chores show as done and an effort dropdown becomes available.

---

### User Story 5 - Rest Day (Priority: P5)

A kid can declare a rest day by spending 100 points. A confirmation prompt is shown before deducting points. On a rest day, only important chores are displayed.

**Why this priority**: Rest days are a key differentiator from a standard chore tracker.

**Independent Test**: A kid with sufficient points can trigger a rest day, confirm, and see only important chores.

**Acceptance Scenarios**:

1. **Given** a kid with at least 100 points, **When** they tap "Rest Day", **Then** a confirmation dialog asks them to confirm the 100-point cost.
2. **Given** the kid confirms, **When** the action is processed, **Then** 100 points are deducted and only important chores are shown for that day.
3. **Given** a kid with fewer than 100 points, **When** they attempt a rest day, **Then** they are shown an error indicating insufficient points.
4. **Given** a rest day is active, **When** the kid views their dashboard, **Then** non-important chores are hidden.

---

### User Story 6 - End Day & Penalties (Priority: P6)

Either the kid or the parent can press "End Day" to close out the day. Triggering End Day with incomplete chores immediately applies their penalties — there is no benefit to ending the day early. The rest day (100-point cost) is the only legitimate way to reduce the chore burden. The effort dropdown (available after all chores are done) is submitted as part of end-of-day.

**Why this priority**: End Day finalizes the day's results and applies consequences, which drives motivation.

**Independent Test**: A kid with some incomplete chores presses "End Day" and sees their points reduced by the penalty amounts.

**Acceptance Scenarios**:

1. **Given** the day is not yet ended, **When** "End Day" is pressed, **Then** penalties for all incomplete chores are calculated and deducted from the kid's points.
2. **Given** all chores are complete before End Day, **When** the kid selects an effort level and presses "End Day", **Then** points for that effort level are awarded.
3. **Given** End Day has been completed, **When** the kid views their dashboard, **Then** the day is marked as finished and no further changes can be made for that date.
4. **Given** a rest day is active with only important chores, **When** "End Day" is pressed, **Then** only penalties for incomplete important chores are applied.

---

### User Story 7 - Rewards System (Priority: P7)

Parents define rewards (with names, point costs, and icons). Kids can browse rewards and redeem them using their accumulated points.

**Why this priority**: Rewards are the motivating outcome for earning points.

**Independent Test**: A parent creates a reward; a kid with sufficient points redeems it and their points are reduced.

**Acceptance Scenarios**:

1. **Given** a logged-in parent, **When** they create a reward with a name, point cost, and icon, **Then** the reward appears in the rewards catalog.
2. **Given** a kid with sufficient points, **When** they select and confirm a reward redemption, **Then** the points are deducted and the redemption is logged.
3. **Given** a kid with insufficient points, **When** they try to redeem a reward, **Then** they see an error with the points shortfall.
4. **Given** a reward is redeemed, **When** the activity log is viewed, **Then** the redemption event appears.

---

### User Story 8 - Effort Levels Management (Priority: P8)

Parents can define effort levels (e.g., "Good", "Great", "Amazing") and assign point rewards to each. Kids select their effort level at the end of a completed day.

**Why this priority**: Effort levels provide nuanced reward tiers beyond binary pass/fail.

**Independent Test**: A parent creates effort levels with point rewards; after completing all chores a kid selects one and the points are awarded.

**Acceptance Scenarios**:

1. **Given** a logged-in parent, **When** they create or edit effort levels with names and point values, **Then** the levels are saved and available for kids at end-of-day.
2. **Given** all chores are completed for the day, **When** the kid opens the effort dropdown, **Then** all parent-defined effort levels are shown.
3. **Given** the kid selects an effort level, **When** End Day is confirmed, **Then** the corresponding points are added to their total.

---

### User Story 9 - Activity Log (Priority: P9)

All key actions (chore completion, rest day, reward redemption, End Day, penalties) are recorded in an activity log viewable by both parents and kids.

**Why this priority**: Transparency and accountability support the educational goal of the app.

**Independent Test**: After checking a chore and redeeming a reward, both events appear in the activity log.

**Acceptance Scenarios**:

1. **Given** a logged-in user (parent or kid), **When** they open the activity log, **Then** they see a chronological list of all actions for all kids in the family.
2. **Given** a chore was checked, **When** the activity log is viewed, **Then** a "chore completed" entry with kid name, chore name, and timestamp is present.
3. **Given** a reward was redeemed, **When** the activity log is viewed, **Then** a "reward redeemed" entry is present.
4. **Given** End Day ran, **When** the activity log is viewed, **Then** penalty deductions and effort points are recorded.

---

### User Story 10 - Calendar & Past Dates (Priority: P10)

A calendar view shows all past days. Days with a completed End Day are visually marked. Clicking any past date opens it in full — both kids and parents can still update chore completions and trigger End Day on past dates. Past dates are deprioritized in the UI but never locked or expired.

**Why this priority**: Reviewing history reinforces progress and habit-building; flexibility for missed days keeps the experience stress-free.

**Independent Test**: After ending a day, the calendar marks that date; clicking a past date without End Day still allows chore updates and End Day to be triggered.

**Acceptance Scenarios**:

1. **Given** the calendar is opened, **When** viewing the current month, **Then** days with a completed End Day are visually marked differently from days without.
2. **Given** a past date with End Day completed, **When** the user taps that date, **Then** they see a read-only view of the chore completions, points earned/lost, and effort selected.
3. **Given** a past date without End Day, **When** tapped, **Then** both the kid and parent can still check/uncheck chores and trigger End Day for that date.
4. **Given** the current day, **When** the dashboard loads, **Then** the current date is visually prioritized over past dates in the calendar and navigation.

---

### Edge Cases

- What happens if a kid's points drop below zero from penalties?
- Deleting a chore from the library soft-deletes it: it is removed from active use and no longer assignable, but historical records retain the chore name and data.
- Kid names are unique within a family; the system rejects duplicate names at creation time.
- What if End Day is pressed when no chores are assigned to a kid?
- What if a kid tries to redeem a reward while End Day is in progress?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST support two login flows: parent via email and password, and kid via family name, kid name, and passcode.
- **FR-002**: System MUST enforce unique family names across all families in the app.
- **FR-003**: Parents MUST be able to add kids with a name, birthday, and passcode; kid names MUST be unique within a family.
- **FR-004**: Parents MUST be able to create, edit, and delete chores in a family-level chore library; each chore has a name, penalty value, importance flag, and colorful icon. Deletion MUST be a soft delete — the chore is hidden from active use but historical records retain its data.
- **FR-005**: Parents MUST be able to assign chores from the family library to individual kids; each assignment is an independent copy.
- **FR-006**: Completing a chore for one kid MUST NOT affect the completion status of the same chore assigned to another kid.
- **FR-007**: Parents MUST be able to mark each chore as "important" or "regular".
- **FR-008**: Kids MUST be able to check and uncheck their assigned chores for the current day.
- **FR-009**: Kids MUST be able to declare a rest day by spending 100 points, with a confirmation prompt before deduction.
- **FR-010**: On a rest day, the kid's chore view MUST show only important chores.
- **FR-011**: System MUST show an effort dropdown to kids only after all their assigned chores for the day are marked complete.
- **FR-012**: An "End Day" button MUST be accessible to both the kid and the parent; pressing it MUST immediately apply penalties for all incomplete chores and award effort points if an effort level was selected.
- **FR-013**: Once End Day is completed for a specific date, that day's records MUST be read-only.
- **FR-013a**: Past dates without End Day MUST remain fully editable by both kids and parents; there is no expiration or automatic lock. Past dates are deprioritized in the UI but not restricted.
- **FR-014**: Parents MUST be able to create, edit, and delete rewards with a name, point cost, and colorful icon.
- **FR-015**: Kids MUST be able to browse and redeem rewards; points MUST be deducted upon redemption.
- **FR-016**: System MUST prevent reward redemption if the kid has insufficient points.
- **FR-017**: Parents MUST be able to define effort levels with names and associated point rewards.
- **FR-018**: All key actions MUST be recorded in a persistent activity log accessible to both parents and kids.
- **FR-019**: A calendar view MUST visually mark dates where End Day has been completed.
- **FR-020**: Tapping a past date on the calendar MUST open that day's view. If End Day has been completed for that date, the view is read-only. Otherwise, chore completions and End Day remain fully actionable.
- **FR-021**: Kid's current points MUST be visible in the main navigation bar at all times when logged in.
- **FR-022**: Colorful icons MUST be selectable for each reward, chore, and effort level.
- **FR-023**: System MUST use real-time updates so that changes (chore completions, point changes) are reflected immediately across devices.
- **FR-024**: The application MUST function as a Progressive Web App, including offline-capable access and installability on mobile devices.

### Key Entities

- **Family**: Unique name, associated parent account, list of kids.
- **Kid**: Name, birthday, passcode (hashed), current point balance, belongs to a family.
- **Chore** (library): Name, penalty value, importance flag, icon; defined at the family level and available for assignment.
- **ChoreAssignment**: A per-kid instance of a library Chore; tracks which chore is assigned to which kid; independent from other kids' assignments of the same chore.
- **DayRecord**: Tracks per-kid completion status of each ChoreAssignment, rest day flag, effort selection, and End Day status for a specific date.
- **Reward**: Name, point cost, icon, belongs to a family.
- **EffortLevel**: Name, point reward, belongs to a family.
- **ActivityLogEntry**: Actor (kid or parent), action type, timestamp, associated kid, metadata (chore name, reward name, points delta, etc.).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A parent can complete full onboarding (registration, family name, first kid added) in under 3 minutes.
- **SC-002**: A kid can log in and mark all daily chores complete in under 2 minutes.
- **SC-003**: Point balances update and are visible to the kid within 2 seconds of any point-changing action.
- **SC-004**: The activity log accurately reflects 100% of point-changing and chore-completion events with no omissions.
- **SC-005**: The calendar correctly marks all dates where End Day was completed.
- **SC-006**: Kids can independently navigate the app (check chores, declare rest day, view rewards) without parental assistance, indicating a sufficiently intuitive interface.
- **SC-007**: The app is installable on iOS and Android devices as a PWA and functions without connectivity for read operations.

## Assumptions

- Each family has one parent account (additional parent accounts per family are out of scope for v1).
- Kid passcodes are short numeric PINs (4–6 digits) for ease of use by children.
- Points cannot go below zero; penalties are capped at current balance.
- Rest day availability resets daily (one rest day per calendar day per kid).
- The activity log shows entries for all kids in the family regardless of whether a parent or kid is viewing.
- Effort level rewards are the only point-earning mechanism beyond chore completion (no per-chore completion bonus).
- Calendar navigation shows the current month by default; navigation to previous months is supported.
- Real-time updates are delivered across devices within the same family session.
