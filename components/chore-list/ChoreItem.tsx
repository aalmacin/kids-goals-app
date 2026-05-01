'use client'

import { useTransition } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { IconDisplay } from '@/components/ui/IconPicker'
import { toggleChore } from '@/lib/actions/day-records'
import type { ChoreCompletion } from '@/lib/types'

interface ChoreItemProps {
  completion: ChoreCompletion & { choreIcon?: string }
  dayRecordId: string
  isEnded: boolean
}

export function ChoreItem({ completion, dayRecordId, isEnded }: ChoreItemProps) {
  const [isPending, startTransition] = useTransition()
  const isCompleted = completion.completedAt !== null

  function handleToggle() {
    if (isEnded) return
    startTransition(async () => {
      await toggleChore(completion.id, !isCompleted, dayRecordId)
    })
  }

  return (
    <div
      className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
        isCompleted
          ? 'border-green-300 bg-green-50'
          : 'border-gray-200 bg-white hover:border-indigo-300'
      } ${isPending ? 'opacity-60' : ''}`}
    >
      <Checkbox
        checked={isCompleted}
        onCheckedChange={handleToggle}
        disabled={isEnded || isPending}
        className="w-6 h-6"
      />

      <div className="text-indigo-500">
        <IconDisplay iconName={completion.choreIcon ?? 'star'} className="w-6 h-6" />
      </div>

      <div className="flex-1">
        <p className={`font-medium ${isCompleted ? 'line-through text-gray-400' : 'text-gray-800'}`}>
          {completion.choreNameSnapshot}
        </p>
      </div>

      {completion.penaltySnapshot > 0 && !isCompleted && (
        <Badge variant="outline" className="text-red-600 border-red-300 text-xs">
          -{completion.penaltySnapshot} pts
        </Badge>
      )}

      {completion.isImportantSnapshot && (
        <Badge className="bg-orange-100 text-orange-700 text-xs">!</Badge>
      )}
    </div>
  )
}
