# Feature Specification: Long PWA Session Duration

**Feature Branch**: `006-long-session-duration`
**Created**: 2026-05-06
**Status**: Draft
**Input**: User description: "Since this is a PWA, sessions should be long before signing out the user. Keep the session up to 1 year before logging out the user"

## Clarifications

### Session 2026-05-06

- Q: Can a single user account be logged in on multiple devices simultaneously? → A: Yes — multiple concurrent sessions allowed per account.
- Q: Should users receive a warning before their 1-year session expires? → A: Yes — show an in-app warning before expiry (e.g., 30 days before).
- Q: What happens to a session when the user uninstalls and reinstalls the PWA? → A: Session resets on uninstall + reinstall (user must log in again). App updates/new version deployments do NOT count as reinstalls and must not reset the session.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Stay Logged In Across Extended Periods (Priority: P1)

A parent or child installs the PWA on their device and uses it regularly. They expect to remain logged in without being prompted to sign in again, even if they don't open the app for days or weeks at a time.

**Why this priority**: This is the core value of the feature. Frequent re-authentication is a major friction point for PWA users, and maintaining session continuity is essential for a smooth daily-use experience.

**Independent Test**: Can be tested by logging in, closing the app for an extended period, reopening, and verifying the user is still authenticated without needing to sign in again.

**Acceptance Scenarios**:

1. **Given** a user has logged in to the PWA, **When** they close the app and reopen it the next day, **Then** they are still logged in without being prompted to authenticate.
2. **Given** a user has logged in to the PWA, **When** they haven't opened the app for 30 days, **Then** they are still logged in and can continue using the app.
3. **Given** a user has logged in to the PWA, **When** less than 1 year has elapsed since login, **Then** they are never automatically signed out due to session expiry.
4. **Given** a user is logged in on their phone, **When** they also log in on their tablet, **Then** both sessions remain active independently.

---

### User Story 2 - Session Expiry After 1 Year (Priority: P2)

After 1 year since the session was created, the user is automatically signed out for security purposes and must log in again.

**Why this priority**: Security requires eventual session expiry. This bounds the session lifetime while still providing a generous window for regular PWA users.

**Independent Test**: Can be tested by simulating a session age of 1 year and verifying the user is prompted to re-authenticate on next app open.

**Acceptance Scenarios**:

1. **Given** a user's session is exactly 1 year old, **When** they open the app, **Then** they are signed out and prompted to log in again.
2. **Given** a user's session has exceeded 1 year, **When** they open the app, **Then** they see a friendly message explaining their session expired and are directed to log in.

---

### User Story 3 - Pre-Expiry Warning (Priority: P2)

Users are notified within the app approximately 30 days before their session is due to expire, giving them a chance to acknowledge the upcoming expiry and re-authenticate proactively if desired.

**Why this priority**: Prevents surprise sign-outs and reduces support burden. Users deserve advance notice before losing their session.

**Independent Test**: Can be tested by simulating a session approaching 1 year and verifying the warning appears in-app at the correct threshold.

**Acceptance Scenarios**:

1. **Given** a user's session will expire in 30 days, **When** they open the app, **Then** they see an in-app notification informing them their session will expire soon.
2. **Given** a user sees the expiry warning, **When** they take no action, **Then** the warning continues to appear on subsequent app opens until expiry.
3. **Given** a user sees the expiry warning, **When** they choose to re-authenticate, **Then** a fresh 1-year session is issued and the warning is dismissed.

---

### User Story 4 - Seamless Re-authentication After Expiry (Priority: P3)

When a session has expired, the user is presented with a clear and friendly sign-in prompt rather than a confusing error, and they can log in and pick up where they left off.

**Why this priority**: Ensures the expiry experience is not disruptive and maintains user trust.

**Independent Test**: Can be tested by triggering session expiry and verifying the login flow is smooth with appropriate messaging.

**Acceptance Scenarios**:

1. **Given** a user's session has expired, **When** they open the app, **Then** they see a clear message that their session has ended and are shown the login screen.
2. **Given** a user re-authenticates after session expiry, **When** login is successful, **Then** they are taken directly back into the app without losing context.

---

### Edge Cases

- What happens when the user's device clock is significantly ahead or behind the server clock?
- When a user uninstalls and reinstalls the PWA, their session is cleared and they must log in again.
- App updates and new version deployments do not clear the session; users remain logged in across updates.
- What happens if the user logs out manually before the 1-year expiry?
- How does session duration interact with password change or account deactivation events?
- If a user has multiple active sessions and logs out on one device, only that device's session is invalidated; other sessions remain active.
- If a user re-authenticates in response to a pre-expiry warning, the old session is replaced and the 30-day warning resets.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST maintain an authenticated user session for up to 1 year from the time of login without requiring re-authentication.
- **FR-002**: System MUST automatically sign out users whose session has reached or exceeded 1 year in age.
- **FR-003**: System MUST display a clear, user-friendly message when a session expires and prompt the user to log in again.
- **FR-004**: System MUST invalidate the existing session immediately when a user manually logs out, regardless of session age.
- **FR-005**: System MUST invalidate all active sessions for a user if their account is deactivated or their password is changed, regardless of session age.
- **FR-006**: System MUST issue a fresh 1-year session upon successful re-authentication after expiry or in response to a pre-expiry warning.
- **FR-007**: System MUST allow a single user account to maintain multiple independent concurrent sessions across different devices or installs.
- **FR-008**: System MUST invalidate only the session on the device from which the user logs out; other concurrent sessions on other devices MUST remain active.
- **FR-009**: System MUST display an in-app warning to the user when their session is within 30 days of expiry.
- **FR-010**: The pre-expiry warning MUST offer the user the option to re-authenticate immediately to extend their session by another year.
- **FR-011**: System MUST clear the session when a user uninstalls the PWA; the user MUST be required to log in again after reinstalling.
- **FR-012**: System MUST preserve an active session across app version updates; a new deployment MUST NOT sign users out.

### Key Entities

- **Session**: Represents an authenticated user's active login on a specific device/install, with a creation timestamp and a maximum lifetime of 1 year. Multiple sessions may exist per user account simultaneously.
- **User**: The authenticated person (parent or child) whose session is being managed.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Authenticated users are never involuntarily signed out within 1 year of their login.
- **SC-002**: 100% of sessions older than 1 year result in automatic sign-out on the next app access.
- **SC-003**: Users who are signed out due to session expiry can successfully re-authenticate within 1 minute.
- **SC-004**: Session expiry messages are understood by users — fewer than 5% of expiry events result in a support request.
- **SC-005**: Logging out on one device does not sign the user out on any other concurrently active device.
- **SC-006**: 100% of sessions within 30 days of expiry display a pre-expiry warning on the next app open.

## Assumptions

- The 1-year session duration is measured from the time of login (session creation), not from the last activity.
- Users are considered to have consented to long-lived sessions by choosing to use the PWA and staying logged in.
- The app already has an authentication system in place; this feature extends the session lifetime rather than introducing auth from scratch.
- Manual logout always clears only the session on the device used to log out; all other sessions remain valid.
- Security-critical events (password change, account deactivation) override the session duration and trigger immediate sign-out across all active sessions.
- Each device/install maintains its own independent session; cross-device session sharing is not in scope.
- Uninstalling the PWA clears the session for that install; the user must log in again after reinstalling.
- App updates (new version deployments) are not treated as reinstalls; sessions MUST persist through version updates.
- The pre-expiry warning threshold is 30 days before session expiry; this is a reasonable default and can be adjusted post-launch.
