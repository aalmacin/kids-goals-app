import { ChoreItem } from './ChoreItem'
import type { ChoreCompletion } from '@/lib/types'

interface ChoreListProps {
  completions: (ChoreCompletion & { choreIcon?: string })[]
  dayRecordId: string
  isRestDay: boolean
  isEnded: boolean
}

export function ChoreList({ completions, dayRecordId, isRestDay, isEnded }: ChoreListProps) {
  const visible = isRestDay
    ? completions.filter((c) => c.isImportantSnapshot)
    : completions

  if (visible.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p className="text-2xl mb-2">🎉</p>
        <p className="font-medium">
          {isRestDay ? 'No important chores today! Enjoy your rest day!' : 'No chores assigned!'}
        </p>
      </div>
    )
  }

  const allDone = visible.every((c) => c.completedAt !== null)

  return (
    <div className="space-y-2">
      {visible.map((completion) => (
        <ChoreItem
          key={completion.id}
          completion={completion}
          dayRecordId={dayRecordId}
          isEnded={isEnded}
        />
      ))}

      {allDone && !isEnded && (
        <div className="mt-4 p-4 bg-green-50 border-2 border-green-300 rounded-xl text-center">
          <p className="text-green-700 font-semibold text-lg">
            All chores done! Great job! 🌟
          </p>
        </div>
      )}
    </div>
  )
}
