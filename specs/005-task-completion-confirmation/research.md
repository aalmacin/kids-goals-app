# Research: Task Completion Confirmation

## R1: AlertDialog Pattern for Task Completion

**Decision**: Wrap repeated task completion in AlertDialog, matching the existing one-time task pattern in `TaskItem.tsx` (lines 133-152).

**Rationale**: The one-time task AlertDialog is already implemented and proven. Repeated tasks use a plain `<button>` (lines 155-164) that should be replaced with the same AlertDialog wrapper.

**Alternatives considered**:
- Custom modal component — rejected per constitution (shadcn first)
- Toast-based confirmation — rejected, doesn't prevent the action

## R2: AlertDialog for Undo Actions

**Decision**: Wrap the undo button's `onClick` in an AlertDialog trigger. The dialog warns about point deduction before executing `undoLastTaskCompletionAction`.

**Rationale**: Undo currently fires immediately on click (line 113-116 in TaskItem.tsx). Accidental taps reverse earned points without confirmation.

**Alternatives considered**:
- Undo with a timeout/snackbar — more complex, doesn't match existing patterns
- Double-click to undo — poor discoverability, accessibility concerns

## R3: One-Time Tasks Page Location

**Decision**: Create `app/(dashboard)/tasks/page.tsx` within the existing dashboard route group. This shares the dashboard layout (NavBar, auth checks) automatically.

**Rationale**: All kid-facing pages live under `(dashboard)`. The new page follows the same pattern as `/rewards`, `/activity`, `/calendar`.

**Alternatives considered**:
- Tab within Today page — rejected by user (one-time tasks should be separate)
- New route group — unnecessary, `(dashboard)` already handles kid auth

## R4: Task Filtering Strategy

**Decision**: Filter tasks by `taskType` at the page level:
- Today page (`page.tsx`): pass only `repeated` tasks to `TaskSection`
- Tasks page (`tasks/page.tsx`): fetch and display only `one_time` tasks, split into available vs completed sections

**Rationale**: The existing `getAvailableTasksForKid` already returns `TaskWithCounts` with `taskType` field. Filtering is straightforward at the component level.

**Alternatives considered**:
- Separate DB queries per task type — unnecessary overhead, single query + filter is simpler
- Props-based filtering in TaskList — would work but page-level filtering is cleaner

## R5: Completed Tasks Section

**Decision**: On the Tasks page, show completed one-time tasks in a separate "Completed" section below available tasks. Use the existing `completedForNow` flag from `TaskWithCounts`.

**Rationale**: User explicitly requested a separate "Completed" section (clarification session). The `TaskWithCounts` type already has `completedForNow` which indicates whether a task is done.

**Alternatives considered**:
- Separate DB query for completed tasks — `getAvailableTasksForKid` already includes today-completed tasks for undo purposes, so we can reuse it
- Need a new query for historically completed one-time tasks — yes, `getAvailableTasksForKid` filters out fully-completed one-time tasks (line 82: `if (task.task_type === 'one_time') return totalCount === 0`). A new query or modification is needed to include completed one-time tasks for the "Completed" section.

**Follow-up**: Modify `getAvailableTasksForKid` or create a new `getCompletedOneTimeTasks` function to return one-time tasks that have been completed (totalCount > 0).
