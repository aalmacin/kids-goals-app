# Quickstart: Kid Comparison

## Manual Integration Test

### Setup (in Supabase local or staging)

1. Create a family with 2–3 kids (use admin panel or seed script)
2. Assign different chores to each kid
3. Log in as Kid A and complete some chores; end the day with an effort level
4. Log in as Kid B and complete fewer chores
5. Log in as Kid C (optional) with no chores started

### Test Scenarios

#### US1 — Leaderboard

1. Log in as Kid A
2. Navigate to `/compare`
3. **Expect**: All kids listed, ranked highest points first
4. **Expect**: Kid A's row is visually highlighted
5. **Expect**: Points totals match the points shown in the navbar badge

#### US1 — Single-child family

1. Create a family with exactly one kid
2. Log in as that kid
3. Navigate to `/compare`
4. **Expect**: "No siblings to compare with yet" message displayed

#### US2 — Daily progress

1. After completing chores as Kid A (step 3 in Setup)
2. Navigate to `/compare`
3. **Expect**: Kid A shows X/X chores with a full progress bar or completion indicator
4. **Expect**: Kid B shows fewer completed chores
5. **Expect**: Kid C shows 0/N (not started) or "No chores" if unassigned

#### US2 — Rest day

1. Log in as Kid B and mark the day as a rest day
2. Navigate to `/compare` as Kid A
3. **Expect**: Kid B's daily progress entry shows a "Rest Day" indicator

#### US3 — Weekly summary

1. Ensure Kids have activity over the past 7 days (effort awards, chore completion events)
2. Navigate to `/compare`
3. **Expect**: Each kid shows their points earned this week
4. **Expect**: The kid with most weekly points appears at the top of the weekly section

### Redirect Checks

- Parent logs in → redirected to `/admin`, no access to `/compare`
- Unauthenticated user → redirected to `/login`
