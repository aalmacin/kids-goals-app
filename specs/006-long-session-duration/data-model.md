# Data Model: Long PWA Session Duration

## No New Database Tables

This feature requires no new database tables. Session state is managed entirely through browser cookies and Supabase Auth configuration.

## Cookie: `kg_session_started`

Tracks the Unix timestamp (milliseconds) of when the user originally authenticated. Used to calculate session age for pre-expiry warning logic.

| Attribute | Value |
|-----------|-------|
| Name | `kg_session_started` |
| Type | String (Unix timestamp in ms, e.g., `"1714999200000"`) |
| Max-Age | 31,536,000 seconds (365 days) |
| HttpOnly | `true` |
| SameSite | `Lax` |
| Secure | `true` in production |
| Set on | Successful `loginParent` or `loginKid` |
| Cleared on | `logout` or successful `refreshSession` (then immediately re-set) |

## Session Lifecycle State Machine

```
[Unauthenticated]
      │
      │  loginParent / loginKid
      │  → Supabase auth cookies set (by @supabase/ssr)
      │  → kg_session_started = Date.now()
      ▼
[Authenticated — Active]
      │
      │  Every request: access token auto-refreshed if expired
      │  kg_session_started remains unchanged
      │
      │  After 335 days:
      ├──────────────────────────────────────────────────────┐
      │                                                      ▼
      │                                         [Authenticated — Expiry Warning]
      │                                                      │
      │                                          User clicks "Stay logged in"
      │                                          → refreshSession action
      │                                          → kg_session_started reset
      │                                                      │
      │◄─────────────────────────────────────────────────────┘
      │
      │  After 365 days (refresh token expires):
      ├──────────────────────────────────────────────────────┐
      │                                                      ▼
      │                                         [Unauthenticated — Expired]
      │                                          Supabase auth cookies cleared
      │                                          kg_session_started cleared
      │                                          User redirected to /login
      │
      │  Manual logout:
      ├──────────────────────────────────────────────────────┐
                                                             ▼
                                              [Unauthenticated]
                                               Supabase auth cookies cleared
                                               kg_session_started cleared
```

## Existing Supabase Auth Cookies (managed by @supabase/ssr)

These cookies already exist and will be extended by the Supabase configuration change:

| Cookie | Purpose | Controlled By |
|--------|---------|---------------|
| `sb-<project>-auth-token` | Access + refresh token pair | Supabase / @supabase/ssr |

The refresh token expiry (configured in Supabase dashboard to 365 days) determines the true session lifetime.

## Session Age Calculation

```
sessionAgeMs  = Date.now() - parseInt(kg_session_started)
daysOld       = sessionAgeMs / (1000 * 60 * 60 * 24)
daysRemaining = 365 - daysOld
isExpiring    = daysRemaining <= 30
```

This logic lives in `lib/session.ts` and is called from server components (layouts).
