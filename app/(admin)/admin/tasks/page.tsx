import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getFamilyByParentId } from '@/lib/db/families'
import { getTaskLibrary } from '@/lib/db/tasks'
import { deleteTaskAction } from '@/lib/actions/tasks'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CreateTaskForm } from '@/components/admin/CreateTaskForm'
import { EditTaskDialog } from '@/components/admin/EditTaskDialog'
import { Trash2 } from 'lucide-react'

export default async function TasksPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const family = await getFamilyByParentId(user.id)
  if (!family) redirect('/admin/family')

  const tasks = await getTaskLibrary(family.id)

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-gray-800">Task Library</h1>

      <CreateTaskForm />

      {/* Task List */}
      <div className="space-y-3">
        {tasks.length === 0 && (
          <p className="text-gray-500 text-center py-8">No tasks yet. Add one above!</p>
        )}
        {tasks.map((task) => (
          <Card key={task.id} className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-800">{task.name}</p>
                <div className="flex gap-2 mt-1">
                  <Badge variant="outline" className="text-xs text-green-700 border-green-300">
                    +{task.points} pts
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {task.taskType === 'one_time' ? 'One-Time' : 'Repeated'}
                  </Badge>
                  {task.taskType === 'repeated' && task.maxCompletions !== null && (
                    <Badge variant="outline" className="text-xs text-indigo-600 border-indigo-300">
                      max {task.maxCompletions}×
                    </Badge>
                  )}
                  {task.taskType === 'repeated' && task.maxCompletions === null && !task.oncePerDay && (
                    <Badge variant="outline" className="text-xs text-gray-500">
                      unlimited
                    </Badge>
                  )}
                  {task.taskType === 'repeated' && task.oncePerDay && (
                    <Badge variant="outline" className="text-xs text-purple-600 border-purple-300">
                      once/day
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <EditTaskDialog task={task} />
                <form action={deleteTaskAction.bind(null, task.id)}>
                  <Button type="submit" variant="destructive" size="sm">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </form>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
