# Quickstart: One-Time and Repeated Tasks

## Prerequisites

- Supabase CLI installed
- Local Supabase instance running (`supabase start`)

## 1. Apply Database Migration

Migration file: `supabase/migrations/0007_tasks.sql`

Apply it:

```bash
supabase db push
```

The migration:

1. Create `tasks` table with `task_type` CHECK and `max_completions` constraint
2. Create `task_completions` table with partial unique index for one-time tasks
3. Add `'task_completed'` to `activity_log` action_type CHECK constraint
4. Enable RLS on both new tables
5. Add RLS policies for parent (ALL) and kid (SELECT on tasks, SELECT+INSERT on task_completions)

See `data-model.md` for full column definitions and RLS policy SQL.

## 2. Update TypeScript Types

- Add `Task` and `TaskCompletion` types to `lib/types.ts`
- Add `tasks` and `task_completions` table definitions to `lib/database.types.ts`
- Add `'task_completed'` to `ActivityLogEntry.actionType` union in both files

## 3. Add DB Query Layer

Create `lib/db/tasks.ts` with functions per `contracts/server-actions.md`.

## 4. Add Server Actions

Create `lib/actions/tasks.ts` (`'use server'`) with:
- `createTaskAction` — parent creates a task
- `deleteTaskAction` — parent soft-deletes a task
- `completeTaskAction` — kid completes a task

## 5. Admin UI

- Add `"Tasks"` link to admin navbar in `app/(admin)/admin/layout.tsx`
- Create `app/(admin)/admin/tasks/page.tsx` — task CRUD page (mirrors chores page pattern)

## 6. Kid Dashboard UI

- Create `components/task-list/TaskItem.tsx` — client component with `AlertDialog` confirmation for one-time tasks
- Create `components/task-list/TaskList.tsx` — renders task items
- Update `app/(dashboard)/page.tsx` — fetch available tasks server-side, render `TaskList` below chores

## 7. Run Tests

```bash
# Unit + integration
npx vitest run

# E2E (requires seeded local Supabase)
npx playwright test
```
