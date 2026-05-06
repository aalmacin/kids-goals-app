# Data Model: Chore Day Scheduling

**Branch**: `005-schedule-chore-days` | **Date**: 2026-05-03

## Changes Overview

This feature adds two columns to existing tables. No new tables are introduced.

---

## Modified Table: `chores`

Added column:

| Column | Type | Constraints |
|--------|------|-------------|
| allowed_days | smallint[] | NULL (default NULL = no restriction) |

**Semantics**: An array of weekday numbers where 0 = Sunday, 1 = Monday, …, 6 = Saturday. NULL or empty array means the chore is available every day. A chore with `allowed_days = '{1,3,5}'` is available on Monday, Wednesday, Friday.

**Migration**:
```sql
ALTER TABLE chores ADD COLUMN allowed_days smallint[] NULL;
```

**RLS impact**: None — existing RLS policies on `chores` cover all columns including `allowed_days`. Parents can write; kids can read.

**Index**: Not needed. Schedule lookup is always on a single chore row already fetched by primary key.

---

## Modified Table: `families`

Added column:

| Column | Type | Constraints |
|--------|------|-------------|
| timezone | text | NOT NULL DEFAULT 'UTC' |

**Semantics**: IANA timezone identifier (e.g., `'America/New_York'`). Used when the server needs to determine the current local date for the family without relying on the client.

**Migration**:
```sql
ALTER TABLE families ADD COLUMN timezone text NOT NULL DEFAULT 'UTC';
```

**RLS impact**: None — covered by existing `families` RLS policies.

---

## Affected Types (lib/types.ts)

### `Chore` — add field
```typescript
allowedDays: number[]  // [] = available every day; [0,6] = weekends only
```

### `Family` — add field (new type if not already exported)
```typescript
export type Family = {
  id: string
  name: string
  parentId: string
  timezone: string
  createdAt: string
}
```

---

## New Pure Utility: lib/chore-schedule.ts

Not a database entity, but a pure logic module referenced throughout the feature.

```typescript
// Returns true if the chore is available on the given dayOfWeek (0=Sun...6=Sat)
// An empty or null allowedDays means always available
isChoreAvailableOn(allowedDays: number[] | null, dayOfWeek: number): boolean

// Returns the day-of-week number from an ISO date string 'YYYY-MM-DD'
dayOfWeekFromDate(date: string): number

// Returns the next Date on which the chore is available (after a given date)
// Returns null if allowedDays is empty/null (always available)
getNextAvailableDate(allowedDays: number[], fromDate: Date): Date | null
```

---

## Migration File

`supabase/migrations/20260503000000_add_chore_allowed_days.sql`

```sql
-- Add chore day schedule
ALTER TABLE chores ADD COLUMN allowed_days smallint[] NULL;

-- Add family timezone for future server-side "today" computation
ALTER TABLE families ADD COLUMN timezone text NOT NULL DEFAULT 'UTC';
```
