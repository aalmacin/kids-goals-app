# Feature Specification: Chore Completion Reward Points

**Feature Branch**: `005-chore-reward-points`
**Created**: 2026-05-06
**Status**: Draft

## Clarifications

### Session 2026-05-06

- Q: Should reward points be configurable at the library level (inherited by all kids assigned the chore) or per kid assignment? → A: Library-level only — one reward value per chore definition, inherited by all kids assigned that chore.
- Q: Should kids see the configured reward point value for each chore on their dashboard before completing it? → A: Yes — display the reward value on each chore tile so kids can see potential points before completing.
- Q: Should there be a maximum cap on the reward point value a parent can configure per chore? → A: No cap — any non-negative integer is accepted, consistent with how penalty points work.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Configure Reward Points on a Chore (Priority: P1)

A parent can set a reward point value on any chore in the family library. This value represents how many points a kid earns when they complete the chore before End Day. The field behaves identically to the existing penalty field — both are optional non-negative integers, and both are editable at any time. The reward value is set once on the library chore and applies equally to all kids assigned that chore.

**Why this priority**: Reward points are the core of this feature. Without the ability to configure them, nothing else can function.

**Independent Test**: A parent can create or edit a chore, set a reward point value, save it, and see the reward value reflected in the chore library — without any kid needing to complete anything.

**Acceptance Scenarios**:

1. **Given** a logged-in parent creating a new chore, **When** they enter a reward point value alongside the penalty value, **Then** the chore is saved with both values.
2. **Given** an existing chore with no reward value, **When** the parent edits it and sets a reward value, **Then** the chore is updated and the new reward value is stored.
3. **Given** a chore with a reward value already set, **When** the parent edits it and changes the reward value, **Then** the new value is saved.
4. **Given** a chore where the parent leaves the reward field empty, **When** the chore is saved, **Then** the chore is valid and reward points default to zero (no reward earned on completion).
5. **Given** a parent entering a negative reward value, **When** they submit the form, **Then** an error is shown and the value is rejected.
6. **Given** two kids assigned the same library chore with a reward of 10, **When** either kid completes the chore, **Then** both earn 10 points (the same library-level value).

---

### User Story 2 - Earn Reward Points on Chore Completion (Priority: P2)

When a kid marks a chore as complete, they immediately earn the configured reward points. The points are added to their balance and recorded as an event in the audit log. If the kid unchecks the chore, the earned reward is reversed. The kid's dashboard shows the potential reward value on each chore tile before completion, providing motivation to act.

**Why this priority**: This is the payoff for kids completing chores — the primary motivation mechanic.

**Independent Test**: A kid marks a chore with a 10-point reward as complete. Their balance increases by 10 and an event appears in the activity log. The kid then unchecks the chore and the balance decreases by 10.

**Acceptance Scenarios**:

1. **Given** a kid with a chore that has a reward value of 10, **When** the kid marks it complete, **Then** their balance increases by 10 and a `chore_completion_reward` event is recorded.
2. **Given** a kid who has already earned reward points for a chore, **When** they uncheck the chore, **Then** the reward is reversed (balance decreases by the same amount) and a reversal event is recorded.
3. **Given** a chore with a reward value of zero, **When** the kid marks it complete, **Then** their balance does not change and no reward event is recorded.
4. **Given** a chore with no reward value configured, **When** the kid marks it complete, **Then** their balance does not change and no reward event is recorded.
5. **Given** a kid completing multiple chores in the same day, **When** each is checked off, **Then** the total balance reflects the sum of all individual reward point events.

---

### User Story 3 - Reward Points Visible in Activity Log (Priority: P3)

A parent reviewing the activity log can see chore completion reward events alongside penalty events, manual adjustments, and all other point changes. Each reward event shows the chore name, the points earned, and the timestamp.

**Why this priority**: Parents need to explain to kids where their points came from. Transparency builds trust.

**Independent Test**: After a kid completes a rewarded chore, the parent views the activity log and sees a reward event with the chore name and point amount.

**Acceptance Scenarios**:

1. **Given** a kid who has earned points by completing chores, **When** a parent views that kid's activity log, **Then** reward events appear alongside all other event types with chore name, point delta, and timestamp.
2. **Given** a reward event in the log, **When** the parent views it, **Then** the event is clearly distinguishable from penalty events (e.g., labeled as a reward or completion).
3. **Given** a reward reversal event (from unchecking), **When** the parent views the log, **Then** the reversal is shown with a negative delta and the original chore name.

---

### Edge Cases

- What happens if a chore's reward value is changed after a kid has already earned points for it today? The already-earned reward amount is not retroactively adjusted; only future completions use the new value.
- What if a kid has already earned a reward for a chore and the chore is deleted from the library? Historical events retain the chore name and reward data (soft delete behavior, consistent with existing chore deletion rules).
- What happens when End Day is triggered and a chore is still marked complete? The penalty is not applied (chore is complete), and the reward was already granted at completion time — no additional action needed.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Each chore in the family library MUST support an optional, non-negative integer reward point value. This value is defined once at the library level and applies equally to all kids assigned that chore.
- **FR-002**: The reward field MUST behave consistently with the penalty field in the chore creation and edit forms (same validation, same optionality, same display).
- **FR-003**: When a kid marks a chore as complete, the system MUST immediately add the configured reward points to the kid's balance (if reward > 0).
- **FR-004**: The system MUST record each completion reward as an immutable point event in the audit log with event type `chore_completion_reward`, the chore reference, and the point delta.
- **FR-005**: When a kid unchecks a completed chore, the system MUST reverse the previously granted reward (deduct the same amount) and record a corresponding reversal event.
- **FR-006**: Chores with a reward value of zero or no reward configured MUST NOT generate a reward event on completion.
- **FR-007**: The activity log MUST display `chore_completion_reward` events with chore name, point amount, and timestamp, clearly distinguishable from penalty events.
- **FR-008**: The reward point value for a chore MUST be independently configurable from the penalty value — changing one MUST NOT affect the other.
- **FR-009**: A kid's displayed balance MUST reflect earned reward points immediately upon chore completion, consistent with the event-sourced balance model.
- **FR-010**: Each chore tile on the kid's dashboard MUST display the configured reward point value (if > 0) before the chore is completed, so kids can see what they stand to earn.

### Key Entities

- **Chore (updated)**: Now carries an optional `reward_points` integer (≥ 0) alongside the existing `penalty_points`. Defined at library level, inherited by all kid assignments. Defaults to zero if not set.
- **Point Event (extended)**: A new event type `chore_completion_reward` is added to the existing event type enumeration. A corresponding reversal type handles unchecking.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A parent can configure reward points on a chore in under 30 seconds.
- **SC-002**: A kid's balance reflects earned reward points within 2 seconds of marking a chore complete.
- **SC-003**: 100% of chore completion events with a non-zero reward produce a corresponding audit log entry — no silent balance changes.
- **SC-004**: Reward events and penalty events are independently distinguishable in the activity log with zero ambiguity.
- **SC-005**: Unchecking a chore correctly reverses the reward — no manual correction needed.

## Assumptions

- Reward points are earned at the moment of completion (checkbox toggle), not at End Day — mirroring how penalties are assessed at End Day but in reverse timing.
- A reward value of zero is treated the same as no reward configured — no event is generated.
- The penalty for incomplete chores at End Day is unaffected by this feature; the two systems are additive and independent.
- Existing chores without a reward value set are treated as having a reward of zero; no migration needed beyond a schema default.
- The chore library edit UI will surface the reward field for all chores regardless of whether they currently have a reward configured.
- Reward values are library-level only; per-kid assignment overrides are out of scope.
- There is no maximum cap on reward point values; any non-negative integer is accepted, consistent with how penalty points work.
