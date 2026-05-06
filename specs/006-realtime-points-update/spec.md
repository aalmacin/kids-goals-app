# Feature Specification: Realtime Points Update on Day Completion

**Feature Branch**: `006-realtime-points-update`
**Created**: 2026-05-06
**Status**: Draft
**Input**: User description: "Whenever the day is completed on the app, the points on the UI should be updated right away."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Points Reflect Immediately After Day Completion (Priority: P1)

A parent or child completes the day's goals/chores on the app. As soon as the day is marked complete, the points total displayed on screen updates to reflect the newly earned points — no page refresh or navigation required.

**Why this priority**: This is the core behavior described. Without it, users see stale data after completing a day, eroding trust in the app's accuracy.

**Independent Test**: Mark a day as complete and observe the points display on the same screen — it should increment immediately without any reload.

**Acceptance Scenarios**:

1. **Given** a child has an existing points total displayed on screen, **When** the day is marked as complete, **Then** the points total on the UI updates to the new value within 1 second without requiring a page refresh.
2. **Given** a day has been marked complete, **When** the user navigates away and returns to the points display, **Then** the updated points value is shown consistently.
3. **Given** a day is marked complete, **When** the points update occurs, **Then** no error message or loading failure is shown to the user.

---

### User Story 2 - Points Stay Accurate If Day Completion Is Undone (Priority: P2)

If the day completion is reversed or modified, the points display reflects the corrected value immediately, keeping the UI consistent with the actual state.

**Why this priority**: Consistency in both directions (adding and removing points) prevents confusion and data mismatch.

**Independent Test**: Complete a day, verify points update, then undo completion and verify points revert accordingly.

**Acceptance Scenarios**:

1. **Given** a day was marked complete and points were added, **When** the day completion is reversed, **Then** the points total on the UI decreases to reflect the removal within 1 second.

---

### Edge Cases

- What happens if the network is temporarily unavailable when the day is completed? The UI should show the updated value once connectivity is restored or indicate a pending sync.
- What if multiple days are completed in rapid succession? Each completion should result in an accurate cumulative points total.
- What if the user is viewing the points on multiple screens/devices simultaneously? The primary screen completing the action must update immediately; other screens may update on next interaction.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The points total displayed on the UI MUST update immediately after a day is marked as complete, without requiring a page reload or manual refresh.
- **FR-002**: The updated points value MUST accurately reflect the points earned from the completed day.
- **FR-003**: The points update MUST occur within 1 second of the day completion action on the same screen.
- **FR-004**: If day completion is reversed, the points total MUST update immediately to reflect the corrected value.
- **FR-005**: The points display MUST remain consistent with the actual stored points value across navigation within the app.

### Key Entities

- **Day**: A record representing a single day's goals or chores for a kid; can be marked complete or incomplete.
- **Points**: A numeric value associated with a kid, accumulating as days are completed; displayed on the UI.
- **Kid**: The child user whose points are being tracked and displayed.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Points total updates on screen within 1 second of a day being marked complete, in 100% of cases under normal network conditions.
- **SC-002**: Zero instances of stale points data shown to the user after a day completion on the same screen session.
- **SC-003**: Points value shown on the UI matches the actual stored points value 100% of the time after any day completion event.
- **SC-004**: Users report no confusion about points not updating — confirmed through absence of support issues related to stale points display.

## Assumptions

- The app already has a mechanism for marking a day as complete; this feature only concerns the UI reflecting the resulting points change immediately.
- Points are calculated server-side or in a shared state layer when a day is completed; the UI needs to react to that change.
- The points display is a single value shown per kid — not a breakdown by day or goal.
- Mobile or offline scenarios are out of scope for v1; normal network connectivity is assumed.
