# Data Model: Task Completion Confirmation

No new entities or schema changes required. This feature uses existing tables and types.

## Existing Entities (no changes)

### Task
- `id`: UUID (PK)
- `family_id`: UUID (FK → families)
- `name`: string
- `points`: number
- `task_type`: 'one_time' | 'repeated'
- `max_completions`: number | null
- `once_per_day`: boolean
- `deleted_at`: timestamp | null (soft delete)

### TaskCompletion
- `id`: UUID (PK)
- `task_id`: UUID (FK → tasks)
- `kid_id`: UUID (FK → kids)
- `task_name_snapshot`: string
- `points_snapshot`: number
- `completed_at`: timestamp (auto-set on insert)

## New Query: getCompletedOneTimeTasks

A new DB function is needed to fetch one-time tasks that have already been completed by a kid. The existing `getAvailableTasksForKid` excludes these (it only returns tasks with `totalCount === 0` for one-time type).

**Input**: `kidId`, `familyId`
**Output**: Array of completed one-time tasks with completion metadata (name, points, completed date)
**Filter**: `task_type = 'one_time'` AND has at least one `task_completion` for this kid

## State Transitions

No changes to existing state transitions. The confirmation dialog is a UI-only gate that delays the existing mutation calls (`completeTaskAction`, `undoLastTaskCompletionAction`).
