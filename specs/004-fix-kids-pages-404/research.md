# Research: Fix Kids Pages 404 and Missing Chores

## Root Cause Analysis

### Bug 1: Kids Pages Returning 404

**Decision**: The NavBar component uses incorrect URL paths with a `/dashboard` prefix.

**Rationale**: The app uses Next.js route groups — `app/(dashboard)/` — where parenthesized folders don't create URL segments. The actual routes are:
- `/` (not `/dashboard`)
- `/activity` (not `/dashboard/activity`)
- `/rewards` (not `/dashboard/rewards`)
- `/calendar` (not `/dashboard/calendar`)

The build output confirms this:
```
┌ f /
├ f /activity
├ f /calendar
├ f /rewards
```

But the NavBar links all use `/dashboard` prefix:
- `<Link href="/dashboard">` for Today
- `<Link href="/dashboard/rewards">` for Rewards
- `<Link href="/dashboard/activity">` for Activity
- `<Link href="/dashboard/calendar">` for Calendar

**Affected file**: `components/navbar/NavBar.tsx`

**Alternatives considered**: None — this is a clear routing bug, not a design decision.

### Bug 2: Chores Assigned Not Showing

**Decision**: This is most likely a consequence of Bug 1. When kids click nav links, they get 404s instead of the dashboard. The actual chore display logic in `getOrCreateDayRecord` and `ChoreList` is correct.

**Rationale**:
- The `getOrCreateDayRecord` function correctly seeds `chore_completions` from `chore_assignments` when creating a new day record
- The `ChoreList` component correctly renders completions
- If a kid navigates directly to `/`, chores should appear (if assignments exist)
- The "chores not showing" symptom is caused by the 404 — kids can't reach the dashboard page

**Additional minor issue**: The `chore_completions` table and seeding logic don't include the chore `icon`. The `ChoreItem` component falls back to a 'star' icon via `completion.choreIcon ?? 'star'`. This is cosmetic, not functional.

## Fix Summary

| Issue | Fix | File |
|-------|-----|------|
| NavBar links use `/dashboard/*` | Remove `/dashboard` prefix from all links | `components/navbar/NavBar.tsx` |
| Logo link uses `/dashboard` | Change to `/` | `components/navbar/NavBar.tsx` |
| Chore icon not passed through | Add icon snapshot to seeding and display (optional enhancement) | `lib/db/day-records.ts`, `app/(dashboard)/page.tsx` |
