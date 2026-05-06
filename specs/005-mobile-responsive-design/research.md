# Research: Mobile-Friendly Responsive Design

## Findings

### Decision: Mobile Navigation Pattern

**Decision**: Use shadcn `Sheet` component as a slide-in drawer for mobile navigation in both the dashboard NavBar and admin layout nav.

**Rationale**: The `Sheet` component is already installed (`components/ui/sheet.tsx`). It provides an accessible, animated slide-in panel that follows Radix UI conventions — consistent with the existing shadcn-first constitution. Using it avoids introducing any new packages.

**Alternatives considered**:
- Dropdown menu — less ergonomic for 5+ links
- Always-visible stacked nav — wastes vertical space on every page load
- Custom CSS-only hamburger — violates Principle IV (shadcn first)

### Decision: Tailwind Responsive Prefixes for Layout

**Decision**: Apply Tailwind responsive prefixes (`sm:`, `md:`) to existing class strings to adapt layouts at standard breakpoints.

**Rationale**: Tailwind CSS is already the styling layer via shadcn. No additional tooling needed. This is idiomatic Tailwind usage that keeps changes minimal and co-located with components.

**Alternatives considered**:
- Custom CSS media queries — redundant with Tailwind utilities
- CSS container queries — unsupported at this version without additional config

### Decision: MobileMenu Client Component Pattern

**Decision**: Create thin `MobileMenu` and `AdminMobileMenu` client components that receive nav link data as props, so the parent layout stays a server component.

**Rationale**: NavBar and admin layout are server components that fetch session data. Turning them into client components would move server-only data fetching (auth, Supabase calls) to the client. Extracting only the toggle/drawer into a client component preserves the RSC boundary correctly.

**Alternatives considered**:
- Make entire NavBar a client component — breaks RSC pattern and violates Principle I spirit
- `use client` on layout — not possible for layouts that do auth

### Decision: Admin Kids Page Form Stacking

**Decision**: On the kids list card, stack the info section and the action controls vertically on mobile using `flex-col md:flex-row`.

**Rationale**: The current inline layout (name + badge + points form + buttons) overflows on 375px screens. Stacking makes all controls accessible without horizontal scroll.

### Decision: Reduced Main Container Padding on Mobile

**Decision**: Change `p-6` to `p-4 md:p-6` in both dashboard and admin `<main>` containers.

**Rationale**: `p-6` (24px) on a 320px screen leaves only 272px for content, which is acceptable but tight. `p-4` (16px) gives 288px, more workable for content-dense pages like the admin kids form.

### Decision: Activity Table on Mobile

**Decision**: Keep the existing `overflow-x-auto` wrapper and add a visible horizontal scroll hint. No column collapsing.

**Rationale**: The `ActivityLogTable` already has `overflow-x-auto`. TanStack Table handles the layout. A horizontal scroll on mobile is acceptable for tabular data as it preserves full information. Adding column hiding would require structural changes beyond the scope of a responsive pass.

### Decision: shadcn Calendar Responsiveness

**Decision**: No changes needed to `CalendarView`.

**Rationale**: The shadcn `Calendar` component (`components/ui/calendar.tsx`) uses a fixed internal layout that renders within its container. Since it is rendered inside `max-w-4xl mx-auto p-4 md:p-6`, it will fit within its container at all target breakpoints. The calendar grid cells are 40px wide with 7 columns = ~280px minimum, which fits at 320px.
