# Server Action Contracts: One-Time and Repeated Tasks

All mutations use Next.js Server Actions. No `/api` routes are used for data.

---

## Parent Actions — `lib/actions/tasks.ts`

### `createTaskAction(formData: FormData): Promise<void>`

Creates a new task for the parent's family.

**Input (FormData)**:
| Field             | Type    | Required | Validation                              |
|-------------------|---------|----------|-----------------------------------------|
| `name`            | string  | yes      | Non-empty after trim                    |
| `points`          | number  | yes      | Integer > 0                             |
| `taskType`        | string  | yes      | `'one_time'` or `'repeated'`            |
| `maxCompletions`  | number  | no       | Integer > 0 if provided; omit for unlimited |

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

**Side effects**:
1. Validates the task is available (not deleted, not already completed for one-time, not over limit for repeated).
2. Inserts into `task_completions`.
3. Inserts into `activity_log` with `action_type: 'task_completed'`, `points_delta: task.points`, snapshot fields in `metadata`.
4. The existing DB trigger `after_activity_log_insert` updates `kids.points`.
5. Calls `revalidatePath('/')`.

**Errors**:
- `'Task not found'` — task does not exist or is deleted
- `'Task already completed'` — one-time task already done by this kid
- `'Task completion limit reached'` — repeated task at max_completions
- `'Not authenticated'` — no session

---

## DB Query Functions — `lib/db/tasks.ts`

### `getTaskLibrary(familyId: string): Promise<Task[]>`

Returns all non-deleted tasks for a family, ordered by name.

### `getAvailableTasksForKid(kidId: string, familyId: string): Promise<Task[]>`

Returns tasks visible to a kid:
- Excludes soft-deleted tasks
- Excludes one-time tasks already completed by this kid
- Excludes repeated tasks where completion count >= max_completions (when max is set)

### `createTask(familyId, name, points, taskType, maxCompletions): Promise<void>`

### `softDeleteTask(taskId): Promise<void>`

### `getTaskCompletionCount(taskId, kidId): Promise<number>`

Returns completion count for a given task+kid pair.
