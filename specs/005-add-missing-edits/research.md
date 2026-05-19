# Research: Add Missing Edit UIs

## R1: Dialog Pattern for Server Actions

- **Decision**: Use shadcn Dialog with local `useState` for open/close, form `action` calling server action via `.bind(null, itemId)`
- **Rationale**: Matches existing codebase patterns (e.g., delete buttons use `.bind`). Dialog is already a "use client" component. Server action + `revalidatePath` handles data refresh without TanStack Query.
- **Alternatives considered**: Inline editing (rejected — more complex state management, inconsistent with create form pattern); full-page edit route (rejected — overkill for simple form edits)

## R2: Form Pre-population

- **Decision**: Use `defaultValue` props on Input components and `defaultChecked` on checkboxes, passing current item data as props to the dialog component
- **Rationale**: Native HTML form behavior, no controlled state needed. Matches the create form pattern.
- **Alternatives considered**: Controlled inputs with useState (rejected — unnecessary complexity for a form that submits via server action)

## R3: Data Flow from Server to Client Component

- **Decision**: Pass item data as props from server component page to client dialog component. Use a typed interface for the props.
- **Rationale**: Server component fetches data, client component handles interactivity. Standard Next.js App Router pattern.
- **Alternatives considered**: Client-side fetch (rejected — data already available in server component, violates constitution principle I)
