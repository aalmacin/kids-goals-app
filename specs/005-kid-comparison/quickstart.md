# Quickstart: Family Page

## Prerequisites

1. Ensure local Supabase is running: `bunx supabase start`
2. Apply all migrations: `bunx supabase migration up`
3. Seed test data: at least one family with 2–3 kids

## Manual Integration Test

### Setup

1. Create a family with 2–3 kids via the admin panel
2. Assign different chores to each kid
3. Log in as Kid A; complete some chores
4. Log in as Kid B; complete fewer chores
5. (Optional) Log in as Kid C; complete none

### Test Scenarios

#### Family page loads for a multi-kid family

1. Log in as Kid A
2. Navigate to `/family`
3. **Expect**: All kids listed, ranked highest points first
4. **Expect**: Kid A's row is visually highlighted with "You" badge
5. **Expect**: Points totals match the navbar badge

#### Single-child family

1. Create a family with exactly one kid
2. Log in as that kid
3. Navigate to `/family`
4. **Expect**: Page renders showing only that kid's card (no error message)

#### `/compare` redirects to `/family`

1. Navigate to `/compare`
2. **Expect**: Browser redirects to `/family` automatically

#### Daily progress

1. After completing chores as Kid A
2. Navigate to `/family` as Kid B
3. **Expect**: Each kid shows chore progress fraction with progress bar
4. **Expect**: Kid with all chores done shows green "Done ✓" badge
5. **Expect**: Rest day kid shows "Rest Day" badge

#### Weekly summary

1. Ensure kids have activity log entries over the past 7 days
2. Navigate to `/family`
3. **Expect**: Weekly points section shows each kid's 7-day total
4. **Expect**: Kid with most weekly points appears first

#### Real-time update

1. Log in as Kid A in one browser tab; open `/family`
2. Log in as Kid B in another tab; complete a chore
3. **Expect**: Kid A's view updates without page refresh

#### Auth redirects

- Parent logs in → stays at `/admin`, no access to `/family`
- Unauthenticated user → redirected to `/login`

## Running Tests

```bash
# Unit/integration
bun run test

# E2E (requires local Supabase running)
bunx playwright test --grep "family"
```
