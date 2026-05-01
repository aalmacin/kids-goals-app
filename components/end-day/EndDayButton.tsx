'use client'

import { useState, useTransition } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { EffortDropdown } from '@/components/effort-dropdown/EffortDropdown'
import { endDay } from '@/lib/actions/day-records'
import type { EffortLevel } from '@/lib/types'

interface EndDayButtonProps {
  dayRecordId: string
  effortLevels: EffortLevel[]
  allChoresDone: boolean
}

export function EndDayButton({ dayRecordId, effortLevels, allChoresDone }: EndDayButtonProps) {
  const [selectedEffort, setSelectedEffort] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleConfirm() {
    startTransition(async () => {
      await endDay(dayRecordId, selectedEffort !== null ? selectedEffort : undefined)
    })
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger
        className="inline-flex items-center justify-center rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold px-6 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={isPending}
      >
        End Day 🌙
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>End the Day?</AlertDialogTitle>
          <AlertDialogDescription>
            Incomplete chores will be penalized. This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {allChoresDone && effortLevels.length > 0 && (
          <div className="my-2">
            <EffortDropdown
              effortLevels={effortLevels}
              value={selectedEffort ?? ''}
              onChange={setSelectedEffort}
            />
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            className="bg-purple-600 hover:bg-purple-700"
          >
            End Day
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
