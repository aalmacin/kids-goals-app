import { TaskItem } from './TaskItem'
import type { Task } from '@/lib/types'

interface TaskListProps {
  tasks: Task[]
}

export function TaskList({ tasks }: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <p className="text-gray-500 text-center py-4">No tasks available right now.</p>
    )
  }

  return (
    <div className="space-y-3">
      {tasks.map((task) => (
        <TaskItem key={task.id} task={task} />
      ))}
    </div>
  )
}
