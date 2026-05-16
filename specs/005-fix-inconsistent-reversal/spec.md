# Feature Specification: Fix Inconsistent Reversal

**Feature Branch**: `005-fix-inconsistent-reversal`
**Created**: 2026-05-15
**Status**: Complete
**Input**: User description: "Reversing a chore or task should only happen once per day the chore or repeatable task was completed. It should be consistent with the app."

> **Note (2026-05-16)**: Undo End Day and Undo Rest Day were removed. End Day is now a permanent terminal action. If a kid forgets to end the day, they can return to it via the Calendar page. The Effort Levels feature was also removed entirely.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Undo Chore Completion Limited to Once Per Day (Priority: P1)

A kid checks a chore as done but realizes they haven't actually completed it. They can uncheck it once. After unchecking and re-checking, the chore cannot be unchecked again for that day.

**Why this priority**: Prevents kids from gaming the system by repeatedly toggling chores. Makes chore toggling consistent with the one-undo-per-day principle.

**Independent Test**: Can be tested by completing a chore, unchecking it, re-completing it, and verifying the checkbox is now locked in the completed state.

**Acceptance Scenarios**:

1. **Given** a chore has never been completed today, **When** the kid marks it complete, **Then** they can still uncheck it (one undo available)
2. **Given** a chore was completed and then unchecked once, **When** the kid completes it again, **Then** the chore cannot be unchecked anymore
3. **Given** a chore has never been unchecked, **When** the kid views it in completed state, **Then** the undo/uncheck option is available
4. **Given** a chore has been unchecked once already, **When** the kid views it in completed state, **Then** the checkbox appears locked/disabled for unchecking

---

### User Story 2 - Consistent Visual Feedback for Undo State (Priority: P2)

The UI clearly communicates when a chore undo is available vs. exhausted.

**Why this priority**: Without clear visual cues, kids won't understand why they can't undo an action, leading to confusion.

**Independent Test**: Can be tested by observing the UI state of chore checkboxes across different undo states.

**Acceptance Scenarios**:

1. **Given** a chore has been completed and can still be unchecked, **When** viewing the chore, **Then** the checkbox is interactive
2. **Given** a chore's undo has been exhausted, **When** viewing the completed chore, **Then** the checkbox appears visually locked

---

### User Story 3 - Tasks Hidden After End Day (Priority: P3)

Once a kid ends their day, the repeated task section is hidden and task completion is blocked server-side. End Day is a terminal action for all daily point-earning activities.

**Why this priority**: Kids could earn extra points by completing tasks after declaring their day done, which is inconsistent with End Day being a terminal action.

**Independent Test**: End the day, verify the Tasks section is no longer visible on the dashboard. Attempt to complete a task via the server action directly — verify it is rejected.

**Acceptance Scenarios**:

1. **Given** a kid has ended their day, **When** viewing the dashboard, **Then** the Tasks section is not shown
2. **Given** a kid has ended their day, **When** a task completion is attempted (e.g., via direct API call), **Then** the server rejects it with an appropriate error

---

### Edge Cases

- What happens if a chore is unchecked on a day that hasn't been ended? The uncheck count increments normally. The one-undo limit applies regardless of end-day state.
- What happens if the app is used offline and syncs later? Standard Supabase sync behavior applies; undo counts are tracked server-side.
- If a kid forgets to end the day, the day remains open. They can return via the Calendar page to end it on a past date.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow unchecking a completed chore exactly once per chore completion per day
- **FR-002**: System MUST track whether a chore completion has been unchecked before (per day record)
- **FR-003**: After a chore has been unchecked once and re-completed, the checkbox MUST be locked in the completed state
- **FR-004**: All undo/reversal operations MUST create activity log entries for audit purposes
- **FR-005**: Points recalculation MUST happen automatically via the existing event-sourcing trigger when reversal activity log entries are inserted
- **FR-006**: Once a kid ends their day, the repeated task section MUST be hidden on the dashboard
- **FR-007**: Task completion server action MUST reject requests made after the day has been ended

### Key Entities

- **ChoreCompletion**: Extended with an `uncheck_count` field (integer, default 0) to track how many times the chore has been unchecked

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Kids can uncheck a completed chore once per chore per day
- **SC-002**: After using their one undo, the action is permanently locked for that day
- **SC-003**: All reversal operations are fully auditable via the activity log
- **SC-004**: After ending the day, the Tasks section is hidden and task completion is blocked server-side

## Clarifications

### Session 2026-05-15

- Q: Should task undo also be limited to once per day like chores? → A: No. Task undo is a separate system — tasks update points immediately and have their own undo rules. This feature only covers chores and end-day terminal behavior.

### Session 2026-05-16

- Q: Should Undo End Day be kept? → A: No. End Day is now permanent. If a kid forgets to end the day, they can return via the Calendar page.
- Q: Should the Effort Levels feature (dropdown shown after all chores complete) be kept? → A: No. The entire Effort Levels feature has been removed.

## Scope

**In scope**: Chore uncheck limits, hiding tasks after End Day, server-side task completion guard.
**Out of scope**: Undo End Day (removed). Undo Rest Day (removed). Effort Levels (removed entirely). Task undo behavior — tasks have their own independent undo rules (unchanged by this feature).

## Assumptions

- The existing event-sourcing system (activity_log trigger) handles points recalculation when reversal entries are inserted
- The one-undo limit is a simple counter on the database record, not a time-based window
- No parent/admin override is needed for undo limits in this iteration
