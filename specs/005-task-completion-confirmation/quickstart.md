# Quickstart: Task Completion Confirmation

## Prerequisites

- bun installed
- Supabase local instance running (`bunx supabase start`)

## Dev Setup

```bash
bun install
bun run dev
```

## Key Files to Modify

| File | Change |
|------|--------|
| `components/task-list/TaskItem.tsx` | Wrap repeated task in AlertDialog; wrap undo button in AlertDialog |
| `app/(dashboard)/page.tsx` | Filter `availableTasks` to `taskType === 'repeated'` before passing to TaskSection |
| `app/(dashboard)/tasks/page.tsx` | NEW — one-time tasks page with available + completed sections |
| `components/navbar/NavBar.tsx` | Add "Tasks" link for kid role |
| `components/navbar/MobileMenu.tsx` | Add "Tasks" link for kid role |
| `lib/db/tasks.ts` | Add `getCompletedOneTimeTasks` query |

## Testing

```bash
bun run test           # Unit/integration tests
bunx playwright test   # E2E tests
```

> **E2E requirement**: Scenario-specific E2E tests (task confirmation dialogs, undo flow, Tasks page nav) require a seeded local Supabase instance with at least one kid account, one repeated task, and one one-time task. Tests without seeded data are skipped. Run `bunx supabase db reset --local` with seed data before running Playwright.

## Verification

1. Log in as a kid
2. Today page: only repeated tasks visible in task section
3. Nav bar: "Tasks" link visible, navigates to `/tasks`
4. Tasks page: available one-time tasks shown, completed ones in "Completed" section
5. Tap a repeated task → confirmation dialog appears
6. Tap undo on any task → confirmation dialog appears
7. Cancel on any dialog → no state change
