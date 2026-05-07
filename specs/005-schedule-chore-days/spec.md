# Feature Specification: Chore Day Scheduling

**Feature Branch**: `005-schedule-chore-days`
**Created**: 2026-05-03
**Status**: Draft
**Input**: User description: "Add ability for parents to schedule what days the chores can be worked on"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Set Allowed Days for a Chore (Priority: P1)

A parent navigates to a chore and selects which days of the week that chore can be worked on (e.g., Monday, Wednesday, Friday). The schedule is saved and takes effect immediately.

**Why this priority**: Core feature — without being able to set a schedule, the rest of the feature has no value.

**Independent Test**: Can be fully tested by a parent setting a day schedule on a chore and verifying the saved schedule is reflected in the chore's detail view.

**Acceptance Scenarios**:

1. **Given** a parent is viewing a chore, **When** they select specific days of the week and save, **Then** the chore's schedule shows exactly those days.
2. **Given** a parent has set a schedule, **When** they update the schedule with different days and save, **Then** the new schedule replaces the old one.
3. **Given** a parent clears all selected days, **When** they save, **Then** the chore has no day restriction (available every day).

---

### User Story 2 - Children See Only Available Chores for Today (Priority: P2)

When a child views their chore list, chores that are not scheduled for the current day are not available for completion. The child sees a clear indication of when a restricted chore becomes available again.

**Why this priority**: This delivers the enforcement value of the scheduling feature to the child-facing experience.

**Independent Test**: Can be fully tested by setting a chore to specific days and verifying a child can only complete it on those days, while seeing it as unavailable on non-scheduled days.

**Acceptance Scenarios**:

1. **Given** a chore is scheduled only on weekdays, **When** a child views their chore list on a weekend, **Then** that chore appears as unavailable (not actionable).
2. **Given** a chore is scheduled only on weekdays, **When** a child views their chore list on a weekday, **Then** that chore is available for completion.
3. **Given** a chore has no day schedule set, **When** a child views their chore list on any day, **Then** the chore is available.
4. **Given** a chore is unavailable today, **When** the child views the chore, **Then** they see the next available day displayed.

---

### User Story 3 - View Chore Schedule Summary (Priority: P3)

A parent can see at a glance which days each chore is scheduled for when viewing the chore list or chore detail.

**Why this priority**: Useful for managing schedules, but the core feature works without it if the schedule is visible during the edit flow.

**Independent Test**: Can be fully tested by a parent viewing the chore list and verifying day schedule information appears alongside each chore that has one set.

**Acceptance Scenarios**:

1. **Given** a chore has a day schedule set, **When** a parent views the chore list, **Then** each chore shows its scheduled days.
2. **Given** a chore has no day schedule set, **When** a parent views the chore list, **Then** that chore shows "Every day" or equivalent.

---

### Edge Cases

- What happens when a child tries to complete a chore on a non-scheduled day (e.g., direct URL access)? The system must prevent completion, not just hide the button.
- What happens if a parent changes the schedule for a chore mid-day while a child has already started it? The chore remains completable for that session.
- What if all 7 days are deselected? Treated as "available every day" (no restriction), not "available never".
- Timezone handling: schedule day is based on the family's local time, not UTC.
- **Existing chores with null `allowed_days`**: `ChoreScheduleEditor` must receive `[0,1,2,3,4,5,6]` as `initialDays` when `allowed_days` is null, visually indicating the chore is available every day.
- **Upsert on save**: `updateChoreScheduleAction` must use upsert semantics (insert if no record, update if one exists) to handle both legacy chores and already-scheduled chores without a 500 error.
- **All days selected on save**: When all 7 days are saved, store `[0,1,2,3,4,5,6]` explicitly. Server-side availability checks must treat both `null` and `[0,1,2,3,4,5,6]` as "no restriction".

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Parents MUST be able to assign a set of allowed weekdays (Sunday–Saturday) to any chore.
- **FR-002**: Parents MUST be able to clear a chore's day schedule, reverting it to available every day.
- **FR-003**: The system MUST prevent children from completing a chore on a day it is not scheduled for.
- **FR-004**: A chore with no day schedule set MUST be available for completion on all days.
- **FR-005**: The child-facing chore list MUST visually distinguish chores that are unavailable due to scheduling from chores that are available.
- **FR-006**: When a chore is unavailable due to scheduling, the child-facing view MUST display the next day the chore becomes available.
- **FR-007**: Parents MUST be able to see the current day schedule for each chore.
- **FR-008**: The system MUST enforce schedule restrictions server-side, not only in the UI.
- **FR-009**: The system MUST compute the current day-of-week using the family's stored IANA timezone (`families.timezone`), never UTC or server local time.

### Key Entities

- **Chore Day Schedule**: The set of weekdays (0–6, where 0 = Sunday) on which a specific chore is permitted to be worked on. Stored as an integer array column `allowed_days` directly on the `chores` table. A `null` value (existing chores with no schedule set) means all days are allowed.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Parents can set or update a chore's day schedule in under 30 seconds.
- **SC-002**: Children cannot complete a scheduled chore outside its allowed days, regardless of how they access it.
- **SC-003**: Children can always identify the next available day for a restricted chore without contacting a parent.
- **SC-004**: 100% of chores with day schedules enforce those restrictions consistently across all access paths.

## Clarifications

### Session 2026-05-06

- Q: When `allowed_days` is null for an existing chore, what should `initialDays` be passed as to `ChoreScheduleEditor`? → A: `[0,1,2,3,4,5,6]` — all 7 days pre-selected to visually indicate "every day"
- Q: Should `updateChoreScheduleAction` use upsert semantics? → A: Yes — upsert (insert if no schedule exists, update if one does)
- Q: Where is the day schedule stored? → A: `allowed_days` array column directly on the `chores` table
- Q: When a parent saves with all 7 days selected, what should be stored in `allowed_days`? → A: `[0,1,2,3,4,5,6]` — store all 7 days explicitly

## Assumptions

- Schedules are per-chore, not a global family schedule, allowing fine-grained control per task.
- The scheduling unit is day-of-week (recurring weekly), not one-time specific calendar dates.
- Timezone for day determination is the family/parent's local timezone stored in the account.
- A chore with all 7 days selected is equivalent to no schedule (available every day).
- Mobile and desktop experiences both fully support schedule management.
- Existing chores without a schedule retain their current always-available behavior after this feature ships.
