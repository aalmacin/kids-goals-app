# Research: Chore Day Scheduling

**Branch**: `005-schedule-chore-days` | **Date**: 2026-05-03

## Decision 1: Schedule Storage — Column on `chores` vs Separate Table

**Decision**: Add `allowed_days smallint[]` column directly to the `chores` table.

**Rationale**: A separate `chore_schedules` table would require an extra JOIN on every chore fetch and adds schema complexity with no benefit at this scale (O(50) chores per family). PostgreSQL's native array support handles `smallint[]` efficiently, including `@>` containment queries. A null or empty array represents "no restriction" (available every day), which is the correct backward-compatible default.

**Alternatives considered**:
- Separate `chore_schedules` table: More normalized but unnecessary complexity for a simple 7-element value.
- Bitmask integer (7 bits): Compact but hard to read and requires bitwise ops for query/update.
- JSONB: Overkill; no nested structure needed.

---

## Decision 2: Schedule Enforcement Location

**Decision**: Enforce server-side in two places: (1) `toggleChore` action (prevents completion outside allowed days), and (2) `getOrCreateDayRecord` (skips seeding completions for schedule-blocked chores on that date).

**Rationale**: FR-008 explicitly requires server-side enforcement. Blocking at `toggleChore` covers direct access attempts. Skipping completion seeding in `getOrCreateDayRecord` keeps the database clean and prevents schedule-blocked chores from appearing in `chore_completions` at all. Both checks use `isChoreAvailableOn(allowedDays, dayOfWeek)` from `lib/chore-schedule.ts`.

**Alternatives considered**:
- UI-only: Rejected per FR-008.
- RLS policy: `allowed_days` restriction cannot be expressed as a RLS policy (no concept of "current day of week" without a function that takes timezone context).
- Database trigger: Would work but puts business logic in the database, harder to test with Vitest.

---

## Decision 3: Day-of-Week Computation

**Decision**: Compute day-of-week from the `date` stored in `day_records` using `new Date(year, month-1, day).getDay()` (splits the ISO date string). The `date` field already represents the family's local date as passed by the client.

**Rationale**: Since the client passes the local date when calling `getDayRecord`, the stored date is already the family-local date. No server-side timezone conversion is needed to determine day-of-week — the date string itself encodes which day it is. A `timezone` column on `families` is added for future server-computed "today" scenarios but is not required for this feature's MVP.

**Alternatives considered**:
- Store UTC timestamp and convert using family timezone: Correct but over-engineered given client already passes local date.
- `getUTCDay()` on ISO date string: Also correct since dates are timezone-free strings.

---

## Decision 4: Backward Compatibility for Existing Chores

**Decision**: `NULL` and empty array `{}` both mean "available every day". The `isChoreAvailableOn` function treats both as unrestricted.

**Rationale**: Existing chores have no `allowed_days` value (NULL after migration). Treating NULL as "always available" preserves existing behavior with no data migration required.

---

## Decision 5: UI Component for Day Selection

**Decision**: Use shadcn `ToggleGroup` (multiple mode) to let parents select days. Each toggle represents one day (Su, Mo, Tu, We, Th, Fr, Sa). The component saves an array of selected day numbers (0–6).

**Rationale**: shadcn `ToggleGroup` provides accessible multi-select semantics out of the box, matching Constitution Principle IV. No custom component needed.
