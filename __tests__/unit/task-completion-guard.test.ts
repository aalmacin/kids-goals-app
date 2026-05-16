import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { getTodayStart } from '@/lib/db/tasks'

// Pure logic extracted from completeTaskAction for unit testing
function checkTaskAvailability(
  taskType: 'one_time' | 'repeated',
  maxCompletions: number | null,
  completionCount: number,
  oncePerDay: boolean = false,
  todayCount: number = 0
): { available: boolean; reason?: string } {
  if (taskType === 'one_time' && completionCount > 0) {
    return { available: false, reason: 'Task already completed' }
  }
  if (taskType === 'repeated' && oncePerDay && todayCount > 0) {
    return { available: false, reason: 'Task already completed today' }
  }
  if (taskType === 'repeated' && maxCompletions !== null && completionCount >= maxCompletions) {
    return { available: false, reason: 'Task completion limit reached' }
  }
  return { available: true }
}

// Pure logic for undo validation
function checkUndoAvailability(
  taskType: 'one_time' | 'repeated',
  todayCount: number
): { available: boolean; reason?: string } {
  if (taskType === 'one_time') {
    return { available: false, reason: 'Cannot undo one-time task' }
  }
  if (todayCount === 0) {
    return { available: false, reason: 'No completion to undo today' }
  }
  return { available: true }
}

describe('checkTaskAvailability — one_time tasks', () => {
  it('is available when completion count is 0', () => {
    expect(checkTaskAvailability('one_time', null, 0)).toEqual({ available: true })
  })

  it('is unavailable when completion count is 1', () => {
    expect(checkTaskAvailability('one_time', null, 1)).toEqual({
      available: false,
      reason: 'Task already completed',
    })
  })

  it('is unavailable for any completion count > 0', () => {
    expect(checkTaskAvailability('one_time', null, 5)).toEqual({
      available: false,
      reason: 'Task already completed',
    })
  })
})

describe('checkTaskAvailability — repeated tasks (unlimited)', () => {
  it('is available when completion count is 0', () => {
    expect(checkTaskAvailability('repeated', null, 0)).toEqual({ available: true })
  })

  it('is always available regardless of high completion count', () => {
    expect(checkTaskAvailability('repeated', null, 100)).toEqual({ available: true })
  })
})

describe('checkTaskAvailability — repeated tasks (with limit)', () => {
  it('is available when below limit', () => {
    expect(checkTaskAvailability('repeated', 3, 0)).toEqual({ available: true })
    expect(checkTaskAvailability('repeated', 3, 2)).toEqual({ available: true })
  })

  it('is unavailable when at limit', () => {
    expect(checkTaskAvailability('repeated', 3, 3)).toEqual({
      available: false,
      reason: 'Task completion limit reached',
    })
  })

  it('is unavailable when above limit', () => {
    expect(checkTaskAvailability('repeated', 3, 5)).toEqual({
      available: false,
      reason: 'Task completion limit reached',
    })
  })

  it('is unavailable when limit is 1 and already completed once', () => {
    expect(checkTaskAvailability('repeated', 1, 1)).toEqual({
      available: false,
      reason: 'Task completion limit reached',
    })
  })
})

describe('checkTaskAvailability — once_per_day tasks', () => {
  it('is available when todayCount is 0', () => {
    expect(checkTaskAvailability('repeated', null, 0, true, 0)).toEqual({ available: true })
  })

  it('is unavailable when todayCount > 0', () => {
    expect(checkTaskAvailability('repeated', null, 1, true, 1)).toEqual({
      available: false,
      reason: 'Task already completed today',
    })
  })

  it('once_per_day takes priority over max_completions check', () => {
    // Even if max_completions not reached, once_per_day blocks if done today
    expect(checkTaskAvailability('repeated', 10, 1, true, 1)).toEqual({
      available: false,
      reason: 'Task already completed today',
    })
  })

  it('does not apply once_per_day to one_time tasks', () => {
    // one_time tasks use their own guard; oncePerDay flag is irrelevant
    expect(checkTaskAvailability('one_time', null, 0, true, 0)).toEqual({ available: true })
  })
})

describe('checkUndoAvailability', () => {
  it('allows undo for repeated task with todayCount > 0', () => {
    expect(checkUndoAvailability('repeated', 1)).toEqual({ available: true })
    expect(checkUndoAvailability('repeated', 5)).toEqual({ available: true })
  })

  it('rejects undo for one_time task', () => {
    expect(checkUndoAvailability('one_time', 1)).toEqual({
      available: false,
      reason: 'Cannot undo one-time task',
    })
  })

  it('rejects undo when no same-day completion exists', () => {
    expect(checkUndoAvailability('repeated', 0)).toEqual({
      available: false,
      reason: 'No completion to undo today',
    })
  })
})

// Set noon UTC on a known date so local-date calculations are stable across timezones
const FIXED_NOW = '2026-05-15T12:00:00Z'

describe('getTodayStart — timezone boundary correctness', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(FIXED_NOW))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns midnight UTC for the UTC timezone', () => {
    expect(getTodayStart('UTC').toISOString()).toBe('2026-05-15T00:00:00.000Z')
  })

  it('returns correct midnight for negative offset (America/New_York, EDT -04:00)', () => {
    // Noon UTC on May 15 = 8 AM in New York (EDT) → local date May 15
    // Midnight May 15 in New York (UTC-4) = 04:00 UTC
    expect(getTodayStart('America/New_York').toISOString()).toBe('2026-05-15T04:00:00.000Z')
  })

  it('returns correct midnight for positive offset (Asia/Kolkata, IST +05:30)', () => {
    // Noon UTC on May 15 = 5:30 PM in Kolkata (IST) → local date May 15
    // Midnight May 15 in Kolkata (UTC+5:30) = May 14 18:30 UTC
    expect(getTodayStart('Asia/Kolkata').toISOString()).toBe('2026-05-14T18:30:00.000Z')
  })

  it('returns correct midnight for whole positive offset (Asia/Tokyo, JST +09:00)', () => {
    // Noon UTC on May 15 = 9 PM in Tokyo (JST) → local date May 15
    // Midnight May 15 in Tokyo (UTC+9) = May 14 15:00 UTC
    expect(getTodayStart('Asia/Tokyo').toISOString()).toBe('2026-05-14T15:00:00.000Z')
  })

  it('treats a completion from yesterday (local time) as not today', () => {
    // In New York (EDT, UTC-4): midnight May 15 = 04:00 UTC
    // Completion at 11 PM May 14 in New York = 03:00 UTC on May 15
    const todayStart = getTodayStart('America/New_York')
    const yesterdayLocalCompletion = new Date('2026-05-15T03:00:00Z')
    expect(yesterdayLocalCompletion < todayStart).toBe(true)
  })

  it('treats a completion from today (local time) as today', () => {
    // In New York (EDT, UTC-4): midnight May 15 = 04:00 UTC
    // Completion at 1 AM May 15 in New York = 05:00 UTC on May 15
    const todayStart = getTodayStart('America/New_York')
    const todayLocalCompletion = new Date('2026-05-15T05:00:00Z')
    expect(todayLocalCompletion >= todayStart).toBe(true)
  })
})
