# Data Model: Fix Kids Pages 404

No database schema changes required. The existing data model is correct.

## Affected Entities (read-only context)

- **ChoreAssignment**: Links chores to kids. Correctly queried during day record seeding.
- **ChoreCompletion**: Snapshots of chore state for a day. Correctly seeded from assignments.
- **DayRecord**: Daily record per kid. Creation and completion seeding logic is correct.

## Note on Chore Icons

The `chore_completions` table does not store the chore icon. Icons are not snapshotted like name/penalty/importance. The `ChoreItem` component handles this with a fallback (`'star'`). Adding an icon snapshot column is an optional future enhancement, not required for this fix.
