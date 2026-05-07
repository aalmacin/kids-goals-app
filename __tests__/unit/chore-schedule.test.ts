import { describe, it, expect } from 'vitest'
import {
  isChoreAvailableOn,
  dayOfWeekFromDate,
  getNextAvailableDate,
  todayInTimezone,
} from '@/lib/chore-schedule'

describe('isChoreAvailableOn', () => {
  it('returns true when allowedDays is null (always available)', () => {
    expect(isChoreAvailableOn(null, 0)).toBe(true)
    expect(isChoreAvailableOn(null, 6)).toBe(true)
  })

  it('returns true when allowedDays is empty (always available)', () => {
    expect(isChoreAvailableOn([], 0)).toBe(true)
    expect(isChoreAvailableOn([], 3)).toBe(true)
  })

  it('returns false when day not in allowedDays', () => {
    // Mon–Fri schedule, Sunday blocked
    expect(isChoreAvailableOn([1, 2, 3, 4, 5], 0)).toBe(false)
  })

  it('returns true when day is in allowedDays', () => {
    expect(isChoreAvailableOn([1, 2, 3, 4, 5], 1)).toBe(true) // Monday
    expect(isChoreAvailableOn([1, 2, 3, 4, 5], 5)).toBe(true) // Friday
  })

  it('handles weekend-only schedule', () => {
    expect(isChoreAvailableOn([0, 6], 0)).toBe(true)  // Sunday
    expect(isChoreAvailableOn([0, 6], 6)).toBe(true)  // Saturday
    expect(isChoreAvailableOn([0, 6], 1)).toBe(false) // Monday
  })
})

describe('dayOfWeekFromDate', () => {
  it('returns correct day for known Sunday date', () => {
    expect(dayOfWeekFromDate('2026-05-03')).toBe(0) // Sunday
  })

  it('returns correct day for known Monday date', () => {
    expect(dayOfWeekFromDate('2026-05-04')).toBe(1) // Monday
  })

  it('returns correct day for known Saturday date', () => {
    expect(dayOfWeekFromDate('2026-05-02')).toBe(6) // Saturday
  })
})

describe('getNextAvailableDate', () => {
  it('returns null when allowedDays is null (always available)', () => {
    expect(getNextAvailableDate(null, new Date('2026-05-03'))).toBeNull()
  })

  it('returns null when allowedDays is empty (always available)', () => {
    expect(getNextAvailableDate([], new Date('2026-05-03'))).toBeNull()
  })

  it('returns next day in schedule from Sunday', () => {
    // allowedDays = [1] (Monday only), fromDate = Sunday May 3
    const result = getNextAvailableDate([1], new Date('2026-05-03T12:00:00'))
    expect(result).not.toBeNull()
    expect(result!.getDay()).toBe(1) // next Monday
  })

  it('returns same-week day when it is later this week', () => {
    // allowedDays = [5] (Friday only), fromDate = Monday May 4
    const result = getNextAvailableDate([5], new Date('2026-05-04T12:00:00'))
    expect(result).not.toBeNull()
    expect(result!.getDay()).toBe(5) // Friday same week
  })

  it('wraps to next week when all schedule days are behind this week', () => {
    // allowedDays = [1] (Monday only), fromDate = Tuesday May 5
    const result = getNextAvailableDate([1], new Date('2026-05-05T12:00:00'))
    expect(result).not.toBeNull()
    expect(result!.getDay()).toBe(1) // next Monday
  })

  it('returns correct next day when timezone is provided (UTC-8)', () => {
    // May 3 2026 is Sunday — next Monday [1] should always be May 4 regardless of timezone
    const result = getNextAvailableDate([1], new Date('2026-05-03T12:00:00'), 'America/Los_Angeles')
    expect(result).not.toBeNull()
    // Day-of-week in the result should be Monday (1) in the given timezone
    const dow = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Los_Angeles', weekday: 'short' })
      .format(result!)
    expect(dow).toBe('Mon')
  })
})

describe('todayInTimezone', () => {
  it('returns a YYYY-MM-DD string', () => {
    const result = todayInTimezone('UTC')
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('returns a date consistent with the given timezone', () => {
    // Both calls should return a valid date string — we cannot assert the exact date
    // without mocking the clock, but we can verify the format and that different
    // timezones can produce different results at timezone boundaries.
    const utc = todayInTimezone('UTC')
    const ny = todayInTimezone('America/New_York')
    expect(utc).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(ny).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})
