export const EXPIRY_DAYS = 365
export const WARNING_DAYS = 30

const MS_PER_DAY = 1000 * 60 * 60 * 24

export function calculateDaysRemaining(sessionStartedAt: number): number {
  const ageMs = Date.now() - sessionStartedAt
  const ageDays = ageMs / MS_PER_DAY
  return EXPIRY_DAYS - ageDays
}

export function isSessionExpiring(sessionStartedAt: number): boolean {
  return calculateDaysRemaining(sessionStartedAt) <= WARNING_DAYS
}
