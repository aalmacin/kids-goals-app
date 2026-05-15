# Feature Specification: Task Completion Confirmation

**Feature Branch**: `task-confirmation`
**Created**: 2026-05-15
**Status**: Draft
**Input**: User description: "When a task has been completed, add a confirmation dialog to the user. Same as when a task is about to be removed"

## Clarifications

### Session 2026-05-15

- Q: Does "task" refer to chores or the separate Task entity? → A: Task is a separate entity from chores. The spec applies to Tasks only.
- Q: Where should one-time tasks live vs repeated tasks? → A: One-time tasks on a separate page accessible via nav bar; repeated tasks stay on the Today page.
- Q: How should kids navigate to the one-time tasks page? → A: Navigation link in the app's nav bar, labeled "Tasks".
- Q: How should completed one-time tasks appear on the Tasks page? → A: Show in a separate "Completed" section on the same page.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Confirm Repeated Task Completion (Priority: P1)

A kid taps a repeated task on the Today page to complete it. Instead of immediately recording the completion, a confirmation dialog appears asking the kid to confirm. This prevents accidental completions that would award points incorrectly.

**Why this priority**: Repeated tasks currently have no confirmation, creating risk of accidental point awards. This is the gap that needs filling.

**Independent Test**: Can be fully tested by tapping any available repeated task on the Today page and verifying the dialog appears with confirm/cancel options.

**Acceptance Scenarios**:

1. **Given** an available repeated task on the Today page, **When** the kid taps the task, **Then** a confirmation dialog appears showing the task name and points to be earned
2. **Given** the confirmation dialog is open, **When** the kid confirms, **Then** the task completion is recorded and points are awarded
3. **Given** the confirmation dialog is open, **When** the kid cancels, **Then** no completion is recorded and no points change

---

### User Story 2 - Confirm Task Undo (Priority: P2)

A kid taps the undo button on a task they completed today. A confirmation dialog appears asking if they want to reverse the completion. This prevents accidental point loss from unintended undo taps. Applies to both repeated tasks (on Today page) and one-time tasks (on Tasks page).

**Why this priority**: Undo currently has no confirmation, risking accidental reversal of earned points.

**Independent Test**: Can be fully tested by completing a task, then tapping the undo button and verifying the dialog appears.

**Acceptance Scenarios**:

1. **Given** a task with today's completions, **When** the kid taps the undo button, **Then** a confirmation dialog appears warning that points will be deducted
2. **Given** the undo confirmation dialog is open, **When** the kid confirms, **Then** the last completion is reversed and points are deducted
3. **Given** the undo confirmation dialog is open, **When** the kid cancels, **Then** the completion remains and points are unchanged

---

### User Story 3 - Separate One-Time Tasks Page (Priority: P1)

One-time tasks are displayed on their own dedicated page, accessible via a navigation link in the app's nav bar. The Today page only shows repeated tasks in its task section. This separation makes sense because one-time tasks are not tied to a specific day.

**Why this priority**: Co-equal with P1 — the page separation is a prerequisite for the correct task layout and directly impacts where confirmation dialogs appear.

**Independent Test**: Can be fully tested by navigating to the one-time tasks page via the nav bar and verifying only one-time tasks are shown. Verify the Today page only shows repeated tasks.

**Acceptance Scenarios**:

1. **Given** a kid is logged in, **When** they view the nav bar, **Then** a link to the one-time tasks page is visible
2. **Given** a kid navigates to the one-time tasks page, **Then** available one-time tasks are shown in the main section and completed one-time tasks are shown in a separate "Completed" section
3. **Given** a kid views the Today page task section, **Then** only repeated tasks are displayed (not one-time tasks)
4. **Given** a kid taps a one-time task on the Tasks page, **Then** a confirmation dialog appears (existing behavior, now on the new page)
5. **Given** a one-time task has been completed, **Then** it moves from the available section to the "Completed" section on the Tasks page

---

### Edge Cases

- What happens if the task becomes unavailable (e.g., max completions reached) while the dialog is open? The server-side validation will reject the request and the UI will reflect the updated state.
- What happens if the kid rapidly taps the task while the dialog is open? The dialog prevents interaction with the underlying task list.
- What happens if the undo button is tapped on a one-time task that was completed today? The same undo confirmation dialog applies, shown on the one-time tasks page.
- What happens if there are no one-time tasks available? The Tasks page shows an empty state message.
- What happens if there are no repeated tasks available? The Today page task section is hidden or shows an empty state.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display a confirmation dialog when a kid taps a repeated task to complete it
- **FR-002**: System MUST display a confirmation dialog when a kid taps the undo button on any task completion
- **FR-003**: The confirmation dialog MUST show the task name and the points impact (points to earn for completion, points to lose for undo)
- **FR-004**: The confirmation dialog MUST provide both a confirm and cancel option
- **FR-005**: Cancelling the dialog MUST leave the task state unchanged
- **FR-006**: The confirmation dialog MUST follow the same visual pattern already used for one-time task completion confirmation
- **FR-007**: One-time tasks MUST be displayed on a dedicated page, not on the Today page
- **FR-008**: Repeated tasks MUST remain on the Today page task section
- **FR-009**: The app's nav bar MUST include a link to the one-time tasks page for kid users
- **FR-010**: One-time tasks MUST retain their existing confirmation dialog behavior on the new page
- **FR-011**: The Tasks page MUST display completed one-time tasks in a separate "Completed" section below the available tasks
- **FR-012**: The nav bar link MUST be labeled "Tasks"

### Key Entities

- **Task**: Family-scoped item (one-time or repeated) that awards points on completion
- **TaskCompletion**: Record of a kid completing a task, with points snapshot

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of task completion actions (both one-time and repeated) require explicit user confirmation before points are awarded
- **SC-002**: 100% of task undo actions require explicit user confirmation before points are deducted
- **SC-003**: Users can complete the confirm/cancel interaction in under 2 seconds
- **SC-004**: The confirmation dialog is visually consistent with the existing one-time task confirmation dialog
- **SC-005**: One-time tasks are accessible within one tap from the nav bar
- **SC-006**: The Today page shows zero one-time tasks

## Assumptions

- This feature applies only to the kid-facing pages, not admin task management
- The existing one-time task AlertDialog pattern is the visual reference for new dialogs
- "Same as when a task is about to be removed" refers to the confirmation pattern — the undo confirmation should mirror the delete/remove confirmation UX
- Chores are a separate entity and out of scope for this feature
- The nav bar link for one-time tasks is only visible to kid users (parents use admin pages)
