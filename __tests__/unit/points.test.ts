import { describe, it, expect } from 'vitest'
import {
  calculatePenalties,
  calculateEffortReward,
  canAffordRestDay,
  applyPointsFloor,
  REST_DAY_COST,
} from '@/lib/points'
import type { ChoreCompletion, EffortLevel } from '@/lib/types'

function makeCompletion(
  overrides: Partial<ChoreCompletion> = {}
): ChoreCompletion {
  return {
    id: 'test-id',
    dayRecordId: 'day-id',
    choreAssignmentId: 'assignment-id',
    choreNameSnapshot: 'Test Chore',
    penaltySnapshot: 10,
    isImportantSnapshot: false,
    completedAt: null,
    ...overrides,
  }
}

function makeEffortLevel(points: number): EffortLevel {
  return { id: 'effort-id', familyId: 'family-id', name: 'Good', points }
}

describe('calculatePenalties', () => {
  it('returns 0 when all chores are complete', () => {
    const completions = [
      makeCompletion({ completedAt: '2026-04-25T10:00:00Z' }),
      makeCompletion({ completedAt: '2026-04-25T11:00:00Z' }),
    ]
    expect(calculatePenalties(completions, false)).toBe(0)
  })

  it('sums penalty snapshots for incomplete chores', () => {
    const completions = [
      makeCompletion({ penaltySnapshot: 5, completedAt: null }),
      makeCompletion({ penaltySnapshot: 10, completedAt: '2026-04-25T10:00:00Z' }),
      makeCompletion({ penaltySnapshot: 15, completedAt: null }),
    ]
    expect(calculatePenalties(completions, false)).toBe(20)
  })

  it('on a rest day, skips non-important chores', () => {
    const completions = [
      makeCompletion({ penaltySnapshot: 10, isImportantSnapshot: false, completedAt: null }),
      makeCompletion({ penaltySnapshot: 20, isImportantSnapshot: true, completedAt: null }),
    ]
    expect(calculatePenalties(completions, true)).toBe(20)
  })

  it('on a rest day, still penalizes incomplete important chores', () => {
    const completions = [
      makeCompletion({ penaltySnapshot: 10, isImportantSnapshot: true, completedAt: null }),
      makeCompletion({ penaltySnapshot: 20, isImportantSnapshot: true, completedAt: '2026-04-25T10:00:00Z' }),
    ]
    expect(calculatePenalties(completions, true)).toBe(10)
  })

  it('returns 0 for empty completions list', () => {
    expect(calculatePenalties([], false)).toBe(0)
  })
})

describe('calculateEffortReward', () => {
  it('returns 0 when effort level is null', () => {
    expect(calculateEffortReward(null)).toBe(0)
  })

  it('returns the effort level points when defined', () => {
    expect(calculateEffortReward(makeEffortLevel(50))).toBe(50)
  })

  it('returns 0 when effort level has 0 points', () => {
    expect(calculateEffortReward(makeEffortLevel(0))).toBe(0)
  })
})

describe('canAffordRestDay', () => {
  it('returns false when points < REST_DAY_COST', () => {
    expect(canAffordRestDay(REST_DAY_COST - 1)).toBe(false)
  })

  it('returns true at exactly REST_DAY_COST', () => {
    expect(canAffordRestDay(REST_DAY_COST)).toBe(true)
  })

  it('returns true when points > REST_DAY_COST', () => {
    expect(canAffordRestDay(REST_DAY_COST + 50)).toBe(true)
  })

  it('returns false at 0 points', () => {
    expect(canAffordRestDay(0)).toBe(false)
  })
})

describe('applyPointsFloor', () => {
  it('returns the value unchanged when >= 0', () => {
    expect(applyPointsFloor(100)).toBe(100)
  })

  it('returns 0 when value is negative', () => {
    expect(applyPointsFloor(-50)).toBe(0)
  })

  it('returns 0 when value is exactly 0', () => {
    expect(applyPointsFloor(0)).toBe(0)
  })
})
