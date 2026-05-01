# Feature Specification: Points Event Sourcing & Manual Adjustment

**Feature Branch**: `002-points-event-sourcing`
**Created**: 2026-04-30
**Status**: Draft

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Event-Sourced Point Ledger (Priority: P1)

Every change to a kid's point balance — whether from chores, penalties, effort rewards, rest days, reward redemptions, or manual parent adjustments — is recorded as an immutable event. The kid's displayed point balance is always derived from the sum of those events, never written to directly by application logic.

**Why this priority**: This is the foundation everything else builds on. Without a reliable event ledger, the manual adjustment feature and audit trail have no ground truth to stand on.

**Independent Test**: Complete a chore, end a day (triggering a penalty and effort reward), and redeem a reward. Verify the kid's displayed balance matches the exact sum of all recorded point events — and that no direct balance update exists outside the event log.

**Acceptance Scenarios**:

1. **Given** a kid completes a chore and the day ends, **When** the system records the penalty and effort events, **Then** the kid's displayed balance equals the sum of all point events for that kid.
2. **Given** a kid redeems a reward, **When** the redemption event is recorded, **Then** the balance decreases by exactly the reward cost and the event is visible in the audit log.
3. **Given** a kid purchases a rest day, **When** the event is recorded, **Then** the balance decreases by 100 and the event is in the log.
4. **Given** two simultaneous point events for the same kid, **When** both are recorded, **Then** the final balance reflects both events and neither is lost.
5. **Given** any point event is recorded, **When** a developer queries the event log, **Then** the sum of all events for that kid equals the kid's current displayed balance (no drift).

---

### User Story 2 - Parent Manual Point Adjustment (Priority: P2)

A parent can add or subtract any number of points from a kid's balance directly from the kids management page. An optional reason can be recorded. The adjustment is logged as an event in the audit trail just like any other point change.

**Why this priority**: Corrections are the primary use case the parent needs. This builds directly on the event ledger established in P1.

**Independent Test**: A parent adds 50 points to a kid with an optional reason. The balance increases by 50 and the event appears in the activity log with the reason. A parent then subtracts 30 points without a reason. The balance decreases by 30 and the event is logged.

**Acceptance Scenarios**:

1. **Given** a logged-in parent on the kids management page, **When** they enter a positive number and submit an adjustment for a kid, **Then** the kid's balance increases by that amount and an event is logged with `actor_type: parent`.
2. **Given** a logged-in parent, **When** they enter a negative number and submit an adjustment, **Then** the kid's balance decreases by that amount (floored at zero) and an event is logged.
3. **Given** a parent who enters an optional reason, **When** the adjustment is submitted, **Then** the reason is stored with the event and visible in the activity log.
4. **Given** a parent who leaves the reason blank, **When** the adjustment is submitted, **Then** the adjustment still succeeds — the reason is truly optional.
5. **Given** a non-parent user (a kid), **When** they attempt a manual adjustment, **Then** the action is rejected.

---

### User Story 3 - Audit Trail Visibility (Priority: P3)

A parent can view the full history of point changes for any kid, including the event type, delta, and optional reason for manual adjustments.

**Why this priority**: Traceability matters — parents need to explain to kids why their balance changed. Without visibility the audit trail is incomplete from a user perspective.

**Independent Test**: After performing a mix of chore completions, a penalty, and a manual adjustment, the parent views the activity log and sees all events in chronological order with their types, amounts, and reason (where provided).

**Acceptance Scenarios**:

1. **Given** a kid with a mix of event types, **When** a parent views the activity log, **Then** all events are listed with event type, point delta, and timestamp.
2. **Given** a manual adjustment event with a reason, **When** the parent views it in the activity log, **Then** the reason is displayed alongside the event.
3. **Given** a manual adjustment event without a reason, **When** the parent views it, **Then** the event is shown without a reason field (no blank/placeholder displayed).

---

### Edge Cases

- What happens when an adjustment would reduce a kid's balance below zero? The balance is floored at zero; the event is still recorded with the full delta.
- What happens if two adjustments are submitted simultaneously for the same kid? Both events are recorded; the balance reflects both.
- What if the event log is empty for a kid? The kid's balance is zero.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST record every point change as an immutable event before updating a kid's displayed balance.
- **FR-002**: A kid's displayed point balance MUST always equal the sum of all point events recorded for that kid.
- **FR-003**: The system MUST automatically recalculate a kid's balance whenever a new point event is recorded — no manual reconciliation step required.
- **FR-004**: Parents MUST be able to submit a manual point adjustment (positive or negative integer) for any kid in their family from the kids management page.
- **FR-005**: Manual adjustments MUST be recorded as events with `actor_type: parent` and a new `manual_adjustment` event type.
- **FR-006**: The reason field for manual adjustments MUST be optional — an empty reason is valid.
- **FR-007**: Manual adjustments MUST be rejected for non-parent users.
- **FR-008**: A kid's point balance MUST never be displayed as negative; zero is the floor.
- **FR-009**: All existing point-changing flows (chore completion, penalties, effort rewards, rest day purchase, reward redemption) MUST continue to produce audit-log events as they already do.
- **FR-010**: The activity log MUST display manual adjustment events with their type, delta, timestamp, and reason (when present).

### Key Entities

- **Point Event**: An immutable record of a single point change for a kid. Attributes: kid, actor type (parent/kid), event type, point delta, timestamp, optional reason.
- **Kid Balance**: A read-optimized cache of a kid's current points. Derived from the sum of all point events; never written to independently of an event.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A parent can submit a manual point adjustment in under 30 seconds from the kids management page.
- **SC-002**: A kid's displayed balance is updated within 2 seconds of any point event being recorded.
- **SC-003**: Zero discrepancy between a kid's displayed balance and the sum of their recorded point events at any point in time.
- **SC-004**: 100% of point-changing operations produce an audit log entry — no silent balance updates.
- **SC-005**: A parent can identify the cause of any point change by reviewing the activity log without additional tooling.

## Assumptions

- Only parents can submit manual adjustments; kids have no access to this feature.
- The point delta for a manual adjustment can be any non-zero integer; there is no upper or lower bound enforced by the application.
- The reason field, when provided, is a short free-text string (no rich formatting required).
- The existing activity log display (activity page) will surface the `manual_adjustment` event type without a dedicated separate view.
- Balance-floor-at-zero is already enforced by the data layer and that behaviour is preserved.
- All existing event types continue to work exactly as before; this feature does not alter their semantics.
