# Server Action Contracts: One-Time and Repeated Tasks

All mutations use Next.js Server Actions. No `/api` routes are used for data.

---

## Parent Actions — `lib/actions/tasks.ts`

### `createTaskAction(formData: FormData): Promise<void>`

Creates a new task for the parent's family.

**Input (FormData)**:
| Field            | Type    | Required | Validation                                          |
|------------------|---------|----------|-----------------------------------------------------|
| `name`           | string  | yes      | Non-empty after trim                                |
| `points`         | number  | yes      | Integer > 0                                         |
| `taskType`       | string  | yes      | `'one_time'` or `'repeated'`                        |
| `maxCompletions` | number  | no       | Integer > 0 if provided; omit for unlimited          |
| `oncePerDay`     | string  | no       | `'on'` if checkbox checked; stored as boolean false for one_time tasks |

**Side effects**: Inserts into `tasks`. Calls `revalidatePath('/admin/tasks')`.

**Errors**: Throws if not authenticated parent, family not found, or validation fails.

---

### `deleteTaskAction(taskId: string): Promise<void>`

Soft-deletes a task (sets `deleted_at`).

**Side effects**: Updates `tasks.deleted_at`. Calls `revalidatePath('/admin/tasks')`.

**Errors**: Throws if not authenticated parent or task not in parent's family.

---

## Kid Actions — `lib/actions/tasks.ts`

### `completeTaskAction(taskId: string): Promise<void>`

Records a task completion for the authenticated kid and awards points.

**Guards** (checked in order):
1. Task exists and is not deleted
2. `one_time`: totalCount === 0 (else → `'Task already completed'`)
3. `repeated` with `once_per_day = true`: todayCount === 0 (else → `'Task already completed today'`)
4. `repeated` with `max_completions` set: totalCount < max_completions (else → `'Task completion limit reached'`)

**Side effects**:
1. Inserts into `task_completions`
2. Inserts into `activity_log` with `action_type: 'task_completed'`, `points_delta: task.points`
3. DB trigger updates `kids.points`
4. Calls `revalidatePath('/')`

---

### `undoLastTaskCompletionAction(taskId: string): Promise<void>`

Removes the most recent task completion for the authenticated kid, deducting points.

**Guards**:
1. Task exists and is not deleted
2. A completion exists for this kid+task today (family timezone) — else → `'No completion to undo today'`
3. The task is `repeated` — undo is not available for `one_time` tasks

**Side effects**:
1. Deletes the most recent `task_completions` row for kid+task (today only)
2. Inserts into `activity_log` with `action_type: 'task_completion_reversed'`, `points_delta: -points_snapshot`
3. DB trigger updates `kids.points`
4. Calls `revalidatePath('/')`

**Errors**:
- `'No completion to undo today'` — no same-day completion found
- `'Cannot undo one-time task'` — task type is `one_time`
- `'Not authenticated'` — no session

---

## DB Query Functions — `lib/db/tasks.ts`

### `getTaskLibrary(familyId: string): Promise<Task[]>`

Returns all non-deleted tasks for a family, ordered by name. Used by admin pages (no count needed).

### `getAvailableTasksForKid(kidId: string, familyId: string, familyTimezone: string): Promise<TaskWithCounts[]>`

Returns tasks visible to a kid with today's completion count:
- Excludes soft-deleted tasks
- Excludes `one_time` tasks where totalCount > 0
- Excludes `repeated` + `once_per_day` tasks where todayCount > 0
- Excludes `repeated` tasks where totalCount >= max_completions (when max is set)
- Returns `todayCount` on each task (completions with `completed_at` >= start of today in family timezone)

### `createTask(familyId, name, points, taskType, maxCompletions, oncePerDay): Promise<void>`

### `softDeleteTask(taskId): Promise<void>`

### `getTaskCompletionCount(taskId, kidId): Promise<number>`

Returns total completion count for a given task+kid pair.

### `undoLastTaskCompletion(taskId, kidId, familyTimezone): Promise<{ pointsSnapshot: number } | null>`

Deletes the most recent `task_completions` row for kid+task completed today.
Returns the deleted row's `points_snapshot` (for the reversal log entry), or `null` if none found.
