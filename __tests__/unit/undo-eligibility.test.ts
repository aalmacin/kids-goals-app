import { describe, it, expect } from 'vitest'
import { canUndoEndDay, canUndoRestDay, canUncheckChore } from '@/lib/undo-eligibility'
import type { DayRecord, ChoreCompletion } from '@/lib/types'

const baseDayRecord: DayRecord = {
  id: 'dr-1',
  kidId: 'kid-1',
  date: '2026-05-15',
  isRestDay: false,
  effortLevelId: null,
  endedAt: null,
  undoEndCount: 0,
  undoRestDayCount: 0,
  choreCompletions: [],
}

const baseCompletion: ChoreCompletion = {
  id: 'cc-1',
  dayRecordId: 'dr-1',
  choreAssignmentId: 'ca-1',
  choreNameSnapshot: 'Dishes',
  penaltySnapshot: 5,
  isImportantSnapshot: false,
  rewardSnapshot: 10,
  completedAt: '2026-05-15T10:00:00Z',
  uncheckCount: 0,
}

describe('canUndoEndDay', () => {
  const today = '2026-05-15'

  it('returns true when ended, count is 0, and date is today', () => {
    const dr = { ...baseDayRecord, endedAt: '2026-05-15T18:00:00Z' }
    expect(canUndoEndDay(dr, today)).toBe(true)
  })

  it('returns false when day is not ended', () => {
    expect(canUndoEndDay(baseDayRecord, today)).toBe(false)
  })

  it('returns false when undo count is exhausted', () => {
    const dr = { ...baseDayRecord, endedAt: '2026-05-15T18:00:00Z', undoEndCount: 1 }
    expect(canUndoEndDay(dr, today)).toBe(false)
  })

  it('returns false for a past date', () => {
    const dr = { ...baseDayRecord, date: '2026-05-14', endedAt: '2026-05-14T18:00:00Z' }
    expect(canUndoEndDay(dr, today)).toBe(false)
  })
})

describe('canUndoRestDay', () => {
  const today = '2026-05-15'

  it('returns true when rest day, count is 0, and date is today', () => {
    const dr = { ...baseDayRecord, isRestDay: true }
    expect(canUndoRestDay(dr, today)).toBe(true)
  })

  it('returns false when not a rest day', () => {
    expect(canUndoRestDay(baseDayRecord, today)).toBe(false)
  })

  it('returns false when undo count is exhausted', () => {
    const dr = { ...baseDayRecord, isRestDay: true, undoRestDayCount: 1 }
    expect(canUndoRestDay(dr, today)).toBe(false)
  })

  it('returns false for a past date', () => {
    const dr = { ...baseDayRecord, date: '2026-05-14', isRestDay: true }
    expect(canUndoRestDay(dr, today)).toBe(false)
  })
})

describe('canUncheckChore', () => {
  it('returns true when completed, count is 0, and day not ended', () => {
    expect(canUncheckChore(baseCompletion, false)).toBe(true)
  })

  it('returns false when not completed', () => {
    const cc = { ...baseCompletion, completedAt: null }
    expect(canUncheckChore(cc, false)).toBe(false)
  })

  it('returns false when uncheck count is exhausted', () => {
    const cc = { ...baseCompletion, uncheckCount: 1 }
    expect(canUncheckChore(cc, false)).toBe(false)
  })

  it('returns false when day is ended', () => {
    expect(canUncheckChore(baseCompletion, true)).toBe(false)
  })
})
