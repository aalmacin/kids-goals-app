# Data Model: Add Missing Edit UIs

No schema changes required. This feature adds UI for existing update operations.

## Existing Entities (read/write via edit dialogs)

### Chore

| Field | Type | Editable | Validation |
|-------|------|----------|------------|
| id | UUID | No | — |
| family_id | UUID | No | — |
| name | text | Yes | Required, non-empty, trimmed |
| penalty | integer | Yes | >= 0 |
| is_important | boolean | Yes | — |
| icon | text | Yes | Must be valid icon name from IconPicker |
| deleted_at | timestamptz | No | Managed by soft-delete |

### Effort Level

| Field | Type | Editable | Validation |
|-------|------|----------|------------|
| id | UUID | No | — |
| family_id | UUID | No | — |
| name | text | Yes | Required, non-empty, trimmed |
| points | integer | Yes | >= 0 |

## Existing Server Actions

- `updateChoreAction(choreId: string, formData: FormData)` — updates name, penalty, is_important, icon
- `updateEffortLevelAction(id: string, formData: FormData)` — updates name, points

Both actions call `requireParentFamily()` for authorization and `revalidatePath` for cache invalidation.
