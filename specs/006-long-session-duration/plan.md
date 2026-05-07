# Implementation Plan: Long PWA Session Duration

**Branch**: `006-long-session-duration` | **Date**: 2026-05-07 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/006-long-session-duration/spec.md`

## Summary

Extend the PWA session lifetime to 1 year by configuring Supabase Auth refresh token expiry to 365 days. Track session creation time in a `kg_session_started` cookie to power a pre-expiry warning banner shown 30 days before the session expires. Sessions survive app updates but are reset on PWA uninstall/reinstall.

## Technical Context

**Language/Version**: TypeScript (strict mode)
**Primary Dependencies**: Next.js (App Router, Server Actions), Supabase Auth via `@supabase/ssr`, shadcn/ui (Alert component)
**Storage**: Browser cookies only — no new database tables
**Testing**: Vitest (unit + integration), Playwright (E2E)
**Target Platform**: PWA (browser-based, all major mobile/desktop browsers)
**Project Type**: Web application (Next.js full-stack)
**Performance Goals**: Cookie read/parse on every request — negligible overhead (<1ms)
**Constraints**: No new `/api` routes; session logic via Server Actions only
**Scale/Scope**: Per-device sessions; no cross-device synchronisation

## Constitution Check

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Next.js Patterns | ✅ Pass | Session refresh via Server Action. Nonce handling unchanged. No new `/api` routes. |
| II. Supabase Patterns | ✅ Pass | Supabase Auth used exclusively. No new tables. RLS unaffected. |
| III. TanStack First | ✅ N/A | No new client-side state management required. |
| IV. shadcn Components First | ✅ Pass | Warning banner uses shadcn `Alert` component. |
| V. Test Coverage | ✅ Pass | E2E tests required and planned for all user-facing flows. |

## Project Structure

### Documentation (this feature)

```text
specs/006-long-session-duration/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit-tasks command)
```

### Source Code Changes

```text
supabase/
└── config.toml          # auth.sessions.timebox = 31536000

lib/
├── session.ts           # NEW: session age helpers (calculateDaysRemaining, isSessionExpiring)
├── actions/
│   └── auth.ts          # MODIFY: set kg_session_started on login; clear on logout; add refreshSession action
└── supabase/
    └── server.ts        # No change needed

components/
└── session/
    └── SessionExpiryWarning.tsx  # NEW: shadcn Alert banner with "Stay logged in" button

app/
├── (dashboard)/
│   └── layout.tsx       # MODIFY: read session age, render SessionExpiryWarning if expiring
└── (admin)/
    └── admin/
        └── layout.tsx   # MODIFY: read session age, render SessionExpiryWarning if expiring

__tests__/
├── unit/
│   └── session.test.ts  # NEW: session age calculation edge cases
├── integration/
│   └── session.test.ts  # NEW: kg_session_started cookie set/clear behaviour
└── e2e/
    └── session-expiry.spec.ts  # NEW: warning banner display and stay-logged-in flow
```

## Complexity Tracking

No constitution violations. No complexity justification required.

## Implementation Notes

### Supabase Configuration

The Supabase project must have its refresh token expiry set to 365 days. This must be applied in two places:

1. **Supabase Dashboard** (production): Auth → Configuration → Refresh Token Expiry = 31536000
2. **`supabase/config.toml`** (local dev): `[auth.sessions] timebox = 31536000, inactivity_timeout = 0`

### Cookie: `kg_session_started`

Set in `loginParent` and `loginKid` server actions using `cookies().set()` from `next/headers`:

```
name: 'kg_session_started'
value: Date.now().toString()
maxAge: 31536000
httpOnly: true
sameSite: 'lax'
secure: true (production), false (dev)
```

Cleared in `logout` via `cookies().delete('kg_session_started')`.

### Session Age Helper (`lib/session.ts`)

```
EXPIRY_DAYS = 365
WARNING_DAYS = 30

calculateDaysRemaining(sessionStartedAt: number): number
  → returns days until session expires (can be negative if past expiry)

isSessionExpiring(sessionStartedAt: number): boolean
  → returns true if daysRemaining <= WARNING_DAYS
```

### Pre-Expiry Warning Banner

`components/session/SessionExpiryWarning.tsx` — Client Component:
- Renders a shadcn `Alert` (variant: warning/destructive) at the top of the page
- Shows days remaining
- "Stay logged in" button calls `refreshSession` server action
- Dismissable for the current page session (local state only — reappears on next navigation)

`refreshSession` server action:
- Calls `supabase.auth.refreshSession()` to force a token refresh
- Deletes and resets `kg_session_started` to `Date.now()`
- No redirect needed — the banner disappears on next render

### Layout Integration

Both `(dashboard)/layout.tsx` and `(admin)/admin/layout.tsx`:
1. Read `cookies().get('kg_session_started')`
2. If present and `isSessionExpiring(parseInt(value))`, pass `daysRemaining` as prop to `SessionExpiryWarning`
3. Render `<SessionExpiryWarning daysRemaining={n} />` above the main content

### Multiple Concurrent Sessions

Each device maintains its own `kg_session_started` cookie independently. Manual logout clears only that device's cookies (browser-local behaviour). No server-side session registry needed.

### Security Event Handling

Password change and account deactivation: Supabase automatically invalidates all refresh tokens for the user when these events occur. The user will be signed out on their next request when `supabase.auth.getUser()` fails to validate. This is existing Supabase behaviour — no additional code needed.

### App Updates vs Reinstall

- **App update**: Cookies persist. User stays logged in. ✅ Inherent browser behaviour.
- **Uninstall + reinstall**: Browser clears cookies. User must log in again. ✅ Inherent browser behaviour.

No code required for either case.
