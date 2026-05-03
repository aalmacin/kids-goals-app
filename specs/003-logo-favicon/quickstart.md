# Quickstart: Logo and Favicon

## Prerequisites

- Logo assets available at `~/Documents/2026/Kids Goals App/`
- Project running locally (`bun dev`)

## Steps

1. Copy icon assets from `~/Documents/2026/Kids Goals App/` to `public/` and `app/`
2. Replace existing `app/favicon.ico` with the new one
3. Update `app/layout.tsx` metadata to include icon references
4. Update `app/manifest.ts` to point to actual icon filenames
5. Create `components/app-logo.tsx` component
6. Add logo component to app header
7. Verify in browser: favicon in tab, logo in header, PWA install icon

## Verification

```bash
bun dev
# Open http://localhost:5024
# Check: favicon in browser tab
# Check: logo in header
# Check: DevTools > Application > Manifest > Icons resolve correctly
```
