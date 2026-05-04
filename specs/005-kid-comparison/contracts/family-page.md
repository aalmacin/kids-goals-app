# UI Contracts: Family Page

## FamilyPageClient

`'use client'` wrapper component. Manages TanStack Query hydration and Supabase Realtime subscription.

```typescript
interface FamilyPageClientProps {
  familyId: string
  currentKidId: string
  initialMembers: FamilyMember[]
  initialDailyProgress: DailyProgressEntry[]
  initialWeeklySummary: WeeklySummaryEntry[]
  today: string
  sevenDaysAgo: string
}
```

**Behavior**:
- Hydrates TanStack Query `['familyMembers', familyId]` with `initialMembers`
- Subscribes to Supabase Realtime `kids` UPDATE events for this `familyId`
- On Realtime event: invalidates `['familyMembers', familyId]` to trigger refetch
- Renders `<Leaderboard>`, `<DailyProgress>`, `<WeeklySummary>` with live data

## Leaderboard

```typescript
interface LeaderboardProps {
  kids: FamilyMember[]        // sorted by points DESC
  currentKidId: string
}
```

**Renders**: Ranked list of Cards. Current kid's card has `border-indigo-400 bg-indigo-50` and a "You" Badge. Each card shows rank number, name, and total points (⭐).

## DailyProgress

```typescript
interface DailyProgressProps {
  progress: DailyProgressEntry[]
  currentKidId: string
}
```

**Renders**: One Card per kid. Shows:
- Name + "You" badge (if current kid)
- Rest day: `<Badge variant="outline">Rest Day</Badge>`
- All done: `<Badge className="bg-green-500">Done ✓</Badge>`
- In progress: `{completedCount}/{totalCount}` + Tailwind progress bar
- Points earned today: shown below the progress bar when > 0

## WeeklySummary

```typescript
interface WeeklySummaryProps {
  summary: WeeklySummaryEntry[]  // sorted by weeklyPoints DESC
  currentKidId: string
}
```

**Renders**: Ranked list of Cards. Shows rank, name, and `+N ⭐` weekly points. Current kid highlighted with indigo styling.

## Family Page (Server Component)

Route: `app/(dashboard)/family/page.tsx`

**Auth flow**:
1. `supabase.auth.getUser()` → redirect to `/login` if unauthenticated
2. `getFamilyByParentId(user.id)` → redirect to `/admin` if parent
3. Query `kids` by `supabase_user_id` → redirect to `/login` if not found

**Fallback**: If `getFamilyMembers(kid.family_id)` returns empty, use `[{ id: kid.id, name: kid.name, points: kid.points }]`

**Renders**: `<FamilyPageClient>` with all initial data props
