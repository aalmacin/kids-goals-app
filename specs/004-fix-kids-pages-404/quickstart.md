# Quickstart: Fix Kids Pages 404

## Problem

NavBar links use `/dashboard/*` paths but routes are at `/*` (route group `(dashboard)` doesn't create URL segments).

## Fix

In `components/navbar/NavBar.tsx`, update all links:

| Current | Correct |
|---------|---------|
| `/dashboard` | `/` |
| `/dashboard/rewards` | `/rewards` |
| `/dashboard/activity` | `/activity` |
| `/dashboard/calendar` | `/calendar` |

## Verification

1. `npm run build` — should succeed (already does)
2. Log in as a kid and verify all nav links work
3. Verify chores appear on the dashboard
