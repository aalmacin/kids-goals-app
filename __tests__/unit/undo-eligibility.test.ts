import { describe, it, expect } from 'vitest'
import { canUncheckChore } from '@/lib/undo-eligibility'
import type { ChoreCompletion } from '@/lib/types'

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
