# Feature Specification: Fix Kids Pages 404 and Missing Chores

**Feature Branch**: `004-fix-kids-pages-404`
**Created**: 2026-05-03
**Status**: Draft
**Input**: User description: "kids pages are returning 404 for today, rewards, activity, calendar, etc. Also, the chores assigned are not showing. Activity log shows adjustments for other kids. Calendar page navigation fails. Today page always shows 'No chores assigned!'"

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

### User Story 3 - Activity Log Shows Only Own Activity (Priority: P1)

A child views the activity log and sees only their own activity entries, not those of other kids in the family.

**Why this priority**: Showing other kids' point adjustments leaks private data between siblings and causes confusion.

**Independent Test**: Can be tested by having multiple kids in a family with activity, then logging in as one kid and verifying only their entries appear.

**Acceptance Scenarios**:

1. **Given** a kid is logged in, **When** they view the activity log, **Then** only their own activity entries are displayed
2. **Given** a parent is logged in, **When** they view the activity log, **Then** all family activity entries are displayed

---

### User Story 4 - Calendar Date Navigation Works (Priority: P1)

A child clicks a date on the calendar page and is taken to the dashboard view for that specific date.

**Why this priority**: Calendar navigation is a core feature allowing kids to review past days.

**Independent Test**: Can be tested by navigating to the calendar page, clicking a date, and verifying the dashboard loads for that date.

**Acceptance Scenarios**:

1. **Given** a kid is on the calendar page, **When** they click a date, **Then** the dashboard loads showing that date's chores
2. **Given** a kid clicks a past date with a completed day, **When** the dashboard loads, **Then** the chore completions for that date are shown

---

### User Story 5 - Chores Appear After Late Assignment (Priority: P1)

A child sees newly assigned chores on the dashboard even if chores were assigned after the kid first visited the dashboard that day.

**Why this priority**: Parents commonly assign chores after the kid has already logged in. Without this fix, kids never see new chores for the current day.

**Independent Test**: Can be tested by creating a kid, having them visit the dashboard (creating an empty day record), then assigning chores via admin, and refreshing the dashboard.

**Acceptance Scenarios**:

1. **Given** a day record exists with no completions, **When** chores are assigned and the kid refreshes, **Then** the newly assigned chores appear
2. **Given** a day record exists with some completions, **When** new chores are assigned, **Then** only the new chores are added (existing completions preserved)

---

### User Story 6 - Chore Checkbox Renders Without Duplication (Priority: P1)

Each chore on the dashboard displays a single checkbox control, not a duplicate.

**Why this priority**: A duplicate checkbox is confusing and makes the UI look broken.

**Independent Test**: Can be tested by logging in as a kid with assigned chores and verifying each chore row shows exactly one checkbox.

**Acceptance Scenarios**:

1. **Given** a kid views the dashboard with chores, **When** each chore item renders, **Then** only one checkbox control is visible per chore
2. **Given** a kid clicks the checkbox, **When** the chore toggles, **Then** no additional checkbox appears

---

### Edge Cases

- What happens when the database is unreachable? (Graceful error message, not a 404)
- What happens when a kid's session expires mid-use? (Redirect to login)
- What happens when chore assignments are modified while the kid is viewing the dashboard? (Refresh shows updated list)
- What happens when a chore is unassigned after the day record was seeded? (Existing completion remains for that day)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: All kid dashboard pages (/, /activity, /calendar, /rewards) MUST return HTTP 200 for authenticated kids
- **FR-002**: Dashboard page MUST load and display the day record with chore completions for the current date
- **FR-003**: ChoreList component MUST render all chore assignments for the logged-in kid
- **FR-004**: Navigation between kid pages MUST work without 404 errors
- **FR-005**: Unauthenticated access MUST redirect to login, not show a 404
- **FR-006**: Activity log MUST filter entries by the logged-in kid's ID when viewed by a kid
- **FR-007**: Calendar date selection MUST navigate to the correct dashboard URL
- **FR-008**: Day record loading MUST backfill completions for assignments added after the day record was created
- **FR-009**: Checkbox component MUST render only one visible checkbox control per chore item (hide the native input rendered by base-ui)

### Key Entities

- **DayRecord**: Represents a kid's daily record, contains chore completions for a specific date
- **ChoreCompletion**: Individual chore status for a day, linked to a chore assignment
- **ChoreAssignment**: Links a chore to a kid, determines which chores appear on the dashboard

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of kid-facing pages (dashboard, activity, calendar, rewards) load without 404 errors
- **SC-002**: All assigned chores appear on the kid's dashboard when logged in, including chores assigned after the day record was created
- **SC-003**: Kids can navigate between all pages using the app navigation without errors
- **SC-004**: Page load completes within 3 seconds on standard connections
- **SC-005**: Kids see only their own activity in the activity log
- **SC-006**: Calendar date clicks navigate to the correct dashboard view for that date
- **SC-007**: Each chore item displays exactly one checkbox control

## Clarifications

### Session 2026-05-03

- Q: What does "duplicate checkbox" mean on today's chores? → A: The base-ui Checkbox renders both a styled span and a native `<input>`. CSP nonce blocks the inline styles that hide the input, making both visible. Fixed by adding `[&_input]:sr-only` CSS class to the Checkbox component.

## Assumptions

- The routing issue is caused by a code defect, not an infrastructure/deployment problem
- The existing Supabase database schema and data are intact
- The authentication flow (kid login) is working correctly
- The (dashboard) route group layout and page files exist but may have rendering or data-fetching issues
- The chore assignment data exists in the database but may not be queried or displayed correctly
