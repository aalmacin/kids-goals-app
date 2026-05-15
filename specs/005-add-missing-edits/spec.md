# Feature Specification: Add Missing Edit UIs

**Feature Branch**: `005-add-missing-edits`
**Created**: 2026-05-14
**Status**: Draft
**Input**: User description: "Add these missing edits: Task Library. The tasks should be editable. Effort. Effort should be editable"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Edit a Chore in the Task Library (Priority: P1)

A parent navigates to the Chore Library admin page and wants to update an existing chore's name, penalty points, importance flag, or icon. They click an edit button on the chore, modify the fields in a dialog, and save the changes.

**Why this priority**: Chores are the core daily interaction — parents need to correct mistakes and adjust chore details as family needs change.

**Independent Test**: Can be fully tested by editing any existing chore's name and verifying the updated name appears in the chore list.

**Acceptance Scenarios**:

1. **Given** a parent is on the Chore Library page with existing chores, **When** they click the edit button on a chore, **Then** a dialog opens with the chore's current values pre-populated.
2. **Given** the edit dialog is open, **When** the parent changes the chore name and saves, **Then** the dialog closes and the updated name appears in the chore list.
3. **Given** the edit dialog is open, **When** the parent changes penalty, importance, or icon and saves, **Then** the updated values are reflected in the chore list.

---

### User Story 2 - Edit an Effort Level (Priority: P1)

A parent navigates to the Effort Levels admin page and wants to update an existing effort level's name or points value. They click an edit button on the effort level, modify the fields in a dialog, and save.

**Why this priority**: Effort levels directly affect bonus points — parents need to adjust values as the reward system evolves.

**Independent Test**: Can be fully tested by editing any existing effort level's points value and verifying the updated value appears in the list.

**Acceptance Scenarios**:

1. **Given** a parent is on the Effort Levels page with existing levels, **When** they click the edit button on a level, **Then** a dialog opens with the level's current name and points pre-populated.
2. **Given** the edit dialog is open, **When** the parent changes the name or points and saves, **Then** the dialog closes and the updated values appear in the effort levels list.

---

### Edge Cases

- What happens when a parent submits an edit with an empty name? The form should require a non-empty name.
- What happens when a parent submits a negative penalty or points value? The form should enforce minimum value of 0.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display an edit button alongside the delete button for each chore in the Chore Library.
- **FR-002**: System MUST display an edit button alongside the delete button for each effort level on the Effort Levels page.
- **FR-003**: Clicking the edit button MUST open a dialog with form fields pre-populated with the item's current values.
- **FR-004**: The chore edit dialog MUST allow editing: name, penalty points, importance flag, and icon.
- **FR-005**: The effort level edit dialog MUST allow editing: name and points reward.
- **FR-006**: Saving changes MUST persist them and refresh the list to show updated values.
- **FR-007**: The edit dialog MUST close after a successful save.
- **FR-008**: Form validation MUST require a non-empty name and non-negative numeric values.

### Key Entities

- **Chore**: Editable fields — name, penalty, is_important, icon.
- **Effort Level**: Editable fields — name, points.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Parents can edit any chore's details within 3 clicks (edit button, modify field, save).
- **SC-002**: Parents can edit any effort level's details within 3 clicks.
- **SC-003**: Edited values are immediately visible in the list after saving without a full page reload.

## Assumptions

- Backend update actions for chores and effort levels already exist and are functional.
- The existing dialog component library is available for use.
- Only parents (admin role) can access these edit features.
- Edit operations use the same form field types as the create forms (consistency).
