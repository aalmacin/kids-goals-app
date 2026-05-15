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
| `components/task-list/TaskSection.tsx` | Accept `filterType` prop to show only repeated tasks on Today page |
| `app/(dashboard)/page.tsx` | Filter to pass only repeated tasks to TaskSection |
| `app/(dashboard)/tasks/page.tsx` | NEW — one-time tasks page with available + completed sections |
| `components/navbar/NavBar.tsx` | Add "Tasks" link for kid role |
| `components/navbar/MobileMenu.tsx` | Add "Tasks" link for kid role |
| `lib/db/tasks.ts` | Add `getCompletedOneTimeTasks` query |

## Testing

```bash
bun run test           # Unit/integration tests
bunx playwright test   # E2E tests
```

## Verification

1. Log in as a kid
2. Today page: only repeated tasks visible in task section
3. Nav bar: "Tasks" link visible, navigates to `/tasks`
4. Tasks page: available one-time tasks shown, completed ones in "Completed" section
5. Tap a repeated task → confirmation dialog appears
6. Tap undo on any task → confirmation dialog appears
7. Cancel on any dialog → no state change
