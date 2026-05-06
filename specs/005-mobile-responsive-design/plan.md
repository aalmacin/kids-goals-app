# Implementation Plan: Mobile-Friendly Responsive Design

**Branch**: `005-mobile-responsive-design` | **Date**: 2026-05-03 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/005-mobile-responsive-design/spec.md`

## Summary

Make the Kids Goals app fully responsive across mobile (320px+), tablet (768px+), and desktop (1024px+) viewports. The primary changes are: adding a hamburger + shadcn Sheet drawer to the dashboard NavBar and admin navigation, stacking the admin kids page card actions vertically on mobile, and tightening padding on the main containers. No new packages or data changes are required — shadcn `Sheet` is already installed.

## Technical Context

**Language/Version**: TypeScript 5 / Next.js App Router (latest)
**Primary Dependencies**: shadcn/ui (Sheet, Button), Tailwind CSS, lucide-react (Menu icon), TanStack Table
**Storage**: N/A — no schema changes
**Testing**: Playwright (E2E), Vitest (unit — no new unit tests needed for pure layout changes)
**Target Platform**: Web — mobile browsers (iOS Safari, Android Chrome), desktop browsers
**Project Type**: Web application (Next.js)
**Performance Goals**: Standard — no regression on existing page load times
**Constraints**: No new npm packages; all changes via Tailwind responsive prefixes or existing shadcn components
**Scale/Scope**: ~5 components / 2 layout files modified, 2 new client components, 1 new test file

## Constitution Check

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Next.js Patterns | ✅ Pass | No new API routes. Server component RSC boundary preserved by extracting client toggle into `MobileMenu` / `AdminMobileMenu` child components. |
| II. Supabase Patterns | ✅ Pass | No DB, auth, or realtime changes. |
| III. TanStack First | ✅ Pass | No new state management. Mobile toggle uses `useState` in client components — local UI state, not server state. |
| IV. shadcn Components First | ✅ Pass | `Sheet` (already installed) used for mobile nav drawer. `Menu` icon from lucide-react (already a transitive dep of shadcn). |
| V. Test Coverage | ✅ Pass | Playwright E2E tests cover happy path for login and dashboard at 375px viewport. |

## Project Structure

### Documentation (this feature)

```text
specs/005-mobile-responsive-design/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output (no new entities)
├── quickstart.md        # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit-tasks)
```

### Source Code

```text
components/
├── navbar/
│   ├── NavBar.tsx              # Modified — add MobileMenu, hide desktop links on mobile
│   └── MobileMenu.tsx          # New — client component for hamburger + Sheet drawer
├── admin/
│   └── AdminMobileMenu.tsx     # New — client component for admin hamburger + Sheet drawer

app/
├── (dashboard)/
│   └── layout.tsx              # Modified — responsive padding p-4 md:p-6
├── (admin)/admin/
│   ├── layout.tsx              # Modified — add AdminMobileMenu, responsive padding
│   └── kids/page.tsx           # Modified — stack card actions on mobile

tests/
└── e2e/
    └── mobile-responsive.spec.ts  # New — Playwright mobile viewport tests
```

## Implementation Guide

### 1. Dashboard NavBar — Mobile Hamburger Menu

**File**: `components/navbar/NavBar.tsx`

The existing desktop nav links (`Today`, `Rewards`, `Activity`, `Calendar` for kids; `Admin`, `Activity` for parents) are hidden on mobile (`hidden md:flex`). A `MobileMenu` client component renders only on mobile (`md:hidden`) as a hamburger button that opens a `Sheet`.

**File**: `components/navbar/MobileMenu.tsx` *(new)*

Client component. Accepts `session`, `kidPoints`, `kidId`, `familyName` as props. Internal `useState` controls Sheet open/close. Sheet contains the same nav links as the desktop nav, stacked vertically, with the logout form at the bottom.

```tsx
// Rough shape (not prescriptive — implementer chooses exact class names)
'use client'
import { useState } from 'react'
import { Menu } from 'lucide-react'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'

export function MobileMenu({ ... }) {
  const [open, setOpen] = useState(false)
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="text-white md:hidden">
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right">
        {/* nav links + logout */}
      </SheetContent>
    </Sheet>
  )
}
```

### 2. Admin Layout — Mobile Nav

**File**: `app/(admin)/admin/layout.tsx`

Desktop nav links (`Kids`, `Chores`, `Effort`, `Family`, `Rewards`) hidden on mobile (`hidden md:flex`). `AdminMobileMenu` client component added next to the logout button, visible only on mobile (`md:hidden`).

**File**: `components/admin/AdminMobileMenu.tsx` *(new)*

Same pattern as `MobileMenu`. Receives `familyExists: boolean` as prop (to conditionally render links, matching existing logic). Sheet opens on hamburger click.

Change main container padding: `p-6` → `p-4 md:p-6`.

### 3. Dashboard Layout — Padding

**File**: `app/(dashboard)/layout.tsx`

Change `<main className="max-w-4xl mx-auto p-6">` → `<main className="max-w-4xl mx-auto p-4 md:p-6">`.

### 4. Admin Kids Page — Card Layout

**File**: `app/(admin)/admin/kids/page.tsx`

Kid card `flex items-center justify-between p-4` becomes a two-part vertical layout on mobile:

```tsx
// Top section: name + badge
// Bottom section (mobile: full width; md: inline): points adjust form + delete button
<Card key={kid.id} className="p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
  <div className="flex items-center gap-4">
    {/* name, birthday, badge */}
  </div>
  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
    {/* points adjust form */}
    {/* delete button */}
  </div>
</Card>
```

The fixed-width inputs (`w-20`, `w-36`) work fine on small screens because the form wraps.

### 5. Playwright E2E Tests

**File**: `tests/e2e/mobile-responsive.spec.ts` *(new)*

```ts
// Tests run at { viewport: { width: 375, height: 812 } }
// Happy path: login page renders without horizontal scroll
// Happy path: dashboard nav hamburger opens Sheet
// Happy path: admin nav hamburger opens Sheet
// Critical failure: if Sheet doesn't open, nav links are unreachable
```

Use `page.setViewportSize({ width: 375, height: 812 })` at the start of each test or in `beforeEach`.

Verify no horizontal scroll: `expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375)`.

## Complexity Tracking

### Deviation: `useState` for Sheet toggle state (Principle III)

`MobileMenu` and `AdminMobileMenu` use `useState` to control `Sheet` open/close rather than TanStack Store.

**Justification**: The open/close boolean is ephemeral, component-local UI state with no need to be shared, persisted, or observed outside the component. TanStack Store is intended for application-level state (user data, route state, server cache) not for single-component toggle primitives. Using TanStack Store here would introduce an unshared store atom with a single subscriber — adding indirection without benefit. The shadcn `Sheet` (Radix Dialog) exposes a controlled `open`/`onOpenChange` API that naturally maps to a single `useState`.
