import { TaskItem } from './TaskItem'
import type { TaskWithCounts } from '@/lib/types'

interface TaskListProps {
  tasks: TaskWithCounts[]
}

export function TaskList({ tasks }: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <p className="text-sm">No tasks available right now.</p>
      </div>
    )
  }

  const oneTimeTasks = tasks.filter((t) => t.taskType === 'one_time')
  const repeatedTasks = tasks.filter((t) => t.taskType === 'repeated')

  return (
    <div className="space-y-4">
      {oneTimeTasks.length > 0 && (
        <div className="space-y-2">
          {repeatedTasks.length > 0 && (
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide px-1">One-time</p>
          )}
          {oneTimeTasks.map((task) => (
            <TaskItem key={task.id} task={task} todayCount={task.todayCount} />
          ))}
        </div>
      )}

      {repeatedTasks.length > 0 && (
        <div className="space-y-2">
          {oneTimeTasks.length > 0 && (
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide px-1">Repeatable</p>
          )}
          {repeatedTasks.map((task) => (
            <TaskItem key={task.id} task={task} todayCount={task.todayCount} />
          ))}
        </div>
      )}
    </div>
  )
}
