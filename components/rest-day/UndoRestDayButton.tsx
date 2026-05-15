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
import { undoRestDay } from '@/lib/actions/day-records'

interface UndoRestDayButtonProps {
  dayRecordId: string
}

export function UndoRestDayButton({ dayRecordId }: UndoRestDayButtonProps) {
  const [isPending, startTransition] = useTransition()

  function handleConfirm() {
    startTransition(async () => {
      await undoRestDay(dayRecordId)
    })
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger
        className="inline-flex items-center justify-center rounded-xl border border-yellow-400 bg-white hover:bg-yellow-50 text-yellow-700 font-bold px-6 py-3 text-base disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={isPending}
      >
        Undo Rest Day
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Undo Rest Day?</AlertDialogTitle>
          <AlertDialogDescription>
            This will return 100 points to your balance and all chores will be required again today.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} className="bg-yellow-500 hover:bg-yellow-600">
            Undo Rest Day
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
