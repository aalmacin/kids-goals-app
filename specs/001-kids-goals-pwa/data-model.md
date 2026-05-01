# Data Model: Kids Goals PWA

**Branch**: `001-kids-goals-pwa` | **Date**: 2026-04-25

## Entity Relationship Overview

```
families ──< kids ──< chore_assignments >── chores (library)
                 ├──< day_records ──< chore_completions
                 └──< reward_redemptions >── rewards

families ──< chores (library)
families ──< rewards
families ──< effort_levels

activity_log ──> kids (nullable)
activity_log ──> families
```

---

## Tables

### `families`

| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK, DEFAULT gen_random_uuid() |
| name | text | NOT NULL, UNIQUE |
| parent_id | uuid | NOT NULL, FK → auth.users(id) |
| created_at | timestamptz | NOT NULL, DEFAULT now() |

**RLS**: Parent can SELECT/UPDATE own family (WHERE parent_id = auth.uid()). Kids can SELECT family they belong to.

---

### `kids`

| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK, DEFAULT gen_random_uuid() |
| family_id | uuid | NOT NULL, FK → families(id) ON DELETE CASCADE |
| supabase_user_id | uuid | NOT NULL, UNIQUE, FK → auth.users(id) |
| name | text | NOT NULL |
| birthday | date | NOT NULL |
| points | integer | NOT NULL DEFAULT 0, CHECK (points >= 0) |
| created_at | timestamptz | NOT NULL, DEFAULT now() |

**Unique constraint**: `UNIQUE(family_id, name)` — enforces kid name uniqueness within a family.

**RLS**: Parent can ALL on own family's kids. Kid can SELECT own row (WHERE supabase_user_id = auth.uid()).

---

### `chores` (library)

| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK, DEFAULT gen_random_uuid() |
| family_id | uuid | NOT NULL, FK → families(id) ON DELETE CASCADE |
| name | text | NOT NULL |
| penalty | integer | NOT NULL DEFAULT 0, CHECK (penalty >= 0) |
| is_important | boolean | NOT NULL DEFAULT false |
| icon | text | NOT NULL |
| deleted_at | timestamptz | NULL (soft delete) |
| created_at | timestamptz | NOT NULL, DEFAULT now() |

**RLS**: Parent can ALL on own family. Kids can SELECT where deleted_at IS NULL.

---

### `chore_assignments`

| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK, DEFAULT gen_random_uuid() |
| chore_id | uuid | NOT NULL, FK → chores(id) ON DELETE CASCADE |
| kid_id | uuid | NOT NULL, FK → kids(id) ON DELETE CASCADE |
| created_at | timestamptz | NOT NULL, DEFAULT now() |

**Unique constraint**: `UNIQUE(chore_id, kid_id)`.

**RLS**: Parent can ALL on own family. Kid can SELECT own assignments.

---

### `effort_levels`

| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK, DEFAULT gen_random_uuid() |
| family_id | uuid | NOT NULL, FK → families(id) ON DELETE CASCADE |
| name | text | NOT NULL |
| points | integer | NOT NULL DEFAULT 0, CHECK (points >= 0) |
| created_at | timestamptz | NOT NULL, DEFAULT now() |

**RLS**: Parent can ALL. Kids can SELECT own family's levels.

---

### `rewards`

| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK, DEFAULT gen_random_uuid() |
| family_id | uuid | NOT NULL, FK → families(id) ON DELETE CASCADE |
| name | text | NOT NULL |
| points_cost | integer | NOT NULL, CHECK (points_cost > 0) |
| icon | text | NOT NULL |
| deleted_at | timestamptz | NULL (soft delete) |
| created_at | timestamptz | NOT NULL, DEFAULT now() |

**RLS**: Parent can ALL. Kids can SELECT where deleted_at IS NULL.

---

### `day_records`

| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK, DEFAULT gen_random_uuid() |
| kid_id | uuid | NOT NULL, FK → kids(id) ON DELETE CASCADE |
| date | date | NOT NULL |
| is_rest_day | boolean | NOT NULL DEFAULT false |
| effort_level_id | uuid | NULL, FK → effort_levels(id) |
| ended_at | timestamptz | NULL (null = not ended; non-null = read-only) |
| created_at | timestamptz | NOT NULL, DEFAULT now() |

**Unique constraint**: `UNIQUE(kid_id, date)`.

**State transitions**:
- Created automatically on first chore interaction for a date
- `ended_at` set when "End Day" is triggered — record becomes read-only after this

**RLS**: Parent can SELECT all kids in own family. Kid can SELECT/UPDATE own records where ended_at IS NULL.

---

### `chore_completions`

| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK, DEFAULT gen_random_uuid() |
| day_record_id | uuid | NOT NULL, FK → day_records(id) ON DELETE CASCADE |
| chore_assignment_id | uuid | NOT NULL, FK → chore_assignments(id) |
| chore_name_snapshot | text | NOT NULL |
| penalty_snapshot | integer | NOT NULL |
| is_important_snapshot | boolean | NOT NULL |
| completed_at | timestamptz | NULL (null = incomplete) |

**Unique constraint**: `UNIQUE(day_record_id, chore_assignment_id)`.

**Notes**:
- All assignments are seeded as rows when the day_record is first created
- `completed_at` toggled on check/uncheck
- Snapshot columns preserve chore data at time of creation, ensuring historical accuracy after soft-delete

**RLS**: Parent can SELECT all in own family. Kid can SELECT/UPDATE own day's completions where day_record.ended_at IS NULL.

---

### `reward_redemptions`

| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK, DEFAULT gen_random_uuid() |
| kid_id | uuid | NOT NULL, FK → kids(id) |
| reward_id | uuid | NOT NULL, FK → rewards(id) |
| reward_name_snapshot | text | NOT NULL |
| points_cost_snapshot | integer | NOT NULL |
| redeemed_at | timestamptz | NOT NULL, DEFAULT now() |

**RLS**: Parent can SELECT all in own family. Kid can INSERT/SELECT own redemptions.

---

### `activity_log`

| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK, DEFAULT gen_random_uuid() |
| family_id | uuid | NOT NULL, FK → families(id) |
| kid_id | uuid | NULL, FK → kids(id) |
| actor_type | text | NOT NULL, CHECK IN ('parent', 'kid') |
| action_type | text | NOT NULL, CHECK IN ('chore_completed', 'chore_unchecked', 'rest_day_purchased', 'reward_redeemed', 'day_ended', 'penalty_applied', 'effort_awarded', 'chore_assigned', 'chore_unassigned') |
| metadata | jsonb | NOT NULL DEFAULT '{}' |
| points_delta | integer | NULL |
| created_at | timestamptz | NOT NULL, DEFAULT now() |

**RLS**: Parent and kids can SELECT all entries for their own family.

---

## Points Balance Integrity

Points are updated atomically via a PostgreSQL function to prevent race conditions:

```sql
-- Called by server actions for all point-changing events
CREATE OR REPLACE FUNCTION apply_points_delta(p_kid_id uuid, p_delta integer)
RETURNS integer AS $$
DECLARE
  new_balance integer;
BEGIN
  UPDATE kids
  SET points = GREATEST(0, points + p_delta)
  WHERE id = p_kid_id
  RETURNING points INTO new_balance;
  RETURN new_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

The `GREATEST(0, ...)` enforces the floor of zero, satisfying the spec assumption that points cannot go below zero.

---

## Indexes

```sql
CREATE INDEX ON chore_assignments(kid_id);
CREATE INDEX ON day_records(kid_id, date);
CREATE INDEX ON chore_completions(day_record_id);
CREATE INDEX ON activity_log(family_id, created_at DESC);
CREATE INDEX ON reward_redemptions(kid_id);
```
