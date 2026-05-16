'use client'

import { useTransition } from 'react'
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
import { endDay } from '@/lib/actions/day-records'

interface EndDayButtonProps {
  dayRecordId: string
  allChoresDone: boolean
}

export function EndDayButton({ dayRecordId, allChoresDone }: EndDayButtonProps) {
  const [isPending, startTransition] = useTransition()

  function handleConfirm() {
    startTransition(async () => {
      await endDay(dayRecordId)
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
            {allChoresDone ? 'Great job completing all your chores!' : 'Incomplete chores will be penalized.'}
          </AlertDialogDescription>
        </AlertDialogHeader>
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
