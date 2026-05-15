# Feature Specification: Fix Daily Task Reset

**Feature Branch**: `007-fix-daily-task-reset`
**Created**: 2026-05-15
**Status**: Draft
**Input**: User description: "There is a bug that I found. The task is not resetting after midnight. Tasks that can be performed once daily should be allowed to be updated again"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Daily Task Resets After Midnight (Priority: P1)

A child completes a "once per day" repeated task and receives points. The task shows as completed for the rest of the day. After midnight (start of a new calendar day), the task resets and becomes available for the child to complete again.

**Why this priority**: This is the core bug — daily tasks are permanently locked after first completion instead of resetting the next day.

**Independent Test**: Complete a once-per-day task, verify it shows as completed, then verify it becomes available again on the next calendar day.

**Acceptance Scenarios**:

1. **Given** a child completed a once-per-day task yesterday, **When** they view their task list today, **Then** the task is available to complete again.
2. **Given** a child completed a once-per-day task earlier today, **When** they view their task list later the same day, **Then** the task still shows as completed and cannot be completed again.
3. **Given** a child has never completed a once-per-day task, **When** they view their task list, **Then** the task is available to complete.

---

### User Story 2 - Completed State Clears on New Day (Priority: P2)

A child who completed a daily task yesterday sees the task in its default (uncompleted) state when they open the app the next day. The completed state and undo button from the previous day are no longer shown.

**Why this priority**: Visual consistency — children should not see stale completed states from previous days.

**Independent Test**: Complete a daily task, wait for the next calendar day, and verify the task appears in its uncompleted state without an undo button.

**Acceptance Scenarios**:

1. **Given** a child completed a once-per-day task yesterday, **When** they view the task list today, **Then** the task appears in its uncompleted (available) state with no undo button from yesterday's completion.
2. **Given** a child completed a once-per-day task today, **When** they view the task list today, **Then** the task shows as completed with an undo button.

---

### Edge Cases

- What happens if a child completes a daily task just before midnight and views the task list just after midnight? The task should reset and be available again.
- What happens if the system uses UTC but the child is in a different timezone? The day boundary should be determined consistently (assumption: UTC or server time is used).
- What happens if a daily task's completion history is empty? The task should be available.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST determine daily task availability by comparing the most recent completion date against the current calendar day.
- **FR-002**: Once-per-day tasks MUST become available again when the current date is after the date of the last completion.
- **FR-003**: The completed/unavailable state for daily tasks MUST only apply within the same calendar day as the last completion.
- **FR-004**: The undo button for daily task completions MUST only be shown on the same calendar day as the completion.

### Key Entities

- **Task Completion**: Existing entity. The completion timestamp is used to determine whether a daily task has been completed today.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Once-per-day tasks are available to complete again on the next calendar day — zero instances of tasks remaining locked across days.
- **SC-002**: Once-per-day tasks completed today remain locked for the rest of the current day — zero instances of same-day re-completion.
- **SC-003**: Children see the correct task state (available vs completed) immediately upon viewing the task list, with no manual refresh needed.

## Assumptions

- The existing task completion records include timestamps that can be used to determine the completion date.
- Day boundaries are determined using a consistent time reference (UTC or server time).
- This fix applies specifically to the "once per day" repeated task type (FR-014 from the original spec); other task types (one-time, unlimited repeated, max-count repeated) are not affected.
- The activity log retains all historical completions regardless of daily reset behavior.
