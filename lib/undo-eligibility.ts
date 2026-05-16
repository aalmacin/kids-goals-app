import type { ChoreCompletion } from '@/lib/types'

export function canUncheckChore(completion: ChoreCompletion, isEnded: boolean): boolean {
  return (
    completion.completedAt !== null &&
    completion.uncheckCount === 0 &&
    !isEnded
  )
}
