-- Initial schema for Kids Goals PWA

-- families
CREATE TABLE families (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  parent_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- kids
CREATE TABLE kids (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  supabase_user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  birthday date NOT NULL,
  points integer NOT NULL DEFAULT 0 CHECK (points >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (family_id, name)
);

-- chores (family-level library)
CREATE TABLE chores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  name text NOT NULL,
  penalty integer NOT NULL DEFAULT 0 CHECK (penalty >= 0),
  is_important boolean NOT NULL DEFAULT false,
  icon text NOT NULL,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- chore_assignments (per-kid copies of library chores)
CREATE TABLE chore_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chore_id uuid NOT NULL REFERENCES chores(id) ON DELETE CASCADE,
  kid_id uuid NOT NULL REFERENCES kids(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (chore_id, kid_id)
);

-- effort_levels
CREATE TABLE effort_levels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  name text NOT NULL,
  points integer NOT NULL DEFAULT 0 CHECK (points >= 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- rewards
CREATE TABLE rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  name text NOT NULL,
  points_cost integer NOT NULL CHECK (points_cost > 0),
  icon text NOT NULL,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- day_records (per-kid per-date state)
CREATE TABLE day_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kid_id uuid NOT NULL REFERENCES kids(id) ON DELETE CASCADE,
  date date NOT NULL,
  is_rest_day boolean NOT NULL DEFAULT false,
  effort_level_id uuid REFERENCES effort_levels(id),
  ended_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (kid_id, date)
);

-- chore_completions (per-day per-assignment completion state)
CREATE TABLE chore_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  day_record_id uuid NOT NULL REFERENCES day_records(id) ON DELETE CASCADE,
  chore_assignment_id uuid NOT NULL REFERENCES chore_assignments(id) ON DELETE CASCADE,
  chore_name_snapshot text NOT NULL,
  penalty_snapshot integer NOT NULL,
  is_important_snapshot boolean NOT NULL,
  completed_at timestamptz,
  UNIQUE (day_record_id, chore_assignment_id)
);

-- reward_redemptions
CREATE TABLE reward_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kid_id uuid NOT NULL REFERENCES kids(id) ON DELETE CASCADE,
  reward_id uuid NOT NULL REFERENCES rewards(id),
  reward_name_snapshot text NOT NULL,
  points_cost_snapshot integer NOT NULL,
  redeemed_at timestamptz NOT NULL DEFAULT now()
);

-- activity_log
CREATE TABLE activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  kid_id uuid REFERENCES kids(id) ON DELETE SET NULL,
  actor_type text NOT NULL CHECK (actor_type IN ('parent', 'kid')),
  action_type text NOT NULL CHECK (action_type IN (
    'chore_completed', 'chore_unchecked', 'rest_day_purchased',
    'reward_redeemed', 'day_ended', 'penalty_applied', 'effort_awarded',
    'chore_assigned', 'chore_unassigned'
  )),
  metadata jsonb NOT NULL DEFAULT '{}',
  points_delta integer,
  created_at timestamptz NOT NULL DEFAULT now()
);
