<!--
  SYNC IMPACT REPORT
  Version change: (unversioned template) → 1.0.0
  Added sections: Core Principles (I–V), Technology Stack, Testing Strategy, Governance
  Removed sections: N/A — initial constitution
  Templates updated:
    - .specify/templates/plan-template.md — ✅ Constitution Check section is template-driven; no edits needed
    - .specify/templates/spec-template.md — ✅ No changes needed (generic; constitution gates applied at runtime)
    - .specify/templates/tasks-template.md — ✅ Test tasks align with Principle V; no structural changes needed
  Follow-up TODOs: None
-->

# Kids Goals Constitution

## Core Principles

### I. Next.js Patterns

All server-side rendering MUST use a cryptographic nonce for Content Security Policy headers.
API routes MUST NOT be used for data mutations or queries that can be expressed as Server Actions
(RPC-style calls). Client components MUST call server actions directly rather than fetching
`/api/*` endpoints, except for third-party webhook receivers or streaming endpoints.

**Rationale**: Nonce-based CSP eliminates inline-script XSS vectors. RPC via Server Actions reduces
round-trip overhead and keeps data-fetching logic colocated with the server.

### II. Supabase Patterns

All database access MUST go through Supabase's typed client with Row Level Security (RLS) enabled
on every table. Auth MUST use Supabase Auth — parent accounts via email/password, child accounts
via family + name + passcode. Real-time subscriptions MUST be used for live data (activity log,
points balance) instead of polling. Supabase Edge Functions MUST NOT be introduced unless a
server action cannot satisfy the requirement.

**Rationale**: RLS enforces data isolation at the database layer, preventing client-side
privilege-escalation bugs. Real-time keeps the kid-facing UI reactive without custom WebSocket
infrastructure.

### III. TanStack First

All client-side server state MUST be managed with TanStack Query (no custom fetch hooks or SWR).
All client-side UI/application state MUST use TanStack Store. Any tabular data display MUST use
TanStack Table. Other TanStack libraries (Router, Form, etc.) MUST be evaluated before reaching
for alternatives. Custom state management solutions are prohibited.

**Rationale**: Consistent use of TanStack libraries reduces cognitive overhead across the codebase
and provides battle-tested caching, optimistic updates, and devtools out of the box.

### IV. shadcn Components First

All UI MUST be built from shadcn/ui components before writing any custom component. Custom
components are permitted only when no shadcn primitive satisfies the requirement AND the gap is
documented in the PR description. Custom components MUST follow the same Radix/Tailwind
conventions used by shadcn internals.

**Rationale**: shadcn components provide accessible, consistently styled primitives. Proliferating
custom components increases maintenance burden and accessibility risk.

### V. Test Coverage

Every user-facing flow MUST have a Playwright end-to-end test covering the happy path and at
least one critical failure path. All business logic (points calculation, penalty application,
effort rewards) MUST have unit tests. Integration tests MUST cover Supabase RLS rules and
server action contracts. Test files MUST be co-located or in a parallel `__tests__` directory.
Tests MUST pass in CI before merging.

**Rationale**: Kids Goals handles financial-like point transactions and access control between
parent and child accounts. Regressions here directly degrade trust.

## Technology Stack

- **Framework**: Next.js (App Router, Server Actions, no `/api` routes for data)
- **Backend-as-a-Service**: Supabase (Auth, PostgreSQL, Realtime)
- **UI Components**: shadcn/ui (Radix UI + Tailwind CSS)
- **Client State**: TanStack Store
- **Server State / Caching**: TanStack Query
- **Tables**: TanStack Table
- **E2E Testing**: Playwright
- **Unit / Integration Testing**: Vitest (or Jest if already bootstrapped)
- **Language**: TypeScript — strict mode, no `any`, no `@ts-ignore` without justification comment

## Testing Strategy

| Layer | Tool | Scope |
|-------|------|-------|
| Unit | Vitest | Business logic, utility functions, hooks |
| Integration | Vitest + Supabase local | RLS policies, server actions, DB queries |
| E2E | Playwright | Critical user paths (login, chore completion, rewards, end-day) |

All tests MUST be run in CI. Playwright tests MUST target a seeded local Supabase instance, not
production.

## Governance

This constitution supersedes all other conventions. Amendments require:
1. A PR that updates this file with a version bump following semantic versioning.
2. A rationale comment explaining the change.
3. Propagation of any affected template or guideline files in the same PR.

All PRs MUST include a brief "Constitution Check" confirming no principles are violated. Any
intentional deviation MUST be documented in the Complexity Tracking section of `plan.md`.

**Version**: 1.0.0 | **Ratified**: 2026-04-25 | **Last Amended**: 2026-04-25
