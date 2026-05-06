# Feature Specification: Family Page

**Feature Branch**: `005-kid-comparison`
**Created**: 2026-05-03
**Status**: Draft
**Input**: User description: "Add a Family page that shows all kids in the family with their points, daily progress, and weekly summary"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Kid Views Family Leaderboard (Priority: P1)

A child opens the Family page and sees a leaderboard showing all kids in their family ranked by total points, including themselves.

**Why this priority**: The leaderboard is the core of the Family page. Without it, no family view is possible.

**Independent Test**: Can be tested by logging in as a kid in a family with multiple kids and verifying the leaderboard displays all family members (including self) with their point totals in ranked order.

**Acceptance Scenarios**:

1. **Given** a kid is logged in and belongs to a family with multiple kids, **When** they navigate to the Family page, **Then** a leaderboard is displayed showing all kids in the family ranked by points (highest first), including the logged-in kid
2. **Given** a kid is logged in, **When** they view the leaderboard, **Then** their own entry is visually highlighted so they can quickly find themselves
3. **Given** a family has only one kid, **When** that kid views the Family page, **Then** their own card is displayed (no error message; single-kid families are valid)
4. **Given** a kid is not logged in, **When** they try to access the Family page, **Then** they are redirected to login

---

### User Story 2 - Kid Views Family Daily Chore Progress (Priority: P2)

A child views a daily progress section showing how many chores each kid in the family has completed today, encouraging healthy competition.

**Why this priority**: Daily progress is the most actionable view — it motivates kids to complete their chores "today" by seeing family progress.

**Independent Test**: Can be tested by having multiple kids with chores assigned, some completed, then logging in as one kid and verifying daily completion counts for all family members are shown.

**Acceptance Scenarios**:

1. **Given** a kid views the Family page, **When** daily progress is displayed, **Then** each kid's completed chore count and total chore count for today are shown
2. **Given** a kid has completed all chores today, **When** they view daily progress, **Then** their entry shows a completion indicator
3. **Given** it is a rest day for one kid, **When** viewing daily progress, **Then** that kid's entry indicates rest day status

---

### User Story 3 - Kid Views Weekly Summary (Priority: P3)

A child views a weekly summary showing points earned by each kid in the family over the past 7 days, providing a broader view of effort and consistency.

**Why this priority**: Weekly view adds context beyond a single day, rewarding sustained effort. Lower priority because the daily view and total points already provide meaningful context.

**Independent Test**: Can be tested by having multiple kids with activity log entries over the past week, then verifying the weekly points breakdown is displayed correctly.

**Acceptance Scenarios**:

1. **Given** a kid views the Family page, **When** the weekly summary section is displayed, **Then** each kid's total points earned in the past 7 days are shown
2. **Given** a kid earned the most points this week, **When** viewing the weekly summary, **Then** that kid is displayed at the top or highlighted as the weekly leader

---

### Edge Cases

- What happens when a new kid is added to the family mid-week? (They appear with zero points for the week)
- What happens when a kid has no chores assigned? (They appear with 0/0 chores for the day)
- What happens when all kids have the same points? (All are shown at the same rank position)
- What happens when a kid's day hasn't been ended yet? (Show current progress, not final)
- What happens when a family has only one kid? (Show that kid's card alone; no empty state message)
- What happens when the family lookup fails? (Fall back to showing only the logged-in kid's card)

## Clarifications

### Session 2026-05-03

- Q: How should the system resolve which family a logged-in kid belongs to? → A: Via parent — find the parent whose family the kid belongs to, then query all kids with that `family_id`
- Q: Should this be a sibling comparison page or a Family page showing everyone including self? → A: Family page — shows all kids in the family including the logged-in kid; no "no siblings" empty state
- Q: When the family lookup fails (missing `family_id` or broken parent record), what should the page show? → A: Show the page with only the logged-in kid's own card; treat lookup failure as a single-member family view
- Q: What data fetch strategy should the Family page use? → A: Hybrid — server-render initial data, TanStack Query for real-time updates
- Q: What is the source of truth for daily chore progress on the Family page? → A: Both — `DayRecord` for completed/total chore counts and rest day flag; `ActivityLog` for points earned today
- Q: Should the Family page use a new `/family` route or replace `/compare`? → A: New route `/family`; retire `/compare` with a redirect to `/family`

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display a Family page accessible to authenticated kids
- **FR-002**: System MUST show all kids in the same family on the Family page (including the logged-in kid); family is resolved by finding the parent associated with the logged-in kid's family, then querying all kids with that `family_id`
- **FR-003**: System MUST display each kid's total points on the leaderboard
- **FR-004**: System MUST rank kids by total points in descending order
- **FR-005**: System MUST visually highlight the logged-in kid's entry
- **FR-006**: System MUST show daily chore completion progress (completed/total) and points earned today for each kid; completed/total and rest day status sourced from `DayRecord`, points earned today sourced from `ActivityLog`
- **FR-007**: System MUST show weekly points earned (past 7 days) for each kid
- **FR-008**: System MUST only show kids from the same family (no cross-family data)
- **FR-009**: System MUST display the Family page for all family sizes, including single-child families (no "no siblings" empty state); if the family lookup fails, fall back to showing only the logged-in kid's own card
- **FR-010**: Family page MUST be accessible from the kid navigation at route `/family`; `/compare` MUST redirect to `/family`

### Key Entities

- **Kid**: A child in a family with a name and cumulative points total
- **DayRecord**: A kid's daily record containing chore completions and rest day status
- **ActivityLog**: Event-sourced record of points changes per kid, used for weekly aggregation
- **Family**: Groups kids together; the Family page is scoped to a single family

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Kids can view the Family page and see all family members within 2 seconds (initial data server-rendered; TanStack Query hydrates for real-time updates)
- **SC-002**: 100% of kids in a family appear on the leaderboard with accurate point totals
- **SC-003**: Daily chore progress reflects real-time completion status
- **SC-004**: Weekly points summary accurately reflects the past 7 days of activity
- **SC-005**: The logged-in kid can identify their own position on the leaderboard immediately

## Assumptions

- The existing `kids.points` field is the source of truth for total points (maintained by database trigger on activity_log inserts)
- Activity log entries contain `points_delta` for calculating weekly summaries
- All kids in a family can see each other's names and points (no privacy restrictions between family members)
- The Family page is served at `/family` within the existing kid dashboard navigation; `/compare` redirects to `/family`
- Parents do not need a separate Family page (they already see all kids in the admin panel)
- Family is resolved via parent: the logged-in kid's record links to a parent (via `family_id`), and family members are all kids sharing that `family_id`
