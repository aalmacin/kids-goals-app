# Research: One-Time and Repeated Tasks

## Decision 1: Task Completion Storage

**Decision**: New `tasks` + `task_completions` tables (not piggybacked on chores/day_records)

**Rationale**: Tasks have fundamentally different semantics from chores — they are not day-bound, and their completion is permanent (one-time) or cumulative (repeated). Reusing the `chore_completions` / `day_records` model would require extensive special-casing.

**Alternatives considered**:
- Extend `chores` with a `task_type` column — rejected because chores are tied to a DayRecord (daily context) while tasks are standalone completions.

---

## Decision 2: Points Award Mechanism

**Decision**: On task completion, insert into `activity_log` with `action_type: 'task_completed'` and `points_delta: task.points`. The existing `after_activity_log_insert` trigger recalculates `kids.points` automatically.

**Rationale**: Consistent with the existing event-sourcing pattern. No new trigger or function needed.

**Alternatives considered**:
- Direct `UPDATE kids SET points = points + N` — rejected, violates event-sourcing architecture established in migration 0006.

---

## Decision 3: New `action_type` Values

**Decision**: Add `'task_completed'` and `'task_completion_reversed'` to the `activity_log` `action_type` CHECK constraint via migrations. Update `database.types.ts` and `lib/types.ts`.

**Rationale**: Keeps the type-safe discriminated union pattern used throughout the codebase. Reversal events allow the points trigger to deduct points correctly (negative `points_delta`).

---

## Decision 4: One-Time Task Idempotency Guard

**Decision**: Server action checks `task_completions` for an existing record (`kid_id = X AND task_id = Y`) before inserting. If found, throw an error.

**Rationale**: Prevents double-completion from race conditions or duplicate requests. DB-level trigger provides belt-and-suspenders enforcement.

---

## Decision 5: Repeated Task Limit Enforcement

**Decision**: Server action counts existing completions (`kid_id = X AND task_id = Y`) and compares to `max_completions`. If `max_completions IS NULL` → unlimited. If count >= max_completions → reject.

**Rationale**: Simple, consistent with one-time guard pattern. No extra DB trigger needed.

---

## Decision 6: Confirmation Dialog Component

**Decision**: Use shadcn/ui `AlertDialog` for the one-time task confirmation prompt. The `TaskItem` client component opens the dialog on click; confirmation fires the server action.

**Rationale**: `AlertDialog` is the existing shadcn primitive for destructive/irreversible action confirmations. Already in the project's component library.

---

## Decision 7: Kid Dashboard Task Display

**Decision**: Tasks are shown in a new "Tasks" section on the kid dashboard page, below the chore list. Availability filtering (hide completed one-time tasks, hide capped repeated tasks, hide once-per-day repeated tasks if already done today) is computed server-side on page load.

**Rationale**: Server-side filtering is simpler than client-side and avoids leaking unavailable task data to the client.

---

## Decision 8: Task–Kid Assignment Model

**Decision**: Tasks are family-wide (not kid-specific assignments). Any kid in the family can see and complete the tasks. One-time completion is tracked per kid.

**Rationale**: Simpler than the chore assignment model. Avoids the assignment UI complexity for an MVP.

**Alternatives considered**:
- Per-kid assignments (like chores) — rejected as over-engineering for this feature's MVP scope.

---

## Decision 9: Daily Completion Count — Extend Existing Query

**Decision**: Extend `getAvailableTasksForKid` to return `todayCount` (completions this calendar day in family timezone) alongside each task, returning `TaskWithCounts[]` instead of `Task[]`.

**Rationale**: The function already fetches all `task_completions` for the kid in that family. We can partition them into "today" vs "all-time" in one pass — no extra DB round-trip. The family timezone is obtained from `kid.family_id` via a join or separate fetch already available at the call site.

**Alternatives considered**:
- Separate `getTodayCompletionCounts` call on the dashboard page — rejected (extra DB round-trip, duplicate logic).
- Realtime subscription — over-engineering; SSR + `revalidatePath` after server actions is the established pattern.

---

## Decision 10: Undo Last Completion — Today-Only Restriction

**Decision**: `undoLastTaskCompletionAction(taskId)` deletes the most recent `task_completions` row for the kid+task **only if completed today** (family timezone). Points are deducted via an `activity_log` row with `action_type: 'task_completion_reversed'` and `points_delta = -points_snapshot`.

**Rationale**: Same-day restriction prevents retroactive manipulation. The existing reversal pattern (`penalty_reversed`, `effort_reversed`) establishes precedent. The server action fetches the family timezone from Supabase (already available via `kid.family_id`).

**Alternatives considered**:
- Allow undo of any past completion — rejected (gaming risk; undermines point integrity).
- Soft-delete with `reversed_at` column — more complex schema; hard-delete + reversal log is cleaner.

---

## Decision 11: Once-Per-Day Flag — New Boolean Column

**Decision**: Add `once_per_day boolean NOT NULL DEFAULT false` to `tasks`. When `true` on a `repeated` task, `getAvailableTasksForKid` filters out the task if `todayCount > 0`. The server action also enforces this as a guard.

**Rationale**: Explicit boolean is readable and queryable. Avoids overloading `max_completions` with a sentinel value. The filter logic is one additional branch in the existing availability computation.

**Alternatives considered**:
- Overload `max_completions` with a sentinel (e.g., -1) — confusing semantics, breaks the `> 0` CHECK constraint.
- Separate `task_daily_limits` join table — over-engineering for a single boolean flag.

---

## Decision 12: RLS — DELETE Policy for Kids on `task_completions`

**Decision**: Add a `kid_delete_own_task_completions` RLS policy allowing kids to DELETE their own rows. The server action enforces the "today only" business rule before deleting.

**Rationale**: Supabase server actions run with the authenticated user's RLS context. Without a DELETE policy, the undo action would be rejected at the DB level even though the server action has already validated the request.

**Alternatives considered**:
- Service-role client to bypass RLS — rejected (constitution requires RLS on all tables).

---

## Decision 13: Undo UI — Repeated Tasks Only, Today Count > 0

**Decision**: `TaskItem` shows a count badge ("done N times today") and an undo button for `repeated` tasks where `todayCount > 0`. No undo for `one_time` tasks (they have a confirmation dialog that gates completion).

**Rationale**: One-time tasks are intentionally gated by confirmation; adding undo would contradict the "permanent" semantic. For repeated tasks, accidental double-clicks are the main UX concern.

---

## Decision 14: Admin UI — Once-Per-Day Checkbox

**Decision**: The admin task creation form adds a "Once per day" checkbox visible only for `repeated` task type. The checkbox is client-side interactive (show/hide based on task type selection). `oncePerDay: false` is always stored for `one_time` tasks regardless of form state.

**Rationale**: Simple JS conditional visibility; no hidden fields needed. Keeps the form minimal.
