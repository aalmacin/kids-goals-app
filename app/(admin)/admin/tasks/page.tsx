import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getFamilyByParentId } from '@/lib/db/families'
import { getTaskLibrary } from '@/lib/db/tasks'
import { createTaskAction, deleteTaskAction } from '@/lib/actions/tasks'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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

      {/* Add Task Form */}
      <Card>
        <CardHeader>
          <CardTitle>Add a Task</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createTaskAction} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Task Name</Label>
                <Input id="name" name="name" placeholder="Read a book" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="points">Points Reward</Label>
                <Input id="points" name="points" type="number" min={1} defaultValue={10} required />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="taskType">Task Type</Label>
                <Select name="taskType" defaultValue="one_time">
                  <SelectTrigger id="taskType">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="one_time">One-Time</SelectItem>
                    <SelectItem value="repeated">Repeated</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxCompletions">Max Completions (repeated only, leave blank for unlimited)</Label>
                <Input
                  id="maxCompletions"
                  name="maxCompletions"
                  type="number"
                  min={1}
                  placeholder="Unlimited"
                />
              </div>
            </div>

            <Button type="submit">Add Task</Button>
          </form>
        </CardContent>
      </Card>

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
                  {task.taskType === 'repeated' && task.maxCompletions === null && (
                    <Badge variant="outline" className="text-xs text-gray-500">
                      unlimited
                    </Badge>
                  )}
                </div>
              </div>
              <form action={deleteTaskAction.bind(null, task.id)}>
                <Button type="submit" variant="destructive" size="sm">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
