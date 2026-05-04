# Research: Family Page (005-kid-comparison)

## 1. Root Cause of the "No Siblings" Bug

**Decision**: The guard `if (siblings.length <= 1)` in `compare/page.tsx` is the bug trigger.

When migration `0007_kid_comparison_rls.sql` is not applied to a local Supabase instance, only the original `kid_select_self` policy is active — so `getSiblings` returns only the logged-in kid's own row, making `siblings.length === 1` and triggering the message.

**Fix**: Remove the guard entirely. The Family page shows all family members including the logged-in kid. Single-kid families are valid and show one card.

**Alternatives considered**: Adding a better empty state — rejected, because the Family page always has at least one member (the logged-in kid).

## 2. Family Resolution via `family_id`

**Decision**: Use `kid.family_id` directly from the kids table. The existing `getSiblings` (to be renamed `getFamilyMembers`) already does this correctly via `SELECT * FROM kids WHERE family_id = $1`.

**Rationale**: The clarification Q1 ("via parent") described the ownership relationship, not the query path. Direct `family_id` lookup is simpler. The "via parent" path adds an unnecessary JOIN.

**Fallback**: When `kid.family_id` is missing or the query returns empty, show only the logged-in kid's card. The page always renders something.

## 3. Data Fetch Strategy (Hybrid)

**Decision**: Server Component renders initial family data (SSR). A `'use client'` child component wraps with TanStack Query using `initialData` from SSR and subscribes to Supabase Realtime on the `kids` table for live points updates.

**Rationale**: Fastest initial load (no loading skeleton flash) + live updates when siblings earn points. Aligns with constitution §II (real-time for live data) and §III (TanStack Query for server state).

**Realtime channel**: Subscribe to `kids` table `UPDATE` events filtered by `family_id`. On update, invalidate `['familyMembers', familyId]` to trigger a refetch.

**Alternatives considered**:
- Pure SSR only — rejected, misses real-time requirement
- Pure client fetch — rejected, causes loading flash on page entry

## 4. Daily Progress Data Sources

**Decision**: `DayRecord` for completed/total chore counts and rest day status; `ActivityLog` for points earned today.

**Rationale**: `DayRecord` + `chore_completions` is authoritative for chore state. `ActivityLog` tracks point events, making it the right source for today's earned points (distinct from cumulative `kids.points`).

**Implementation**: Add `pointsEarnedToday` to `DailyProgressEntry` by summing `activity_log.points_delta` where `DATE(created_at) = today` per kid.

## 5. Routing Strategy

**Decision**: New route `app/(dashboard)/family/page.tsx`. Existing `app/(dashboard)/compare/page.tsx` calls `redirect('/family')`.

**Rationale**: Clean URL, no broken links from existing sessions. NavBar link updated from `/compare` → `/family`, label "Compare" → "Family".

## 6. File Renames

| Old | New |
|-----|-----|
| `lib/db/compare.ts` | `lib/db/family.ts` |
| `components/compare/Leaderboard.tsx` | `components/family/Leaderboard.tsx` |
| `components/compare/DailyProgress.tsx` | `components/family/DailyProgress.tsx` |
| `components/compare/WeeklySummary.tsx` | `components/family/WeeklySummary.tsx` |
| `SiblingKid` type | `FamilyMember` type |
| `getSiblings()` | `getFamilyMembers()` |

**Rationale**: "Sibling" framing replaced by "Family" throughout. All import paths updated.

## 7. RLS Policies (Already Applied)

Migration `0007_kid_comparison_rls.sql` already contains the correct policies:
- `kid_select_sibling_kids` — kids SELECT all kids in their family
- `kid_select_sibling_day_records` — kids SELECT day_records for family members
- `kid_select_sibling_chore_completions` — kids SELECT chore_completions for family members

No new migration needed for this phase. Ensure `supabase migration up` is run locally.
