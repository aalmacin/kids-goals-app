# Feature Specification: One-Time and Repeated Tasks

**Feature Branch**: `005-one-time-repeated-tasks`
**Created**: 2026-05-12
**Status**: Draft
**Input**: User description: "Add one-time tasks and repeated tasks"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Complete a One-Time Task (Priority: P1)

A child sees a one-time task available in their task list. They click it, are shown a confirmation prompt asking if they really want to mark it as done, confirm, and receive points. The task is then marked as completed and removed from the active task list. It appears in the activity log and cannot be completed again.

**Why this priority**: Core feature — one-time tasks are a new task type that must function correctly before anything else.

**Independent Test**: A child can see a one-time task, click it, confirm completion, receive points, and the task no longer appears as available.

**Acceptance Scenarios**:

1. **Given** a child has an available one-time task, **When** they click the task, **Then** a confirmation dialog is shown asking them to confirm completion.
2. **Given** the confirmation dialog is shown, **When** the child confirms, **Then** they receive the task's point reward and the task is marked as completed.
3. **Given** the confirmation dialog is shown, **When** the child cancels, **Then** the task remains available and no points are awarded.
4. **Given** a one-time task has been completed, **When** the child views their task list, **Then** the completed task remains visible with a "done" state and an undo button until end of day.
5. **Given** a one-time task has been completed, **When** the child views their activity log, **Then** the completed task appears as an entry with the awarded points.
6. **Given** a one-time task was completed today, **When** the child clicks undo, **Then** the completion is reversed, points are deducted, and the task becomes available again.

---

### User Story 2 - Complete a Repeated Task (Priority: P2)

A child sees a repeated task in their task list. They click it and immediately receive points without a confirmation step. The task remains available to be performed again any number of times (up to the configured maximum, if set).

**Why this priority**: Repeated tasks extend the task type system and unlock recurring reward loops for children.

**Independent Test**: A child can complete a repeated task multiple times in a row and receive points each time, up to the configured limit.

**Acceptance Scenarios**:

1. **Given** a child has an available repeated task with no completion limit, **When** they click the task, **Then** they receive points and the task remains available to perform again.
2. **Given** a child completes a repeated task, **When** they view the activity log, **Then** each completion appears as a separate entry with its awarded points.
3. **Given** a repeated task is configured with a maximum completion count of N, **When** the child has completed it N times, **Then** the task is no longer available.
4. **Given** a repeated task has no configured maximum, **When** the child completes it many times, **Then** it always remains available.
5. **Given** a child has completed a repeated task today, **When** they click undo, **Then** the most recent completion is reversed, points are deducted, and the task becomes available again.

---

### User Story 3 - Manage One-Time and Repeated Tasks (Priority: P3)

A parent or admin navigates to the Tasks section via the admin navbar, then creates, edits, and deletes one-time and repeated tasks for a child, specifying task type, point reward, and (for repeated tasks) an optional maximum completion count.

**Why this priority**: Task management is necessary for the feature to be useful, but children can still benefit from pre-existing tasks.

**Independent Test**: A parent can click "Tasks" in the admin navbar, create a one-time task and a repeated task, assign point values, optionally set a max completion count on the repeated task, and see those tasks appear for the child.

**Acceptance Scenarios**:

1. **Given** a parent is in the admin area, **When** they view the navbar, **Then** a "Tasks" link is visible and navigates to the tasks management page.
2. **Given** a parent is creating a task, **When** they select "one-time" as the task type, **Then** the task is saved as a one-time task with a point value.
3. **Given** a parent is creating a task, **When** they select "repeated" and optionally set a maximum completion count, **Then** the task is saved accordingly.
4. **Given** a parent leaves the max completion count blank for a repeated task, **When** the task is saved, **Then** the task has no limit (unlimited completions).
5. **Given** a parent sets a maximum completion count greater than zero, **When** the task is saved, **Then** the limit is enforced for the child.
6. **Given** a parent is viewing the task list, **When** they click edit on an existing task, **Then** they can update only the task's name and point value (type, once_per_day, and max completions are not editable).
7. **Given** a parent edits a task's point value, **When** the task is saved, **Then** future completions use the new point value; existing activity log entries retain their original snapshot values.

---

### Edge Cases

- What happens if a child tries to complete a one-time task that has already been completed (e.g., via direct URL or race condition)? The system must reject the second completion gracefully.
- What happens when a repeated task's completion count reaches the configured maximum? The task becomes unavailable.
- What happens if a parent sets a maximum completion count of 0 or a negative number? The system should treat this as invalid input and prevent saving.
- What happens if a one-time task is deleted after being completed? The activity log entry should remain; the task should not reappear.
- What happens if a parent tries to change a task's type, once_per_day, or max completions? These fields are immutable after creation; only name and points can be edited.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST support two task types: "one-time" and "repeated".
- **FR-002**: One-time tasks MUST only be completable once per child; subsequent completion attempts MUST be rejected. Completed one-time tasks MUST remain visible with undo until end of day.
- **FR-003**: System MUST display a confirmation prompt before a one-time task is marked as completed.
- **FR-004**: Completing a one-time or repeated task MUST award the child the task's configured point value.
- **FR-005**: Completed one-time and repeated task completions MUST be recorded in the child's activity log.
- **FR-006**: Repeated tasks MUST remain available after each completion unless a maximum completion count is configured and reached.
- **FR-007**: Repeated tasks MUST support an optional maximum completion count; when not set, the default is unlimited.
- **FR-008**: When a repeated task's maximum completion count is reached, the task MUST no longer be available to the child.
- **FR-009**: Parents/admins MUST be able to create tasks and specify: task type (one-time or repeated), name, point value, and (for repeated tasks) optional maximum completion count.
- **FR-010**: System MUST prevent saving a repeated task with a maximum completion count of zero or a negative number.
- **FR-016**: Parents/admins MUST be able to edit existing tasks' name and point value only. Type, once_per_day, and max completion count are immutable after creation. Edits MUST NOT retroactively change existing activity log entries (snapshot values are preserved).
- **FR-011**: The admin navigation bar MUST include a "Tasks" link that navigates to the task management page.
- **FR-012**: Completed tasks (one-time, once-per-day, or max-completions reached) MUST remain visible on the dashboard until end of day with a completed state and an undo button.
- **FR-013**: Undo MUST be available for all task types (one-time and repeated) for same-day completions only. Undo reverses the most recent completion for that task. Task undo is independent from the "undo end day" operation (which only affects chores and efforts).
- **FR-014**: Repeated tasks MUST support a "once per day" option that limits the task to one completion per calendar day.
- **FR-015**: The task list MUST display daily completion counts for repeated tasks and group tasks by type (one-time vs repeatable).

### Key Entities

- **Task**: Represents a goal a child can complete. Attributes: name, type (one-time | repeated), point value, optional max completion count.
- **Task Completion**: A record of a child completing a task. Attributes: task reference, child reference, timestamp, points awarded.
- **Activity Log**: The child's history of completed tasks and awarded points, composed of task completion records.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Children can complete a one-time task in under 30 seconds from task list to points awarded, including the confirmation step.
- **SC-002**: One-time tasks are never completable more than once per child — zero instances of duplicate completion in testing.
- **SC-003**: Repeated tasks remain available after each completion when no limit is set — 100% availability verified across multiple completions.
- **SC-004**: All task completions (one-time and repeated) appear in the activity log immediately after completion.
- **SC-005**: Parents can create a task with type, point value, and optional limit in under 2 minutes.

## Clarifications

### Session 2026-05-15

- Q: Should task editing be in scope (US3 mentions "edits" but no scenarios exist)? → A: Yes — parents can update name and points only.
- Q: FR-014 (once_per_day) contradicts assumption about no per-day restriction. Which is correct? → A: Keep once_per_day; remove contradicting assumption.
- Q: How should undo work for repeated task completions? → A: Tasks have their own per-completion undo (undo last today's completion). Day undo only involves chores and efforts, not tasks.
- Q: What fields are editable on an existing task? → A: Only name and points. Type, once_per_day, and max completions are immutable after creation.
- Q: How is once_per_day configured during task creation? → A: Existing creation UI (checkbox on repeated tasks) is correct — no changes needed.

## Assumptions

- Children are already authenticated and associated with a profile before viewing tasks.
- The existing points/rewards system will be used to credit points upon task completion.
- The activity log already exists and supports appending new completion entries.
- Task management (create/edit/delete) is performed by parents or admins, not children.
- Repeated tasks support an optional "once per day" flag that limits completions to one per calendar day (timezone-aware). The max completion count, when set, applies to total completions across all days.
- The confirmation prompt for one-time tasks is a simple in-app dialog (not a separate page).
