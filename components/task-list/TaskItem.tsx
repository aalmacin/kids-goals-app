'use client'

import { useState, useTransition } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { completeTaskAction, undoLastTaskCompletionAction } from '@/lib/actions/tasks'
import { Check, Repeat, Undo2 } from 'lucide-react'
import type { TaskWithCounts } from '@/lib/types'

interface TaskItemProps {
  task: TaskWithCounts
  todayCount: number
}

export function TaskItem({ task, todayCount }: TaskItemProps) {
  const [isPending, startTransition] = useTransition()
  const [isUndoPending, startUndoTransition] = useTransition()
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false)
  const [undoDialogOpen, setUndoDialogOpen] = useState(false)

  const { completedForNow } = task
  const remaining = task.remaining
  const isOneTime = task.taskType === 'one_time'

  function handleComplete() {
    if (completedForNow) return
    setCompleteDialogOpen(false)
    startTransition(async () => {
      await completeTaskAction(task.id)
    })
  }

  function handleUndo() {
    startUndoTransition(async () => {
      await undoLastTaskCompletionAction(task.id)
    })
  }

  const iconBg = completedForNow
    ? 'bg-green-100 text-green-600'
    : isOneTime
      ? 'bg-blue-100 text-blue-600'
      : 'bg-emerald-100 text-emerald-600'
  const Icon = isOneTime ? Check : Repeat

  const card = (
    <div
      className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
        completedForNow
          ? 'border-green-200 bg-green-50'
          : isPending
            ? 'opacity-50 border-gray-200 bg-gray-50'
            : 'border-gray-200 bg-white hover:border-indigo-300 hover:shadow-sm active:scale-[0.99]'
      }`}
    >
      <div className={`p-2.5 rounded-full shrink-0 ${iconBg}`}>
        <Icon className="w-5 h-5" />
      </div>

      <div className="flex-1 min-w-0">
        <p className={`font-semibold truncate ${completedForNow ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
          {task.name}
        </p>
        <div className="flex flex-wrap items-center gap-1.5 mt-1">
          <Badge variant="outline" className="text-green-700 border-green-300 text-xs">
            +{task.points} pts
          </Badge>

          {completedForNow && (
            <Badge className="bg-green-100 text-green-700 text-xs border-0">
              done
            </Badge>
          )}

          {!isOneTime && task.oncePerDay && !completedForNow && (
            <Badge variant="outline" className="text-purple-600 border-purple-300 text-xs">
              once/day
            </Badge>
          )}

          {!isOneTime && remaining !== null && !completedForNow && (
            <Badge variant="outline" className="text-indigo-600 border-indigo-300 text-xs">
              {remaining} left
            </Badge>
          )}

          {!isOneTime && task.maxCompletions === null && !task.oncePerDay && !completedForNow && (
            <Badge variant="outline" className="text-gray-400 border-gray-200 text-xs">
              repeatable
            </Badge>
          )}
        </div>
      </div>

      {todayCount > 0 && (
        <div className="flex items-center gap-1.5 shrink-0">
          {!completedForNow && (
            <span className="text-xs font-medium text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-2.5 py-1">
              {todayCount}x today
            </span>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              setUndoDialogOpen(true)
            }}
            disabled={isUndoPending}
            className="h-8 px-2 text-xs text-gray-500 hover:text-red-600 hover:bg-red-50"
            aria-label={`Undo last completion of ${task.name}`}
          >
            <Undo2 className="w-3.5 h-3.5 mr-1" />
            {task.oncePerDay || isOneTime ? 'undo' : `undo ${todayCount}`}
          </Button>
        </div>
      )}
    </div>
  )

  return (
    <>
      {/* Undo confirmation dialog — controlled via state to avoid nesting */}
      {todayCount > 0 && (
        <AlertDialog open={undoDialogOpen} onOpenChange={setUndoDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Undo &ldquo;{task.name}&rdquo;?</AlertDialogTitle>
              <AlertDialogDescription>
                This will deduct <strong>{task.points} points</strong> from your balance.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleUndo}
                className="bg-red-600 hover:bg-red-700"
              >
                Undo
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* Completion UI */}
      {completedForNow ? (
        card
      ) : (
        <>
          {/* div[role="button"] avoids <button> inside <button> when the undo button is visible inside card */}
          <div
            role="button"
            tabIndex={isPending ? -1 : 0}
            aria-disabled={isPending}
            className="w-full text-left cursor-pointer"
            onClick={() => { if (!isPending) setCompleteDialogOpen(true) }}
            onKeyDown={(e) => {
              if (!isPending && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault()
                setCompleteDialogOpen(true)
              }
            }}
          >
            {card}
          </div>
          <AlertDialog open={completeDialogOpen} onOpenChange={setCompleteDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Complete &ldquo;{task.name}&rdquo;?</AlertDialogTitle>
                <AlertDialogDescription>
                  You will earn <strong>{task.points} points</strong>.
                  {isOneTime && ' This task can only be completed once.'}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleComplete}>Complete Task</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </>
  )
}
