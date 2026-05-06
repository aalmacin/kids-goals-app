/**
 * Returns true if the chore is available on the given day of week.
 * A null or empty allowedDays means the chore is available every day.
 */
export function isChoreAvailableOn(
  allowedDays: number[] | null,
  dayOfWeek: number
): boolean {
  if (!allowedDays || allowedDays.length === 0) return true
  return allowedDays.includes(dayOfWeek)
}

/**
 * Extracts the day of week (0=Sun...6=Sat) from an ISO date string 'YYYY-MM-DD'.
 * The date string is treated as a local date, not UTC.
 */
export function dayOfWeekFromDate(date: string): number {
  const [year, month, day] = date.split('-').map(Number)
  return new Date(year, month - 1, day).getDay()
}

/**
 * Returns the next Date on which the chore is available, starting from the day
 * after fromDate. Returns null if allowedDays is null or empty (always available).
 */
export function getNextAvailableDate(
  allowedDays: number[] | null,
  fromDate: Date
): Date | null {
  if (!allowedDays || allowedDays.length === 0) return null

  const next = new Date(fromDate)
  for (let i = 1; i <= 7; i++) {
    next.setDate(fromDate.getDate() + i)
    if (allowedDays.includes(next.getDay())) return next
  }
  // Should never reach here if allowedDays is non-empty
  return null
}
