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

## Decision 3: New `action_type` Value

**Decision**: Add `'task_completed'` to the `activity_log` `action_type` CHECK constraint via a new migration. Also update `database.types.ts` and `lib/types.ts`.

**Rationale**: Keeps the type-safe discriminated union pattern used throughout the codebase.

---

## Decision 4: One-Time Task Idempotency Guard

**Decision**: Server action checks `task_completions` for an existing record (`kid_id = X AND task_id = Y`) before inserting. If found, throw an error.

**Rationale**: Prevents double-completion from race conditions or duplicate requests. DB-level enforcement is the safest option; no need for a separate unique constraint (though one is added as a belt-and-suspenders measure).

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

**Decision**: Tasks are shown in a new "Tasks" section on the kid dashboard page, below the chore list. Availability filtering (hide completed one-time tasks, hide capped repeated tasks) is computed server-side on page load.

**Rationale**: Server-side filtering is simpler than client-side and avoids leaking unavailable task data to the client.

---

## Decision 8: Task–Kid Assignment Model

**Decision**: Tasks are family-wide (not kid-specific assignments). Any kid in the family can see and complete the tasks. One-time completion is tracked per kid.

**Rationale**: Simpler than the chore assignment model. Parents who need kid-specific tasks can control this via task names. Avoids the assignment UI complexity for an MVP.

**Alternatives considered**:
- Per-kid assignments (like chores) — rejected as over-engineering for this feature's MVP scope.
