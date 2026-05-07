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
 * Returns today's date as 'YYYY-MM-DD' in the given IANA timezone.
 * Prevents UTC date drift for families in non-UTC timezones.
 */
export function todayInTimezone(timezone: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function dayOfWeekInTimezone(date: Date, timezone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    weekday: 'short',
  }).formatToParts(date)
  const weekday = parts.find((p) => p.type === 'weekday')?.value ?? ''
  return WEEKDAY_LABELS.indexOf(weekday)
}

/**
 * Returns the next Date on which the chore is available, starting from the day
 * after fromDate. Returns null if allowedDays is null or empty (always available).
 * Pass the family's IANA timezone to ensure day-of-week is computed in their local time.
 */
export function getNextAvailableDate(
  allowedDays: number[] | null,
  fromDate: Date,
  timezone?: string
): Date | null {
  if (!allowedDays || allowedDays.length === 0) return null

  const next = new Date(fromDate)
  for (let i = 1; i <= 7; i++) {
    next.setDate(fromDate.getDate() + i)
    const dow = timezone ? dayOfWeekInTimezone(next, timezone) : next.getDay()
    if (allowedDays.includes(dow)) return next
  }
  // Should never reach here if allowedDays is non-empty
  return null
}
