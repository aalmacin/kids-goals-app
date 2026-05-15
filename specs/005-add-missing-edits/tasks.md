# Tasks: Add Missing Edit UIs

**Input**: Design documents from `specs/005-add-missing-edits/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md

**Tests**: Not explicitly requested in the spec. Test tasks omitted.

**Organization**: Tasks grouped by user story (US1: Edit Chore, US2: Edit Effort Level).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2)
- Includes exact file paths in descriptions

---

## Phase 1: User Story 1 - Edit a Chore (Priority: P1)

**Goal**: Parents can edit any chore's name, penalty, importance, and icon via a dialog on the Chore Library page.

**Independent Test**: Click the edit button on a chore, change the name, save, and verify the updated name appears in the list.

### Implementation for User Story 1

- [x] T001 [US1] Create EditChoreDialog client component with pre-populated form fields in components/edit-chore-dialog.tsx
- [x] T002 [US1] Add EditChoreDialog to chore list items with edit button alongside delete button in app/(admin)/admin/chores/page.tsx

**Checkpoint**: Chore editing should be fully functional. Verify by editing a chore's name and seeing the change reflected in the list.

---

## Phase 2: User Story 2 - Edit an Effort Level (Priority: P1)

**Goal**: Parents can edit any effort level's name and points via a dialog on the Effort Levels page.

**Independent Test**: Click the edit button on an effort level, change the points value, save, and verify the updated value appears in the list.

### Implementation for User Story 2

- [x] T003 [P] [US2] Create EditEffortLevelDialog client component with pre-populated form fields in components/edit-effort-level-dialog.tsx
- [x] T004 [US2] Add EditEffortLevelDialog to effort level items with edit button alongside delete button in app/(admin)/admin/effort/page.tsx

**Checkpoint**: Effort level editing should be fully functional. Verify by editing a level's points and seeing the change reflected in the list.

---

## Dependencies & Execution Order

### Phase Dependencies

- **US1 (Phase 1)**: No dependencies — can start immediately
- **US2 (Phase 2)**: No dependencies on US1 — can run in parallel

### User Story Dependencies

- **User Story 1 (P1)**: Independent. Uses existing `updateChoreAction` server action.
- **User Story 2 (P1)**: Independent. Uses existing `updateEffortLevelAction` server action.

### Parallel Opportunities

- T001 and T003 can run in parallel (different component files)
- T002 and T004 can run in parallel (different page files)
- Both user stories are fully independent and can be implemented simultaneously

---

## Parallel Example

```bash
# Launch both dialog components in parallel:
Task: "Create EditChoreDialog in components/edit-chore-dialog.tsx"
Task: "Create EditEffortLevelDialog in components/edit-effort-level-dialog.tsx"

# Then integrate both into pages in parallel:
Task: "Add EditChoreDialog to app/(admin)/admin/chores/page.tsx"
Task: "Add EditEffortLevelDialog to app/(admin)/admin/effort/page.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete T001-T002: Edit Chore dialog
2. **STOP and VALIDATE**: Test chore editing independently
3. Continue to User Story 2

### Full Delivery

1. Complete T001+T003 in parallel (both dialog components)
2. Complete T002+T004 in parallel (both page integrations)
3. Validate both edit flows work independently

---

## Notes

- Both user stories are P1 and fully independent
- No setup or foundational phase needed — backend actions and UI components already exist
- Each dialog follows the same pattern: shadcn Dialog + form with `defaultValue` + server action via `.bind(null, id)`
- 4 total tasks, all can be completed in 2 parallel batches
