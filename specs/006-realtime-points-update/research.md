# Research: Realtime Points Update on Day Completion

## Current Data Flow

### Day Completion Path

1. Kid taps "End Day" → `EndDayButton` calls `endDay(dayRecordId, effortLevelId?)` server action
2. `endDay` server action:
   - Inserts `penalty_applied` into `activity_log` with `points_delta: -totalPenalty` (if penalty > 0)
   - Inserts `effort_awarded` into `activity_log` with `points_delta: effortPoints` (if effort > 0)
   - Inserts `day_ended` into `activity_log` with `points_delta: null`
   - Marks `day_records.ended_at = now()`
   - Calls `revalidatePath('/dashboard')`
3. DB trigger `after_activity_log_insert` → `recalculate_kid_points` fires per INSERT with non-null `points_delta`; recalculates `kids.points` as the sum of all deltas
4. `revalidatePath('/dashboard')` is called but **has no effect** — the (dashboard) route group serves URLs like `/`, `/rewards`, `/family`, not `/dashboard`

### Points Display Path

- `DashboardLayout` (server component) fetches `kid.points` from Supabase and passes to `NavBar` → `PointsBadge` as `initialPoints`
- `PointsBadge` initializes `useState(initialPoints)` and subscribes to Supabase Realtime `UPDATE` on `kids` filtered by `kid_id`

---

## Root Cause Analysis

### Bug 1 — `useState` ignores updated props (primary UI bug)

React's `useState` uses the initial value only on first mount. When the server re-renders the layout with a new `initialPoints` prop, the already-mounted `PointsBadge` ignores it. The Realtime subscription mitigates this when `kids.points` changes, but:

- If the day ends with **no penalty and no effort reward**, only a `day_ended` row is inserted (null delta) — `kids.points` is not written, Realtime never fires, and the badge never updates.

### Bug 2 — `revalidatePath('/dashboard')` targets a non-existent URL

Route groups strip their names from URLs. The real paths are `/`, `/rewards`, `/family`, `/activity`, `/calendar`. After navigating away and back, the Next.js cache serves stale `kid.points` from the layout.

---

## Decisions

### Decision 1: Sync `initialPoints` prop to state via `useEffect`

- **Chosen**: Add `useEffect(() => { setPoints(initialPoints) }, [initialPoints])` to `PointsBadge`
- **Rationale**: Minimal correct fix. Realtime handles on-screen live updates; `useEffect` handles the server re-render path and the no-penalty/no-effort edge case.
- **Alternatives considered**: Rely solely on Realtime — misses the null-delta case. TanStack Query for points — over-engineered for this scope.

### Decision 2: Fix `revalidatePath` targets

- **Chosen**: Change `revalidatePath('/dashboard')` → `revalidatePath('/')` in `lib/actions/day-records.ts`
- **Rationale**: The layout lives at `/`; revalidating it keeps server-rendered `kid.points` fresh after navigation.

### Decision 3: `undoEndDay` via event-sourcing reversal

- **Chosen**: Insert equal-and-opposite `activity_log` entries (`penalty_reversed`, `effort_reversed`) for each points-bearing entry from the original day completion; then reset `day_records.ended_at = null` and `effort_level_id = null`
- **Rationale**: `recalculate_kid_points` trigger sums all `points_delta`. Reversal entries keep the audit log complete and consistent without bypassing the trigger.
- **Alternatives considered**: Delete original log entries — destroys audit trail. Store pre-completion snapshot — bypasses event sourcing.

### Decision 4: New `activity_log` action types

- **Chosen**: Add `day_undone`, `penalty_reversed`, `effort_reversed` to the `action_type` CHECK constraint via a new migration
- **Rationale**: Follows the same pattern as migration 0006 (`manual_adjustment`).

### Decision 5: `UndoEndDayButton` placement

- **Chosen**: Render `UndoEndDayButton` on the dashboard page whenever `isEnded` is true
- **Rationale**: The calendar navigates to `/?date=<date>`, which is the same page. One placement satisfies FR-008 (accessible from today's view and calendar day view).

---

## Confirmed Architecture

| Layer | Component | Role |
|-------|-----------|------|
| Server action | `lib/actions/day-records.ts:endDay` | Inserts activity_log entries, calls `revalidatePath('/')` |
| Server action | `lib/actions/day-records.ts:undoEndDay` | NEW: reversal entries, resets day record, calls `revalidatePath('/')` |
| DB trigger | `after_activity_log_insert` → `recalculate_kid_points` | Recalculates `kids.points` as sum of all deltas |
| Realtime | `PointsBadge` subscription | Updates local state when `kids.points` changes |
| RSC re-render | `DashboardLayout` → `NavBar` → `PointsBadge` | Sends fresh `initialPoints`; `useEffect` now syncs it |
