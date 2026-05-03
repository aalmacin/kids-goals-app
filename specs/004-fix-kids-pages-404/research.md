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

### Bug 2: Chores Always Show "No chores assigned!"

**Decision**: Two causes — partially a consequence of Bug 1 (kids can't reach `/`), and a separate seeding bug in `getOrCreateDayRecord`.

**Rationale**:
- When a day record already exists (kid visited before chores were assigned), the seeding logic is skipped entirely
- New assignments added after the day record was created never get backfilled as completions
- Fix: when loading an existing day record, check for assignments that don't have corresponding completions and backfill them

**Affected file**: `lib/db/day-records.ts`

### Bug 3: Activity Log Shows Other Kids' Data

**Decision**: The activity page queries by `familyId` without filtering by `kidId` for kid users.

**Rationale**:
- `getActivityLog` accepts an optional `kidId` parameter but the activity page never passes it for kid users
- The RLS policy `kid_select_activity_log` allows kids to see all family activity (by design for RLS), but the application should scope it to the logged-in kid
- Fix: pass `kidId` to `getActivityLog` when the user is a kid

**Affected file**: `app/(dashboard)/activity/page.tsx`

### Bug 4: Calendar Date Navigation Fails

**Decision**: The `CalendarView` component uses `/dashboard?date=...` for navigation — same `/dashboard` prefix bug as Bug 1.

**Rationale**:
- `router.push('/dashboard?date=${iso}')` navigates to a non-existent `/dashboard` route
- The correct URL is `/?date=${iso}` since the dashboard page is at `/`

**Affected file**: `components/calendar/CalendarView.tsx`

### Bug 5: Duplicate Checkbox on Chore Items

**Decision**: The base-ui Checkbox component renders both a styled `<span>` and a hidden native `<input>`. The input is hidden via inline `style` attributes, but the CSP policy uses a nonce for `style-src`, causing browsers to ignore `'unsafe-inline'` and block the inline styles. The native input becomes visible alongside the styled checkbox.

**Rationale**:
- `@base-ui/react/checkbox` renders a hidden `<input type="checkbox">` with `style: { position: 'absolute', clipPath: 'inset(50%)', ... }` for form compatibility
- The CSP `style-src 'self' 'nonce-${nonce}'` causes `'unsafe-inline'` to be ignored even in dev mode (per CSP Level 2+ spec)
- Without `'unsafe-inline'` being effective, the inline `style` on the input is blocked, making it visible
- Fix: add `[&_input]:sr-only` Tailwind class to the Checkbox component, hiding the input via stylesheet rules instead of inline styles

**Affected file**: `components/ui/checkbox.tsx`

## Fix Summary

| Issue | Fix | File |
|-------|-----|------|
| NavBar links use `/dashboard/*` | Remove `/dashboard` prefix from all links | `components/navbar/NavBar.tsx` |
| Logo link uses `/dashboard` | Change to `/` | `components/navbar/NavBar.tsx` |
| Chores not backfilled for existing day records | Backfill completions for new assignments | `lib/db/day-records.ts` |
| Activity log shows all kids' data | Filter by `kidId` for kid users | `app/(dashboard)/activity/page.tsx` |
| Calendar navigates to `/dashboard?date=` | Change to `/?date=` | `components/calendar/CalendarView.tsx` |
| Duplicate checkbox on chore items | Add `[&_input]:sr-only` to hide native input via CSS | `components/ui/checkbox.tsx` |
