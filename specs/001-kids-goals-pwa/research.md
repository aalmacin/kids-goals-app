# Research: Kids Goals PWA

**Branch**: `001-kids-goals-pwa` | **Date**: 2026-04-25

## 1. Kid Authentication Without Email

**Decision**: Kids get Supabase Auth accounts using a synthetic email pattern and their passcode as the password. The kid login UI (family + name + passcode) resolves to the synthetic credentials via a server action that looks up the kid record, then calls `supabase.auth.signInWithPassword`.

**Pattern**:
```
synthetic_email = "kid-{kid_id}@{family_slug}.internal"
password        = passcode (hashed by Supabase Auth bcrypt)
```

The server action:
1. Queries `kids` table for `WHERE family_id = ? AND name = ?` (enforced unique by DB constraint)
2. Retrieves `supabase_user_id` and constructs the synthetic email
3. Calls `supabase.auth.signInWithPassword({ email, password: passcode })`
4. Returns the session

**Rationale**: Keeps all identity in Supabase Auth (RLS policies can reference `auth.uid()`), avoids a parallel session system, and supports the constitution's "Auth MUST use Supabase Auth" requirement.

**Alternatives considered**:
- Custom kid session stored in a separate table with a signed JWT — rejected because it bypasses Supabase Auth and creates a parallel auth system incompatible with RLS.
- Supabase anonymous auth — rejected because anonymous sessions cannot be reliably associated with a specific kid identity across devices.

---

## 2. Next.js 16: `proxy.ts` Replaces `middleware.ts`

**Decision**: Use `proxy.ts` at project root. The exported function is named `proxy` (not `middleware`). `middleware.ts` is deprecated in Next.js 16.

**Pattern** (from official docs):
```ts
// proxy.ts
export function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64')
  const isDev = process.env.NODE_ENV === 'development'
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ''};
    style-src 'self' 'nonce-${nonce}';
    img-src 'self' blob: data:;
    font-src 'self'; object-src 'none';
    base-uri 'self'; form-action 'self';
    frame-ancestors 'none'; upgrade-insecure-requests;
  `.replace(/\s{2,}/g, ' ').trim()

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-nonce', nonce)
  requestHeaders.set('Content-Security-Policy', cspHeader)

  const response = NextResponse.next({ request: { headers: requestHeaders } })
  response.headers.set('Content-Security-Policy', cspHeader)
  return response
}
```

Nonce is read in Server Components via `(await headers()).get('x-nonce')`. Nonce-based CSP forces dynamic rendering on all pages.

**Rationale**: Nonce-based CSP is required by Constitution Principle I. `proxy.ts` is the correct Next.js 16 file name.

**Alternatives considered**:
- SRI (hash-based CSP, experimental) — allows static generation but is marked experimental; rejected in favor of the stable nonce approach mandated by the constitution.

---

## 3. Offline Read Support via Serwist

**Decision**: Use [Serwist](https://github.com/serwist/serwist) for service worker generation and offline caching. Serwist is the officially recommended library in Next.js 16 docs for PWA offline support.

**Setup**:
- Install `@serwist/next` and `serwist`
- Configure `next.config.ts` with the Serwist webpack plugin
- Create `app/sw.ts` as the service worker entry point with a precache manifest and runtime caching strategies

**Caching strategy**:
- App shell (layout, static assets): `CacheFirst` (precached at install)
- API/Server Action responses: Not cached (mutations must be online)
- Read-heavy pages (today's chores, calendar): `StaleWhileRevalidate` with network fallback

**Rationale**: Kids primarily need to read their chores in the morning. Offline read access (SC-007) is achievable via service worker caching without full offline write support.

**Alternatives considered**:
- Manual service worker — rejected due to complexity and maintenance burden.
- No offline support — rejected; SC-007 explicitly requires offline read access.

---

## 4. TanStack Query + Server Actions

**Decision**: Use TanStack Query's `queryFn` to call typed Server Actions. Realtime invalidates queries when upstream data changes.

**Pattern**:
```ts
// Client component
const { data: chores } = useQuery({
  queryKey: ['chores', kidId, date],
  queryFn: () => getChoresForDay(kidId, date), // Server Action
})

const mutation = useMutation({
  mutationFn: checkChore,  // Server Action
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ['chores'] }),
})
```

**Realtime invalidation**:
```ts
supabase.channel('day_records')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'day_records' }, () => {
    queryClient.invalidateQueries({ queryKey: ['chores'] })
    queryClient.invalidateQueries({ queryKey: ['points'] })
  })
  .subscribe()
```

**Rationale**: TanStack Query is mandated by Constitution Principle III. Server Actions as `queryFn`/`mutationFn` is the standard pattern for Next.js App Router + TanStack Query.

---

## 5. Points Calculation Logic

**Decision**: Points are stored as a running balance on the `kids` table. All mutations apply a delta atomically via a PostgreSQL function to prevent race conditions.

**Point-changing events**:
| Event | Delta |
|-------|-------|
| Rest day purchased | -100 |
| End Day — penalty per incomplete chore | -(penalty_snapshot) |
| End Day — effort level reward | +(effort_level.points) |
| Reward redeemed | -(reward.points_cost) |

**Constraints**:
- Points cannot go below 0; server action enforces: `new_balance = max(0, current_balance + delta)`
- All balance changes are recorded in `activity_log` with `points_delta`

**Rationale**: Atomic PostgreSQL updates prevent double-spend. Snapshot columns (`penalty_snapshot`, `reward_name_snapshot`, etc.) preserve historical accuracy when chores/rewards are soft-deleted.

---

## 6. Supabase RLS Strategy Summary

| Table | Parent (own family) | Kid (own records) | Public |
|-------|--------------------|--------------------|--------|
| families | SELECT, UPDATE | SELECT (own) | — |
| kids | ALL | SELECT (own) | — |
| chores | ALL | SELECT (not deleted) | — |
| chore_assignments | ALL | SELECT (own) | — |
| day_records | SELECT ALL kids | SELECT/UPDATE (own) | — |
| chore_completions | SELECT ALL kids | SELECT/UPDATE (own) | — |
| effort_levels | ALL | SELECT | — |
| rewards | ALL | SELECT (not deleted) | — |
| reward_redemptions | SELECT ALL kids | INSERT/SELECT (own) | — |
| activity_log | SELECT (own family) | SELECT (own family) | — |

RLS policies use `auth.uid()` matched against `kids.supabase_user_id` (for kids) or `families.parent_id` (for parents).
