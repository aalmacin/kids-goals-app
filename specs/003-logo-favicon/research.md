# Research: Logo and Favicon

## Decision 1: Favicon Strategy in Next.js 16

**Decision**: Use the Next.js App Router metadata API with `app/favicon.ico` for automatic detection, plus explicit icon configuration in `layout.tsx` metadata for additional sizes.

**Rationale**: Next.js 16 automatically serves `app/favicon.ico` without configuration. For additional sizes (apple-touch-icon, SVG favicon, PWA icons), the metadata export in `layout.tsx` provides the `icons` field.

**Alternatives considered**:
- Manual `<link>` tags in layout — rejected; metadata API is the Next.js convention
- Only `app/favicon.ico` — insufficient for PWA and Apple devices

## Decision 2: Logo Component Approach

**Decision**: Create a simple `app-logo.tsx` component using an `<img>` tag pointing to the SVG in `public/`. Use `kids_goals_app_logo.svg` as the primary logo.

**Rationale**: SVG logos scale perfectly at any size. A dedicated component allows reuse in header, login page, etc. Using `<img>` with SVG is simpler than inlining and works with CSP nonce requirements.

**Alternatives considered**:
- Next.js `<Image>` component — adds complexity for SVGs that don't benefit from optimization
- Inline SVG — CSP complications with nonce, harder to maintain
- `little_wins_logo.svg` — this appears to be an alternative brand name; using the primary `kids_goals_app_logo.svg`

## Decision 3: PWA Manifest Icons

**Decision**: Update `app/manifest.ts` to reference the actual icon files: `favicon-192.png` and `favicon-512.png`.

**Rationale**: The manifest already references `/icon-192x192.png` and `/icon-512x512.png` which don't exist. Updating to the actual filenames fixes PWA installation.

**Alternatives considered**:
- Renaming files to match existing manifest — unnecessary file renames when we can update the code

## Decision 4: Service Worker Caching

**Decision**: No changes needed to Serwist configuration for static assets. The service worker (`sw.ts`) will cache assets served from `public/` automatically via the default precache strategy.

**Rationale**: Serwist/Workbox precaches static assets by default in Next.js PWA setups.
