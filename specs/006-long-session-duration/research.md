# Research: Long PWA Session Duration

## Session Lifecycle in Supabase + @supabase/ssr

### Decision: Extend Supabase Refresh Token Expiry to 365 Days

**Rationale**: Supabase Auth uses two tokens — a short-lived JWT access token (default 1 hour) and a longer-lived refresh token. The `@supabase/ssr` library automatically refreshes the access token using the refresh token on each server request. The session lifespan is therefore controlled by the refresh token expiry. Setting this to 31,536,000 seconds (365 days) in the Supabase dashboard is the primary lever for 1-year sessions.

**Alternatives considered**:
- Custom token refreshing: Unnecessary complexity — `@supabase/ssr` already handles this.
- Storing session in database: Overkill; cookie-based approach is correct for auth state.

---

### Decision: Keep JWT (Access Token) Expiry at 3600s (1 Hour)

**Rationale**: The access token is short-lived by design to limit exposure if intercepted. It is refreshed automatically on every server request via `supabase.auth.getUser()`, which is already called in both `(dashboard)/layout.tsx` and `(admin)/admin/layout.tsx`. No change needed here.

**Alternatives considered**:
- 1-year access token: Unacceptable security risk — a leaked access token would be valid for 1 year.

---

### Decision: Track Session Creation Time in a Separate Cookie (`kg_session_started`)

**Rationale**: Supabase's session object does not expose the refresh token creation timestamp directly to the client. To calculate "how old is this session" (needed for the 30-day pre-expiry warning), we store a `kg_session_started` cookie containing a Unix timestamp, set at login and cleared at logout. This avoids any database table changes.

**Alternatives considered**:
- Using `session.expires_at`: This reflects the access token expiry (1 hour), not the overall session lifespan. Unusable for tracking 1-year expiry.
- Database `user_sessions` table: Unnecessary complexity for what a cookie can handle. No RLS rules needed, no real-time subscriptions, no joins.

---

### Decision: No Middleware Required for Session Refresh

**Rationale**: The project has no `middleware.ts`. Both `(dashboard)/layout.tsx` and `(admin)/admin/layout.tsx` already call `supabase.auth.getUser()` on every request, which triggers the `setAll` cookie callback in `createSupabaseServerClient()` to persist the refreshed token. Session refresh is therefore handled correctly at the layout level without a middleware.

**Note**: If the app gains public routes that bypass these layouts in the future, a middleware will be needed. This is a deferred consideration.

---

### Decision: Pre-Expiry Warning at 30-Day Threshold

**Rationale**: 30 days provides enough advance notice for infrequent users (who may only open the app a few times a month) while not being so early that it creates alarm. This matches the assumption documented in the spec.

**Implementation**: Compare `Date.now()` against `kg_session_started + 335 days`. If within the warning window, render a `SessionExpiryWarning` banner in both dashboard and admin layouts. Clicking "Stay logged in" calls a `refreshSession` server action that signs in using the existing session (re-authenticating to reset the session start cookie).

---

### Decision: App Updates Do Not Reset Sessions

**Rationale**: Cookies survive PWA updates (new version deployments). The `kg_session_started` cookie and the Supabase auth cookies all persist across app updates because they are stored in the browser's cookie store, not in the PWA's service worker cache. No code change is needed — this behavior is inherent to how browsers handle cookies.

---

### Decision: Uninstall Clears Session (No Action Required)

**Rationale**: When a PWA is uninstalled, the browser clears all associated storage including cookies. This means the `kg_session_started` cookie and Supabase auth cookies are destroyed. On reinstall, the user starts fresh and must log in again. This is the correct behavior per the spec and requires no implementation.

---

## Supabase Dashboard Configuration Required

The following settings must be configured in the Supabase project dashboard (Auth → Configuration):

| Setting | Value | Notes |
|---------|-------|-------|
| JWT Expiry | 3600 (1 hour) | No change — keep default |
| Refresh Token Expiry | 31536000 (365 days) | **Change required** — default is much shorter |
| Refresh Token Reuse Interval | 10 (seconds) | No change — keep default |

These settings must also be applied to the local Supabase development instance via `supabase/config.toml`:

```toml
[auth]
jwt_expiry = 3600

[auth.sessions]
timebox = 31536000
inactivity_timeout = 0
```

The `inactivity_timeout = 0` disables inactivity-based expiry so only the absolute session lifetime (`timebox`) applies.
