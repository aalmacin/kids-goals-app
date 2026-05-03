# Research: Kid Comparison

## Data Access

### Decision: Read all sibling data using existing Supabase typed client with new RLS policies

**Rationale**: The `kids` table currently has no RLS policy allowing a kid to read other kids' rows. To display sibling data, two options exist: (1) add RLS policies for family-scoped reads, or (2) use a service-role client in a server action. Option 1 is correct per constitution — RLS on every table, enforced at the DB layer. No new tables are needed.

**Alternatives considered**:
- Service-role bypass: Rejected — undermines RLS-first security posture required by the constitution.
- Materialized view: Overkill for a small family app; raw queries are sufficient.

### Decision: Weekly summary computed via `activity_log` `points_delta` aggregation

**Rationale**: `activity_log` is the event-sourced source of truth for all points changes. Summing `points_delta` where `created_at >= now() - 7 days` and `kid_id = X` gives the accurate weekly delta per kid. The `kids.points` field reflects all-time total only.

**Alternatives considered**:
- Querying `day_records` + `chore_completions`: Does not capture penalty, effort award, or rest-day cost events. Incomplete.
- Storing weekly points on the kid record: Requires a cron job or trigger; over-engineered for this scale.

### Decision: Daily progress computed from `day_records` + `chore_completions` for today's date

**Rationale**: Each kid has at most one `day_record` per date. Counting completions where `completed_at IS NOT NULL` vs total completions gives the chore fraction for that day. If no day_record exists yet, the kid hasn't started their day (show 0/0 or "Not started").

**Alternatives considered**:
- Counting from `chore_assignments` directly: Doesn't capture rest days or partially-completed days correctly.

## UI Approach

### Decision: Server Component page — no TanStack Query needed

**Rationale**: The comparison page is read-only with no interactive mutations. It renders on demand as a Next.js server component, fetching all data server-side in a single pass. No client-side state management required. TanStack Query is reserved for client components that need caching or optimistic updates (none on this page).

**Alternatives considered**:
- Client component with TanStack Query: Adds unnecessary complexity for a static read.

### Decision: shadcn Card + Badge for leaderboard; shadcn Progress for daily chores

**Rationale**: Constitution requires shadcn-first. `Card` provides the entry container, `Badge` highlights ranks and the "you" indicator, `Progress` shows the chore completion bar. No custom components needed.

## RLS Policies

### Decision: Add `kid_select_sibling_kids` RLS policy on `kids` table

```sql
CREATE POLICY kid_select_sibling_kids ON kids
  FOR SELECT
  USING (
    family_id IN (
      SELECT family_id FROM kids WHERE supabase_user_id = auth.uid()
    )
  );
```

### Decision: Add `kid_select_sibling_day_records` RLS policy on `day_records` table

```sql
CREATE POLICY kid_select_sibling_day_records ON day_records
  FOR SELECT
  USING (
    kid_id IN (
      SELECT id FROM kids WHERE family_id IN (
        SELECT family_id FROM kids WHERE supabase_user_id = auth.uid()
      )
    )
  );
```

**Note**: The `activity_log` table already has an RLS policy allowing kids to see all family entries (`kid_select_activity_log`). No change needed.

## Fix Summary

| Component | Change | File |
|-----------|--------|------|
| RLS policy — kids cross-sibling | New migration | `supabase/migrations/0010_kid_comparison_rls.sql` |
| RLS policy — day_records cross-sibling | New migration | `supabase/migrations/0010_kid_comparison_rls.sql` |
| Compare DB helpers | New module | `lib/db/compare.ts` |
| Compare page | New server component | `app/(dashboard)/compare/page.tsx` |
| Leaderboard component | New component | `components/compare/Leaderboard.tsx` |
| Daily progress component | New component | `components/compare/DailyProgress.tsx` |
| Weekly summary component | New component | `components/compare/WeeklySummary.tsx` |
| NavBar — Compare link | Update | `components/navbar/NavBar.tsx` |
