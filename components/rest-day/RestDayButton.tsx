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
import { Button } from '@/components/ui/button'
import { declareRestDay } from '@/lib/actions/day-records'

interface RestDayButtonProps {
  dayRecordId: string
  kidPoints: number
  isRestDay: boolean
}

export function RestDayButton({ dayRecordId, kidPoints, isRestDay }: RestDayButtonProps) {
  const [isPending, startTransition] = useTransition()

  if (isRestDay) {
    return (
      <div className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-xl font-medium text-sm">
        🏖️ Rest Day Active
      </div>
    )
  }

  const canAfford = kidPoints >= 100

  if (!canAfford) {
    return (
      <Button variant="outline" disabled className="text-gray-400 border-gray-200">
        Rest Day (need 100 pts)
      </Button>
    )
  }

  function handleConfirm() {
    startTransition(async () => {
      const result = await declareRestDay(dayRecordId)
      if (result?.error) {
        // Error will be shown via server revalidation
      }
    })
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger
        className="inline-flex items-center justify-center rounded-md border border-yellow-400 bg-transparent text-yellow-700 hover:bg-yellow-50 px-4 py-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={isPending}
      >
        🏖️ Rest Day (-100 pts)
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Take a Rest Day?</AlertDialogTitle>
          <AlertDialogDescription>
            This will cost 100 points. Only important chores will be required today.
            You currently have {kidPoints} points.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            className="bg-yellow-500 hover:bg-yellow-600"
          >
            Yes, Rest Day!
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
