# Feature Specification: Realtime Points Update on Day Completion

**Feature Branch**: `006-realtime-points-update`
**Created**: 2026-05-06
**Status**: Draft
**Input**: User description: "Whenever the day is completed on the app, the points on the UI should be updated right away."

## Clarifications

### Session 2026-05-06

- Q: Is day completion reversal (FR-004, User Story 2) in scope for this fix? → A: Yes — day completion can be reversed and points must reflect that immediately.
- Q: Should the real-time update requirement apply only to the navbar badge or to all points displays? → A: All displays — any place showing a kid's points balance must update after day completion or reversal.
- Q: Does a day reversal mechanism exist, or must it be built? → A: Build it — an "Undo End Day" button with a confirmation dialog, accessible to the kid, for cases where the day was ended accidentally with wrong or missed chores.
- Q: Should "Undo End Day" be time-limited or always available? → A: Always available for any ended day — the activity log provides audit visibility for parents to detect any manipulation.
- Q: Where should the "Undo End Day" button appear? → A: Both the main dashboard (today's view) and the calendar day view, so any ended day can be undone from either screen.

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

### User Story 2 - Kid Can Undo an Accidental Day Completion (Priority: P2)

After ending the day, the kid sees an "Undo End Day" option. Tapping it shows a confirmation dialog. If confirmed, the day is re-opened so the kid can correct missed or incorrectly selected chores. The points balance immediately reflects the reversal of any penalties or rewards applied when the day was ended.

**Why this priority**: Kids may accidentally end the day with the wrong chores selected. An undo path prevents an irreversible mistake and keeps the points balance accurate.

**Independent Test**: End a day, confirm the undo, verify the day is re-opened and the points badge reflects the reversed balance — all within the same screen session.

**Acceptance Scenarios**:

1. **Given** a kid has just ended the day, **When** they tap "Undo End Day" and confirm, **Then** the day is re-opened and available for chore editing.
2. **Given** a day completion has been undone, **When** the reversal completes, **Then** every points display updates to the corrected balance within 1 second without a page reload.
3. **Given** a day completion is undone, **When** the kid ends the day again, **Then** the day can be completed normally as if for the first time.
4. **Given** the kid is viewing a past ended day in the calendar, **When** they tap "Undo End Day" and confirm, **Then** the day is re-opened and every points display updates immediately.

---

### Edge Cases

- What happens if the network is temporarily unavailable when the day is completed? The UI should show the updated value once connectivity is restored or indicate a pending sync.
- What if multiple days are completed in rapid succession? Each completion should result in an accurate cumulative points total.
- What if the user is viewing the points on multiple screens/devices simultaneously? The primary screen completing the action must update immediately; other screens may update on next interaction.
- What if day completion is reversed but the original penalty or reward can no longer be calculated (e.g., effort level deleted)? The reversal must still update the badge to the current stored balance.
- What if a kid repeatedly ends and undoes the same day? Each cycle is logged in the activity audit trail; no additional restrictions apply — the parent can review the history.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Every points display in the app MUST update immediately after a day is marked as complete, without requiring a page reload or manual refresh.
- **FR-002**: The updated points value MUST accurately reflect the points earned (or deducted) from the completed day.
- **FR-003**: The points update MUST occur within 1 second of the day completion action on the same screen.
- **FR-004**: If day completion is reversed, every points display MUST update immediately to reflect the corrected value, within 1 second, without a page reload.
- **FR-005**: The points display MUST remain consistent with the actual stored points value across navigation within the app.
- **FR-006**: When a day completion is undone, all points adjustments from that completion (penalties and effort rewards) MUST be reversed, restoring the kid's balance to its pre-completion value.
- **FR-007**: The "Undo End Day" action MUST be protected by a confirmation dialog to prevent accidental reversal.
- **FR-008**: "Undo End Day" MUST be available for any previously ended day, with no time restriction, accessible from both the main dashboard and the calendar day view.
- **FR-009**: Every undo event MUST be recorded in the activity audit log so parents can review the history.

### Key Entities

- **Day**: A record representing a single day's goals or chores for a kid; can be marked complete or reversed to incomplete.
- **Points**: A numeric value associated with a kid, accumulating or decreasing as days are completed or reversed; displayed on the UI.
- **Kid**: The child user whose points are being tracked and displayed.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All points displays update within 1 second of a day being marked complete or reversed, in 100% of cases under normal network conditions.
- **SC-002**: Zero instances of stale points data shown to the user after a day completion or reversal on the same screen session, on any screen.
- **SC-003**: Points value shown on every display matches the actual stored points value 100% of the time after any day completion or reversal event.
- **SC-004**: Users report no confusion about points not updating — confirmed through absence of support issues related to stale points display.

## Assumptions

- The app already has a mechanism for marking a day as complete; this feature only concerns the UI reflecting the resulting points change immediately.
- A day reversal mechanism ("Undo End Day") will be built as part of this feature; it is accessible to the kid and protected by a confirmation dialog.
- When a day is undone, chore completions remain as they were — only the day's ended state and its associated points adjustments are reversed.
- Points are calculated server-side when a day is completed or reversed; the UI needs to react to that change.
- The points display is a single value shown per kid — not a breakdown by day or goal.
- Mobile or offline scenarios are out of scope for v1; normal network connectivity is assumed.
