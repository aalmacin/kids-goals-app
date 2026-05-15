import type { DayRecord, ChoreCompletion } from '@/lib/types'

export function canUndoEndDay(dayRecord: DayRecord, today: string): boolean {
  return (
    dayRecord.endedAt !== null &&
    dayRecord.undoEndCount === 0 &&
    dayRecord.date === today
  )
}

export function canUndoRestDay(dayRecord: DayRecord, today: string): boolean {
  return (
    dayRecord.isRestDay &&
    dayRecord.undoRestDayCount === 0 &&
    dayRecord.date === today
  )
}

export function canUncheckChore(completion: ChoreCompletion, isEnded: boolean): boolean {
  return (
    completion.completedAt !== null &&
    completion.uncheckCount === 0 &&
    !isEnded
  )
}
