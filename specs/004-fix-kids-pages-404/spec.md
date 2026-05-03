# Feature Specification: Fix Kids Pages 404 and Missing Chores

**Feature Branch**: `004-fix-kids-pages-404`
**Created**: 2026-05-03
**Status**: Draft
**Input**: User description: "kids pages are returning 404 for today, rewards, activity, calendar, etc. Also, the chores assigned are not showing"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Kids Can Access Dashboard Pages (Priority: P1)

A child logs into the app and navigates to their daily chores dashboard, activity log, calendar, and rewards pages without encountering 404 errors.

**Why this priority**: Without accessible pages, the entire kid-facing experience is broken. No other feature matters if pages can't load.

**Independent Test**: Can be tested by logging in as a kid and navigating to each page (/, /activity, /calendar, /rewards) and verifying they render correctly.

**Acceptance Scenarios**:

1. **Given** a kid is logged in, **When** they navigate to the main dashboard (/), **Then** the page loads and displays the daily view
2. **Given** a kid is logged in, **When** they navigate to /activity, **Then** the activity log page loads
3. **Given** a kid is logged in, **When** they navigate to /calendar, **Then** the calendar page loads
4. **Given** a kid is logged in, **When** they navigate to /rewards, **Then** the rewards page loads
5. **Given** a kid is not logged in, **When** they try to access any dashboard page, **Then** they are redirected to login (not a 404)

---

### User Story 2 - Assigned Chores Display on Dashboard (Priority: P1)

A child logs in and sees all chores assigned to them on the daily dashboard, with the ability to mark them as complete.

**Why this priority**: Displaying assigned chores is the core functionality of the app. Without it, kids cannot track or complete their daily tasks.

**Independent Test**: Can be tested by assigning chores to a kid via the admin panel, then logging in as the kid and verifying all assigned chores appear on the dashboard.

**Acceptance Scenarios**:

1. **Given** a kid has chores assigned by a parent, **When** the kid views the dashboard, **Then** all assigned chores are displayed
2. **Given** a kid has chores assigned, **When** viewing the dashboard, **Then** each chore shows its name, penalty, and importance indicator
3. **Given** a kid has no chores assigned, **When** viewing the dashboard, **Then** an appropriate empty state message is shown
4. **Given** a kid has completed all chores, **When** viewing the dashboard, **Then** a completion message is displayed

---

### Edge Cases

- What happens when the database is unreachable? (Graceful error message, not a 404)
- What happens when a kid's session expires mid-use? (Redirect to login)
- What happens when chore assignments are modified while the kid is viewing the dashboard? (Refresh shows updated list)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: All kid dashboard pages (/, /activity, /calendar, /rewards) MUST return HTTP 200 for authenticated kids
- **FR-002**: Dashboard page MUST load and display the day record with chore completions for the current date
- **FR-003**: ChoreList component MUST render all chore assignments for the logged-in kid
- **FR-004**: Navigation between kid pages MUST work without 404 errors
- **FR-005**: Unauthenticated access MUST redirect to login, not show a 404

### Key Entities

- **DayRecord**: Represents a kid's daily record, contains chore completions for a specific date
- **ChoreCompletion**: Individual chore status for a day, linked to a chore assignment
- **ChoreAssignment**: Links a chore to a kid, determines which chores appear on the dashboard

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of kid-facing pages (dashboard, activity, calendar, rewards) load without 404 errors
- **SC-002**: All assigned chores appear on the kid's dashboard when logged in
- **SC-003**: Kids can navigate between all pages using the app navigation without errors
- **SC-004**: Page load completes within 3 seconds on standard connections

## Assumptions

- The routing issue is caused by a code defect, not an infrastructure/deployment problem
- The existing Supabase database schema and data are intact
- The authentication flow (kid login) is working correctly
- The (dashboard) route group layout and page files exist but may have rendering or data-fetching issues
- The chore assignment data exists in the database but may not be queried or displayed correctly
