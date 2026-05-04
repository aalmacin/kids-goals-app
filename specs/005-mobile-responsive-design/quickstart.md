# Quickstart: Mobile-Friendly Responsive Design

## Prerequisites

- Node.js 20+
- Supabase local instance running (for full auth flows)

## Development

```bash
npm run dev
```

App runs at `http://localhost:3000`.

## Testing Responsive Layouts

Use browser DevTools to test at target viewports:

| Label   | Width  |
|---------|--------|
| Small   | 320px  |
| Mobile  | 375px  |
| Tablet  | 768px  |
| Desktop | 1280px |

In Chrome: Open DevTools → Toggle device toolbar (Ctrl+Shift+M) → Enter custom width.

## Running Tests

```bash
# Unit tests
npm run test

# E2E tests (requires local Supabase + seeded data)
npm run test:e2e
```

## Key Files Changed by This Feature

| File | Change |
|------|--------|
| `components/navbar/NavBar.tsx` | Add mobile hamburger + Sheet drawer |
| `components/navbar/MobileMenu.tsx` | New client component for mobile nav |
| `app/(admin)/admin/layout.tsx` | Add mobile nav drawer, responsive padding |
| `components/admin/AdminMobileMenu.tsx` | New client component for admin mobile nav |
| `app/(dashboard)/layout.tsx` | Responsive padding |
| `app/(admin)/admin/kids/page.tsx` | Stack kid card actions on mobile |
| `tests/e2e/mobile-responsive.spec.ts` | Playwright tests at mobile viewport |
