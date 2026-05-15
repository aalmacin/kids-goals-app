# Feature Specification: Fix Inconsistent Reversal

**Feature Branch**: `005-fix-inconsistent-reversal`
**Created**: 2026-05-15
**Status**: Draft
**Input**: User description: "Reversing a chore or task should only happen once per day the chore or repeatable task was completed. It should be consistent with the app. Undoing and ending should be consistent all the time."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Undo End Day (Priority: P1)

A kid accidentally ends their day or ends it too early. They need to undo this action so they can continue completing chores. The undo is allowed once per ended day.

**Why this priority**: Currently "End Day" says "This cannot be undone", making it the most impactful inconsistency. Kids who accidentally end their day lose the ability to complete remaining chores and earn points.

**Independent Test**: Can be tested by ending a day, then clicking "Undo End Day", verifying the day reopens and chores become toggleable again.

**Acceptance Scenarios**:

1. **Given** a kid has ended their day, **When** they click "Undo End Day", **Then** the day reopens (ended_at is cleared), penalties and effort rewards from that end-day are reversed, and chores become toggleable again
2. **Given** a kid has already undone the end-day once for a specific date, **When** they end and try to undo again, **Then** the undo option is not available
3. **Given** a kid has ended their day on a past date, **When** they view that date, **Then** the undo option is not available (undo is only for the current day)

---

### User Story 2 - Undo Chore Completion Limited to Once Per Day (Priority: P2)

A kid checks a chore as done but realizes they haven't actually completed it. They can uncheck it once. After unchecking and re-checking, the chore cannot be unchecked again for that day.

**Why this priority**: Prevents kids from gaming the system by repeatedly toggling chores, while still allowing a single honest correction. Makes chore toggling consistent with the one-undo-per-day rule for end-day.

**Independent Test**: Can be tested by completing a chore, unchecking it, re-completing it, and verifying the checkbox is now locked in the completed state.

**Acceptance Scenarios**:

1. **Given** a chore has never been completed today, **When** the kid marks it complete, **Then** they can still uncheck it (one undo available)
2. **Given** a chore was completed and then unchecked once, **When** the kid completes it again, **Then** the chore cannot be unchecked anymore
3. **Given** a chore has never been unchecked, **When** the kid views it in completed state, **Then** the undo/uncheck option is available
4. **Given** a chore has been unchecked once already, **When** the kid views it in completed state, **Then** the checkbox appears locked/disabled for unchecking

---

### User Story 3 - Consistent Visual Feedback for Undo State (Priority: P3)

The UI clearly communicates when an undo is available vs. exhausted, across both chore completion and end-day actions.

**Why this priority**: Without clear visual cues, kids won't understand why they can't undo an action, leading to confusion.

**Independent Test**: Can be tested by observing the UI state of chore checkboxes and end-day button across different undo states.

**Acceptance Scenarios**:

1. **Given** a day has been ended and undo is available, **When** viewing the dashboard, **Then** an "Undo End Day" button is visible
2. **Given** a day has been ended and undo is exhausted, **When** viewing the dashboard, **Then** only "Day Ended" status is shown (no undo button)
3. **Given** a chore has been completed and can still be unchecked, **When** viewing the chore, **Then** the checkbox is interactive
4. **Given** a chore's undo has been exhausted, **When** viewing the completed chore, **Then** the checkbox appears visually locked

---

### Edge Cases

- What happens if the kid undoes end-day, then the date rolls over to the next day? The undo count stays with the date, so the new day starts fresh.
- What happens if penalties were applied during end-day and then end-day is undone? The penalty and effort reward activity log entries from that end-day are reversed (negative entries inserted to cancel them out).
- What happens if a chore is unchecked on a day that hasn't been ended? The uncheck count increments normally. The one-undo limit applies regardless of end-day state.
- What happens if the app is used offline and syncs later? Standard Supabase sync behavior applies; undo counts are tracked server-side.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow undoing "End Day" exactly once per day record
- **FR-002**: System MUST track the number of times end-day has been undone per day record (0 or 1)
- **FR-003**: When end-day is undone, system MUST clear the `ended_at` timestamp, reverse penalty activity log entries, and reverse effort reward activity log entries from that end-day
- **FR-004**: System MUST allow unchecking a completed chore exactly once per chore completion per day
- **FR-005**: System MUST track whether a chore completion has been unchecked before (per day record)
- **FR-006**: After a chore has been unchecked once and re-completed, the checkbox MUST be locked in the completed state
- **FR-007**: Undo end-day MUST only be available for the current date, not past dates
- **FR-008**: The "Undo End Day" button MUST only appear when the day is ended AND undo has not been used
- **FR-009**: All undo/reversal operations MUST create activity log entries for audit purposes
- **FR-010**: Points recalculation MUST happen automatically via the existing event-sourcing trigger when reversal activity log entries are inserted

### Key Entities

- **DayRecord**: Extended with an `undo_end_count` field (integer, default 0) to track how many times end-day has been undone
- **ChoreCompletion**: Extended with an `uncheck_count` field (integer, default 0) to track how many times the chore has been unchecked

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Kids can undo an accidental end-day within the same day, once per day
- **SC-002**: Kids can uncheck a completed chore once per chore per day
- **SC-003**: After using their one undo, the action is permanently locked for that day
- **SC-004**: Points are correctly adjusted when end-day is undone (penalties reversed, effort rewards reversed)
- **SC-005**: All reversal operations are fully auditable via the activity log
- **SC-006**: Undo behavior is consistent: one reversal allowed, same rule for both chore unchecking and end-day undoing

## Assumptions

- The existing event-sourcing system (activity_log trigger) handles points recalculation when reversal entries are inserted
- Undo end-day is only available for the current date to prevent retroactive score manipulation
- The one-undo limit is a simple counter on the database record, not a time-based window
- No parent/admin override is needed for undo limits in this iteration
