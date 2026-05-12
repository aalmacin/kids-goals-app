'use client'

import { useState, useTransition } from 'react'
import { DaySchedulePicker } from './DaySchedulePicker'
import { updateChoreScheduleAction } from '@/lib/actions/chores'
import { Button } from '@/components/ui/button'

type Props = {
  choreId: string
  initialDays: number[]
}

export function ChoreScheduleEditor({ choreId, initialDays }: Props) {
  const [days, setDays] = useState<number[]>(initialDays)
  const [isPending, startTransition] = useTransition()

  function handleSave() {
    startTransition(async () => {
      await updateChoreScheduleAction(choreId, days)
    })
  }

  return (
    <div className="mt-3 flex items-center gap-3 flex-wrap">
      <span className="text-xs text-gray-500 shrink-0">Days:</span>
      <DaySchedulePicker value={days} onChange={setDays} />
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={handleSave}
        disabled={isPending}
        className="text-xs"
      >
        {isPending ? 'Saving…' : 'Save Schedule'}
      </Button>
    </div>
  )
}
