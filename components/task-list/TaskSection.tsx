'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { TaskList } from './TaskList'
import type { TaskWithCounts } from '@/lib/types'

interface TaskSectionProps {
  tasks: TaskWithCounts[]
  isEnded: boolean
}

export function TaskSection({ tasks, isEnded }: TaskSectionProps) {
  const [open, setOpen] = useState(false)

  if (isEnded || tasks.length === 0) return null

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 w-full text-left"
      >
        <h2 className="text-xl font-semibold text-gray-700">Tasks</h2>
        <ChevronDown
          className={`w-5 h-5 text-gray-400 transition-transform ${open ? '' : '-rotate-90'}`}
        />
      </button>
      {open && <TaskList tasks={tasks} />}
    </div>
  )
}
