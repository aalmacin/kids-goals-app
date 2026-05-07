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
import { undoEndDay } from '@/lib/actions/day-records'

interface UndoEndDayButtonProps {
  dayRecordId: string
}

export function UndoEndDayButton({ dayRecordId }: UndoEndDayButtonProps) {
  const [isPending, startTransition] = useTransition()

  function handleConfirm() {
    startTransition(async () => {
      await undoEndDay(dayRecordId)
    })
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger
        className="inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 font-medium px-4 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={isPending}
      >
        Undo End Day
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Undo End Day?</AlertDialogTitle>
          <AlertDialogDescription>
            Your chore selections stay, but your points from this completion will be reversed.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm}>
            Undo End Day
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
