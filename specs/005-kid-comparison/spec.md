# Feature Specification: Kid Comparison

**Feature Branch**: `005-kid-comparison`
**Created**: 2026-05-03
**Status**: Draft
**Input**: User description: "Add ability for kids to compare their changes with other kids in the same family"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Kid Views Family Leaderboard (Priority: P1)

A child opens the comparison page and sees a leaderboard showing all kids in their family ranked by total points, so they can see where they stand relative to their siblings.

**Why this priority**: The leaderboard is the core comparison feature. Without it, no comparison is possible.

**Independent Test**: Can be tested by logging in as a kid in a family with multiple kids and verifying the leaderboard displays all siblings with their point totals in ranked order.

**Acceptance Scenarios**:

1. **Given** a kid is logged in and belongs to a family with multiple kids, **When** they navigate to the comparison page, **Then** a leaderboard is displayed showing all kids in the family ranked by points (highest first)
2. **Given** a kid is logged in, **When** they view the leaderboard, **Then** their own entry is visually highlighted so they can quickly find themselves
3. **Given** a family has only one kid, **When** that kid views the comparison page, **Then** a message indicates there are no siblings to compare with
4. **Given** a kid is not logged in, **When** they try to access the comparison page, **Then** they are redirected to login

---

### User Story 2 - Kid Compares Daily Chore Progress (Priority: P2)

A child views a daily progress comparison showing how many chores each kid in the family has completed today, encouraging healthy competition.

**Why this priority**: Daily progress is the most actionable comparison — it motivates kids to complete their chores "today" by seeing sibling progress.

**Independent Test**: Can be tested by having multiple kids with chores assigned, some completed, then logging in as one kid and verifying daily completion counts for all siblings are shown.

**Acceptance Scenarios**:

1. **Given** a kid views the comparison page, **When** daily progress is displayed, **Then** each kid's completed chore count and total chore count for today are shown
2. **Given** a kid has completed all chores today, **When** they view daily progress, **Then** their entry shows a completion indicator
3. **Given** it is a rest day for one kid, **When** viewing daily progress, **Then** that kid's entry indicates rest day status

---

### User Story 3 - Kid Views Weekly Summary Comparison (Priority: P3)

A child views a weekly summary showing points earned by each kid in the family over the past 7 days, providing a broader view of effort and consistency.

**Why this priority**: Weekly view adds context beyond a single day, rewarding sustained effort. Lower priority because the daily view and total points already provide meaningful comparison.

**Independent Test**: Can be tested by having multiple kids with activity log entries over the past week, then verifying the weekly points breakdown is displayed correctly.

**Acceptance Scenarios**:

1. **Given** a kid views the comparison page, **When** the weekly summary section is displayed, **Then** each kid's total points earned in the past 7 days are shown
2. **Given** a kid earned the most points this week, **When** viewing the weekly summary, **Then** that kid is displayed at the top or highlighted as the weekly leader

---

### Edge Cases

- What happens when a new kid is added to the family mid-week? (They appear with zero points for the week)
- What happens when a kid has no chores assigned? (They appear with 0/0 chores for the day)
- What happens when all kids have the same points? (All are shown at the same rank position)
- What happens when a kid's day hasn't been ended yet? (Show current progress, not final)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display a comparison page accessible to authenticated kids
- **FR-002**: System MUST show all kids in the same family on the comparison page
- **FR-003**: System MUST display each kid's total points on the leaderboard
- **FR-004**: System MUST rank kids by total points in descending order
- **FR-005**: System MUST visually highlight the logged-in kid's entry
- **FR-006**: System MUST show daily chore completion progress (completed/total) for each kid
- **FR-007**: System MUST show weekly points earned (past 7 days) for each kid
- **FR-008**: System MUST only show kids from the same family (no cross-family data)
- **FR-009**: System MUST handle single-child families gracefully with an appropriate message
- **FR-010**: Comparison page MUST be accessible from the kid navigation

### Key Entities

- **Kid**: A child in a family with a name and cumulative points total
- **DayRecord**: A kid's daily record containing chore completions and rest day status
- **ActivityLog**: Event-sourced record of points changes per kid, used for weekly aggregation
- **Family**: Groups kids together; comparison is scoped to a single family

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Kids can view the comparison page and see all siblings within 2 seconds
- **SC-002**: 100% of kids in a family appear on the leaderboard with accurate point totals
- **SC-003**: Daily chore progress reflects real-time completion status
- **SC-004**: Weekly points summary accurately reflects the past 7 days of activity
- **SC-005**: The logged-in kid can identify their own position on the leaderboard immediately

## Assumptions

- The existing `kids.points` field is the source of truth for total points (maintained by database trigger on activity_log inserts)
- Activity log entries contain `points_delta` for calculating weekly summaries
- All kids in a family can see each other's names and points (no privacy restrictions between siblings)
- The comparison page is a new route within the existing kid dashboard navigation
- Parents do not need a separate comparison view (they already see all kids in the admin panel)
