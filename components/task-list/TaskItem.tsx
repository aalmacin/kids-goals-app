'use client'

import { useTransition } from 'react'
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
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { completeTaskAction } from '@/lib/actions/tasks'
import type { Task } from '@/lib/types'

interface TaskItemProps {
  task: Task
  completionCount?: number
}

export function TaskItem({ task, completionCount = 0 }: TaskItemProps) {
  const [isPending, startTransition] = useTransition()

  function handleComplete() {
    startTransition(async () => {
      await completeTaskAction(task.id)
    })
  }

  const remaining =
    task.taskType === 'repeated' && task.maxCompletions !== null
      ? task.maxCompletions - completionCount
      : null

  const taskContent = (
    <div
      className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all border-gray-200 bg-white hover:border-indigo-300 ${isPending ? 'opacity-60' : ''}`}
    >
      <div className="flex-1">
        <p className="font-medium text-gray-800">{task.name}</p>
      </div>

      <div className="flex items-center gap-2">
        <Badge variant="outline" className="text-green-700 border-green-300 text-xs">
          +{task.points} pts
        </Badge>

        {remaining !== null && (
          <Badge variant="outline" className="text-indigo-600 border-indigo-300 text-xs">
            {remaining} left
          </Badge>
        )}

        {task.taskType === 'repeated' && task.maxCompletions === null && (
          <Badge variant="outline" className="text-gray-500 border-gray-300 text-xs">
            repeatable
          </Badge>
        )}
      </div>
    </div>
  )

  if (task.taskType === 'one_time') {
    return (
      <AlertDialog>
        <AlertDialogTrigger
          className="w-full text-left"
          disabled={isPending}
        >
          {taskContent}
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Complete &ldquo;{task.name}&rdquo;?</AlertDialogTitle>
            <AlertDialogDescription>
              You will earn <strong>{task.points} points</strong>. This task can only be completed once.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleComplete}>Complete Task</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    )
  }

  return (
    <Button
      variant="ghost"
      className="w-full h-auto p-0 text-left"
      onClick={handleComplete}
      disabled={isPending}
    >
      {taskContent}
    </Button>
  )
}
