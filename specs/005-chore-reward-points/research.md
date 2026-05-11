# Research: Chore Completion Reward Points

## Decision: Rewards granted at End Day, not on toggle

- **Decision**: Grant reward points during the `endDay` Server Action, not when a kid toggles a chore.
- **Rationale**: Spec clarification (2026-05-07) explicitly states rewards are granted at End Day only, mirroring how penalties work. The `endDay` action already iterates `chore_completions` to calculate `calculatePenalties`; reward calculation follows the exact same pattern.
- **Alternatives considered**: Grant on toggle (rejected per clarification); grant via a separate server action (rejected — no meaningful boundary; End Day is the natural moment).

## Decision: No reversal event type needed

- **Decision**: `chore_completion_reward_reversed` event type is not needed.
- **Rationale**: Since rewards are only granted at End Day (after the day is locked), unchecking a chore before End Day simply means the chore is incomplete — no reward is ever granted, so nothing to reverse. This significantly simplifies `toggleChore` (no reward logic needed there at all).
- **Alternatives considered**: Reversal event (rejected — reward never credited on toggle, so reversal is meaningless).

## Decision: reward_snapshot stored in chore_completions

- **Decision**: Add `reward_snapshot integer NOT NULL DEFAULT 0` to `chore_completions`, captured at day-record creation alongside `penalty_snapshot`.
- **Rationale**: The snapshot pattern is already established for `penalty_snapshot` and `chore_name_snapshot`. Snapshotting at day creation means the reward granted at End Day reflects the library value that was in effect when the day started — consistent with spec edge case ("reward is not retroactively adjusted if library value changes during the day").
- **Alternatives considered**: Read `reward_points` live from `chores` table at End Day (rejected — if the parent edits the reward value mid-day, End Day would grant the new value, not the day-start value, contradicting the snapshot contract).

## Decision: One chore_completion_reward event per completed chore with reward > 0

- **Decision**: Insert one `chore_completion_reward` activity log entry per completed chore that has `reward_snapshot > 0` at End Day.
- **Rationale**: Spec clarification (2026-05-07) explicitly chose per-chore granularity for richer audit log visibility (parent can see exactly which chores earned how many points). Consistent with how `effort_awarded` is one event, not a batch.
- **Alternatives considered**: Single aggregate reward event summing all chores (rejected per clarification — obscures per-chore attribution).

## Decision: Activity log trigger handles balance recalculation automatically

- **Decision**: No explicit `kids.points` update in `endDay` for rewards — the existing `after_activity_log_insert` trigger (`recalculate_kid_points`) handles it for any inserted `activity_log` row with a non-null `points_delta`.
- **Rationale**: Migration `0006_event_sourcing.sql` already set this up for all event types. Each `chore_completion_reward` row inserted will fire the trigger, keeping the balance event-sourced.
- **Alternatives considered**: Manual balance update in `endDay` (rejected — bypasses event sourcing, risks drift).

## Decision: EffortDropdown UUID display fix — derive label from effortLevels prop

- **Decision**: Fix `EffortDropdown` by looking up the selected `EffortLevel` object from the `effortLevels` prop using the current `value` UUID and rendering the label as children of `SelectValue`, rather than relying on Base UI's internal label-resolution mechanism.
- **Rationale**: `components/ui/select.tsx` wraps `@base-ui/react/select` (Base UI v1), not Radix UI. Base UI's `Select.Value` populates its display label from an internal context that is only updated when the user interacts with a rendered popup. In controlled mode (`value` set externally via `useState`), no popup has been opened, so Base UI has no label in context and falls back to rendering the raw value string (the UUID). The fix bypasses this mechanism entirely: `effortLevels.find(l => l.id === value)` always resolves the label correctly from props, with no dependency on popup rendering state.
- **Alternatives considered**: Switching `Select.Root` value type to the full `EffortLevel` object (rejected — requires changes to `EndDayButton` state type and `endDay` Server Action signature); using uncontrolled Select with `defaultValue` (rejected — would lose the ability to read `selectedEffort` in `handleConfirm`).

## Decision: Reward badge visible on both completed and uncompleted tiles

- **Decision**: Show `+N pts` badge on both completed and uncompleted chore tiles when `reward_snapshot > 0`.
- **Rationale**: Spec clarification (2026-05-07) chose this. Since rewards are now deferred to End Day (not immediate), a completed tile with no reward badge would leave kids wondering why their balance hasn't changed. Showing it on the completed tile confirms the reward is queued.
- **Alternatives considered**: Show only on uncompleted (motivation only, hide on complete) — rejected per clarification.
