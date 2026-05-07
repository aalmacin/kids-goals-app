import type { ChoreCompletion, EffortLevel } from './types'

export const REST_DAY_COST = 100

/**
 * Calculate total penalty points for a day's incomplete chores.
 * On a rest day, only important chores incur penalties.
 */
export function calculatePenalties(
  completions: ChoreCompletion[],
  isRestDay: boolean
): number {
  return completions
    .filter((c) => {
      if (c.completedAt !== null) return false
      if (isRestDay && !c.isImportantSnapshot) return false
      return true
    })
    .reduce((sum, c) => sum + c.penaltySnapshot, 0)
}

/**
 * Calculate effort reward points. Returns 0 if no effort level selected.
 */
export function calculateEffortReward(effortLevel: EffortLevel | null): number {
  return effortLevel?.points ?? 0
}

/**
 * Calculate total reward points for completed chores at End Day.
 * Returns an array of { completion, reward } for completions with reward > 0,
 * allowing the caller to insert one event per completed rewarded chore.
 */
export function calculateChoreRewards(
  completions: ChoreCompletion[]
): { completion: ChoreCompletion; reward: number }[] {
  return completions
    .filter((c) => c.completedAt !== null && c.rewardSnapshot > 0)
    .map((c) => ({ completion: c, reward: c.rewardSnapshot }))
}

/**
 * Check whether a kid has enough points to pay for a rest day.
 */
export function canAffordRestDay(points: number): boolean {
  return points >= REST_DAY_COST
}

/**
 * Apply zero floor: points can never go below 0.
 * Used for display/validation; actual DB enforcement is in apply_points_delta().
 */
export function applyPointsFloor(points: number): number {
  return Math.max(0, points)
}
