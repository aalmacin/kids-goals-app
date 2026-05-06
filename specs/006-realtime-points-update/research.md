# Research: Realtime Points Update on Day Completion

## Current Data Flow

### Day Completion Path

1. Kid taps "End Day" → `EndDayButton` calls `endDay(dayRecordId, effortLevelId?)` server action
2. `endDay` server action:
   - Inserts `penalty_applied` entry into `activity_log` with `points_delta: -totalPenalty` (if penalty > 0)
   - Inserts `effort_awarded` entry into `activity_log` with `points_delta: effortPoints` (if effort selected and > 0)
   - Inserts `day_ended` entry into `activity_log` with `points_delta: null`
   - Marks the day record as ended
   - Calls `revalidatePath('/dashboard')`
3. A Postgres DB trigger (`apply_points_delta`) fires on each `activity_log` INSERT with a non-null `points_delta`, and synchronously updates `kids.points`
4. The `revalidatePath('/dashboard')` causes Next.js to regenerate the RSC payload for the route

### Points Display Path

- `DashboardLayout` (server component) fetches `kid.points` from Supabase and passes it to `NavBar` → `PointsBadge` as `initialPoints`
- `PointsBadge` is a client component that initializes local React state with `useState(initialPoints)`
- `PointsBadge` also subscribes to Supabase Realtime for `UPDATE` events on the `kids` table filtered by `kid_id`

---

## Root Cause

`PointsBadge` uses `useState(initialPoints)` to hold the displayed value:

```tsx
const [points, setPoints] = useState(initialPoints)
```

React's `useState` only evaluates the initial value **once**, when the component first mounts. When `revalidatePath('/dashboard')` causes the server to send an updated RSC payload with new `initialPoints`, the client component is already mounted and **ignores the new prop value** — the state stays at the original mount-time value.

The Supabase Realtime subscription correctly updates the state when `kids.points` changes in the database. However:

- If the day ends with **no penalty and no effort reward**, only the `day_ended` log entry is inserted (with `null` points_delta), so `kids.points` is never written to, and **Realtime never fires**.
- In cases where the penalty or effort reward IS applied, Realtime fires and updates the badge correctly.
- But in **all cases**, the `revalidatePath` path is broken: the fresh `initialPoints` from the server re-render is silently dropped by `useState`.

---

## Decisions

### Decision 1: Sync `initialPoints` prop to state via `useEffect`

- **What was chosen**: Add a `useEffect(() => { setPoints(initialPoints) }, [initialPoints])` to `PointsBadge`
- **Rationale**: This is the minimal, correct fix. When the server re-renders the layout and sends updated `initialPoints` after `revalidatePath`, the client component will now pick up the new value. Realtime remains as an additional real-time update mechanism.
- **Alternatives considered**:
  - Remove local state and compute entirely from props — requires restructuring the Realtime handler (would need to store delta separately, then merge), adds complexity
  - Rely solely on Realtime — leaves the bug for the no-penalty, no-effort case and any future scenario where the server sends fresh data without a DB change event
  - Use TanStack Query to own the points value — correct long-term, but over-engineered for this scope

### Decision 2: No server-action changes required

- **What was chosen**: Do not modify `endDay` or any server action
- **Rationale**: The DB trigger already correctly updates `kids.points`. The Realtime subscription already listens. The only broken link is the client component not syncing updated props. Keeping the fix minimal avoids introducing regressions.
- **Alternatives considered**: Explicitly update `kids.points` in the server action — redundant given the DB trigger; duplicates logic and risks inconsistency

---

## Confirmed Architecture

| Layer | Component | Role |
|-------|-----------|------|
| Server action | `lib/actions/day-records.ts:endDay` | Inserts `activity_log` entries, calls `revalidatePath` |
| DB trigger | `apply_points_delta` (Postgres) | Synchronously updates `kids.points` on each non-null `points_delta` insert |
| Realtime | `PointsBadge` subscription | Updates local state when `kids.points` changes in DB |
| RSC re-render | `DashboardLayout` → `NavBar` → `PointsBadge` props | Sends fresh `initialPoints` — currently ignored by `useState` |
