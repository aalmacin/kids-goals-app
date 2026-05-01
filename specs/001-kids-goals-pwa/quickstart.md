# Quickstart: Kids Goals PWA

**Branch**: `001-kids-goals-pwa` | **Date**: 2026-04-25

## Prerequisites

- Node.js 20+
- npm / pnpm
- Supabase CLI (`brew install supabase/tap/supabase`)
- Docker (for local Supabase)

## 1. Install Dependencies

```bash
npm install

# Core additions needed (not yet in package.json)
npm install @supabase/supabase-js @supabase/ssr
npm install @tanstack/react-query @tanstack/store @tanstack/react-table
npm install serwist @serwist/next
npm install lucide-react class-variance-authority clsx tailwind-merge

# shadcn/ui setup (run once, then add components as needed)
npx shadcn@latest init

# Dev dependencies
npm install -D vitest @vitejs/plugin-react playwright @playwright/test
npm install -D supabase
```

## 2. Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<from supabase start output>
SUPABASE_SERVICE_ROLE_KEY=<from supabase start output>
```

## 3. Local Supabase

```bash
# Start local Supabase (Docker required)
npx supabase start

# Apply migrations (once migrations are written)
npx supabase db push

# Seed with test data
npx supabase db seed
```

Supabase Studio available at `http://127.0.0.1:54323`.

## 4. Development Server

```bash
npm run dev
```

App at `http://localhost:3000`.

For HTTPS (required for PWA service worker testing):

```bash
npx next dev --experimental-https
```

## 5. Running Tests

```bash
# Unit tests
npx vitest run

# Integration tests (requires local Supabase running)
npx vitest run --reporter=verbose tests/integration

# E2E tests (starts app + seeds Supabase, then runs Playwright)
npx playwright test
```

## 6. Project Key Files

| File | Purpose |
|------|---------|
| `proxy.ts` | CSP nonce generation (Next.js 16, replaces middleware.ts) |
| `app/manifest.ts` | PWA web app manifest |
| `public/sw.js` | Serwist service worker |
| `lib/supabase/server.ts` | Supabase client for Server Components and Server Actions |
| `lib/supabase/client.ts` | Supabase browser client (for Realtime subscriptions) |
| `lib/points.ts` | Pure business logic: penalty calc, effort rewards |
| `lib/actions/` | All Server Actions |

## 7. Adding shadcn Components

```bash
# Examples of components needed for this project
npx shadcn@latest add button card dialog dropdown-menu
npx shadcn@latest add calendar badge input label
npx shadcn@latest add navigation-menu sheet toast
```

## 8. Supabase Type Generation

After schema changes, regenerate types:

```bash
npx supabase gen types typescript --local > lib/database.types.ts
```

Import as `import type { Database } from '@/lib/database.types'` and use with the typed Supabase client.
