# Feature Specification: Chore Completion Reward Points

**Feature Branch**: `005-chore-reward-points`
**Created**: 2026-05-06
**Status**: Draft

## Clarifications

### Session 2026-05-06

- Q: Should reward points be configurable at the library level (inherited by all kids assigned the chore) or per kid assignment? → A: Library-level only — one reward value per chore definition, inherited by all kids assigned that chore.
- Q: Should kids see the configured reward point value for each chore on their dashboard before completing it? → A: Yes — display the reward value on each chore tile so kids can see potential points before completing.
- Q: Should there be a maximum cap on the reward point value a parent can configure per chore? → A: No cap — any non-negative integer is accepted, consistent with how penalty points work.

### Session 2026-05-07

- Q: When are reward points credited to a kid's balance — immediately on chore toggle or at End Day? → A: At End Day only, not on toggle. Rewards are granted when the parent triggers End Day, mirroring how penalty points work.
- Q: At End Day, should multiple completed rewarded chores generate one event per chore or one aggregate event? → A: One `chore_completion_reward` event per completed chore with reward > 0 (per-chore detail).
- Q: Should the reward badge (+N pts) be visible only on uncompleted chores or on both completed and uncompleted tiles? → A: Show on both completed and uncompleted tiles — confirms the reward is queued when shown on a completed tile.

### Session 2026-05-10

- Q: Does "undo end day" exist and should reward reversal be added to this branch? → A: Yes — undo End Day exists; reward reversal is in scope for this branch.
- Q: How should reward reversal be recorded when End Day is undone? → A: Insert one offsetting negative event per reversed reward (`chore_completion_reward_reversed`), preserving the immutable audit log.
- Q: Should `chore_completion_reward_reversed` events appear in the parent-facing activity log? → A: Yes — show as distinct labeled entries (e.g., "Chore Reward Reversed") alongside other events.

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
6. **Given** two kids assigned the same library chore with a reward of 10, **When** either kid completes the chore and End Day is triggered, **Then** both earn 10 points (the same library-level value).

---

### User Story 2 - Earn Reward Points at End Day (Priority: P2)

When End Day is triggered, the system grants reward points to a kid for each chore they completed during the day. The points are added to their balance and recorded as events in the audit log — one event per completed chore with a non-zero reward. If a kid checked a chore and then unchecked it before End Day, they do not earn the reward (the chore is not completed). The kid's dashboard shows the potential reward value on each chore tile before End Day, providing motivation to act.

**Why this priority**: This is the payoff for kids completing chores — the primary motivation mechanic.

**Independent Test**: A kid marks a chore with a 10-point reward as complete. End Day is triggered. Their balance increases by 10 and an event appears in the activity log. The kid then starts a new day, marks the same chore complete, unchecks it, then End Day is triggered — balance does not increase.

**Acceptance Scenarios**:

1. **Given** a kid with a completed chore that has a reward value of 10, **When** End Day is triggered, **Then** their balance increases by 10 and a `chore_completion_reward` event is recorded.
2. **Given** a kid who checked a chore and then unchecked it before End Day, **When** End Day is triggered, **Then** no reward is granted for that chore and no reward event is recorded.
3. **Given** a chore with a reward value of zero, **When** End Day is triggered after the kid completes it, **Then** their balance does not change and no reward event is recorded.
4. **Given** a chore with no reward value configured, **When** End Day is triggered after the kid completes it, **Then** their balance does not change and no reward event is recorded.
5. **Given** a kid completing multiple rewarded chores in the same day, **When** End Day is triggered, **Then** the total balance reflects the sum of all individual reward point events.

---

### User Story 3 - Reward Points Visible in Activity Log (Priority: P3)

A parent reviewing the activity log can see chore completion reward events alongside penalty events, manual adjustments, and all other point changes. Each reward event shows the chore name, the points earned, and the timestamp.

**Why this priority**: Parents need to explain to kids where their points came from. Transparency builds trust.

**Independent Test**: After End Day is triggered for a kid who completed a rewarded chore, the parent views the activity log and sees a reward event with the chore name and point amount.

**Acceptance Scenarios**:

1. **Given** a kid who has earned points by completing chores (End Day triggered), **When** a parent views that kid's activity log, **Then** reward events appear alongside all other event types with chore name, point delta, and timestamp.
2. **Given** a reward event in the log, **When** the parent views it, **Then** the event is clearly distinguishable from penalty events (e.g., labeled as a reward or completion).

---

### Edge Cases

- What happens if a chore's reward value is changed after a kid has already marked it complete but before End Day? The reward snapshot is taken at day-record creation (when the day starts), so the reward granted at End Day uses the snapshotted value, not the updated library value.
- What if a kid has already earned a reward for a chore and the chore is deleted from the library? Historical events retain the chore name and reward data (soft delete behavior, consistent with existing chore deletion rules).
- What happens when End Day is triggered and a chore is still marked complete? The penalty is not applied (chore is complete), and the reward is granted at that moment — no additional action needed.
- What if a kid unchecks a chore before End Day? The chore is incomplete at End Day, so no reward is granted and no penalty-reversal is needed (reward was never credited to the balance).
- What happens if End Day is undone after rewards are granted? One `chore_completion_reward_reversed` event is inserted per original `chore_completion_reward` event from that End Day run, with a negative `points_delta` equal to the original snapshot. The kid's balance is restored via the existing `activity_log` trigger. Reversal events appear in the activity log as distinct "Chore Reward Reversed" entries.
- **Bug**: When all chores are checked and End Day is undone, points incorrectly increase instead of simply reverting the effort level. Root cause: the undo logic generates reversal events for chore penalties that were never applied (all chores were complete = no penalty events recorded), resulting in spurious positive point adjustments. Undo MUST only reverse events that were actually recorded during that specific End Day run — it must not synthesise reversal events for events that do not exist.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Each chore in the family library MUST support an optional, non-negative integer reward point value. This value is defined once at the library level and applies equally to all kids assigned that chore.
- **FR-002**: The reward field MUST behave consistently with the penalty field in the chore creation and edit forms (same validation, same optionality, same display).
- **FR-003**: When End Day is triggered, the system MUST add the configured reward points to the kid's balance for each chore they completed during the day (if reward > 0). Rewards are NOT granted on chore toggle.
- **FR-004**: The system MUST record each completion reward as an immutable point event in the audit log with event type `chore_completion_reward`, the chore reference (via snapshot metadata), and the point delta. One event per completed chore with non-zero reward, inserted during the End Day flow.
- **FR-005**: If a kid unchecks a chore before End Day, no reward reversal is needed — the reward was never granted.
- **FR-006**: Chores with a reward value of zero or no reward configured MUST NOT generate a reward event at End Day.
- **FR-007**: The activity log MUST display `chore_completion_reward` events with chore name, point amount, and timestamp, clearly distinguishable from penalty events.
- **FR-008**: The reward point value for a chore MUST be independently configurable from the penalty value — changing one MUST NOT affect the other.
- **FR-009**: A kid's displayed balance MUST reflect earned reward points immediately upon End Day completion, consistent with the event-sourced balance model.
- **FR-010**: Each chore tile on the kid's dashboard MUST display the configured reward point value (if > 0) on both completed and uncompleted tiles, so kids can see what they stand to earn (uncompleted) and confirm what is queued for End Day (completed).
- **FR-011**: When End Day is undone, the system MUST insert one `chore_completion_reward_reversed` event per `chore_completion_reward` event from that End Day run, with a negative `points_delta` equal to the original reward snapshot, restoring the kid's balance via the existing trigger.
- **FR-012**: The activity log MUST display `chore_completion_reward_reversed` events with a distinct label (e.g., "Chore Reward Reversed"), the negative point delta, and timestamp, clearly distinguishable from reward grant events.
- **FR-013**: The Undo End Day operation MUST only reverse point events that were actually recorded during that End Day run. It MUST NOT generate reversal events for chore penalties that were never applied (e.g., chores that were completed incur no penalty, so no penalty reversal event should be created on undo).

### Key Entities

- **Chore (updated)**: Now carries an optional `reward_points` integer (≥ 0) alongside the existing `penalty_points`. Defined at library level, inherited by all kid assignments. Defaults to zero if not set.
- **Point Event (extended)**: Two new event types are added to the existing enumeration: `chore_completion_reward` (generated at End Day for each completed chore with reward > 0) and `chore_completion_reward_reversed` (generated when End Day is undone, one per original reward event, with negative delta).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A parent can configure reward points on a chore in under 30 seconds.
- **SC-002**: A kid's balance reflects earned reward points within 2 seconds of End Day completing.
- **SC-003**: 100% of End Day completions with a non-zero reward produce a corresponding audit log entry — no silent balance changes.
- **SC-004**: Reward events and penalty events are independently distinguishable in the activity log with zero ambiguity.
- **SC-005**: Unchecking a chore before End Day correctly results in no reward — no manual correction needed.

## Assumptions

- Reward points are earned at End Day (when the parent ends the day), mirroring how penalties are assessed at End Day but in positive direction.
- A reward value of zero is treated the same as no reward configured — no event is generated.
- The penalty for incomplete chores at End Day is unaffected by this feature; the two systems are additive and independent.
- Existing chores without a reward value set are treated as having a reward of zero; no migration needed beyond a schema default.
- The chore library edit UI will surface the reward field for all chores regardless of whether they currently have a reward configured.
- Reward values are library-level only; per-kid assignment overrides are out of scope.
- There is no maximum cap on reward point values; any non-negative integer is accepted, consistent with how penalty points work.
- The reward snapshot (captured at day-record creation) is the amount used when granting at End Day, not the live library value at the time of End Day.
