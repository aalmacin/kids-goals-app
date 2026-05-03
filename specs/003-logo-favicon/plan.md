# Implementation Plan: Logo and Favicon

**Branch**: `003-logo-favicon` | **Date**: 2026-05-02 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/003-logo-favicon/spec.md`

## Summary

Add branded logo and favicon assets to the Kids Goals PWA. This involves copying pre-made icon assets into the public directory, updating the Next.js metadata/manifest configuration, and adding the logo to the app header component.

## Technical Context

**Language/Version**: TypeScript 5, Next.js 16.2.4
**Primary Dependencies**: Next.js (metadata API, manifest.ts), Serwist (PWA)
**Storage**: N/A (static assets only)
**Testing**: Playwright (visual verification), Vitest (component render)
**Target Platform**: Web (PWA, mobile + desktop browsers)
**Project Type**: Web application (Next.js App Router)
**Performance Goals**: Icons load within 1s on standard connections
**Constraints**: PWA-compatible, offline-capable (assets cached by service worker)
**Scale/Scope**: Static asset addition, minimal code changes

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Next.js Patterns | PASS | Using Next.js metadata API for favicon/icons, no CSP concerns with static assets |
| II. Supabase Patterns | N/A | No database involvement |
| III. TanStack First | N/A | No client state involved |
| IV. shadcn Components First | PASS | Logo display uses standard img/Next Image; no custom component library needed |
| V. Test Coverage | PASS | E2E test will verify logo/favicon presence |

No violations. Gate passes.

## Project Structure

### Documentation (this feature)

```text
specs/003-logo-favicon/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
└── tasks.md
```

### Source Code (repository root)

```text
public/
├── favicon.ico
├── favicon.svg
├── favicon-16.png
├── favicon-32.png
├── favicon-192.png
├── favicon-512.png
├── apple-touch-icon-180.png
└── kids_goals_app_logo.svg

app/
├── layout.tsx          # Updated metadata with icon references
├── manifest.ts         # Updated PWA manifest icons
└── favicon.ico         # Next.js auto-detected favicon (replaced)

components/
└── app-logo.tsx        # Logo component for header use
```

**Structure Decision**: Next.js App Router convention — static assets in `public/`, favicon at `app/favicon.ico`, metadata configured in `layout.tsx` and `manifest.ts`.

## Complexity Tracking

No violations to justify.
