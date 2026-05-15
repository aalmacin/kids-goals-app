'use client'

import { useState } from 'react'
import { createTaskAction } from '@/lib/actions/tasks'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export function CreateTaskForm() {
  const [taskType, setTaskType] = useState<'one_time' | 'repeated'>('one_time')

  return (
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
              <Select name="taskType" defaultValue="one_time" onValueChange={(v) => setTaskType(v as 'one_time' | 'repeated')}>
                <SelectTrigger id="taskType">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="one_time">One-Time</SelectItem>
                  <SelectItem value="repeated">Repeated</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {taskType === 'repeated' && (
              <div className="space-y-2">
                <Label htmlFor="maxCompletions">Max Completions (leave blank for unlimited)</Label>
                <Input
                  id="maxCompletions"
                  name="maxCompletions"
                  type="number"
                  min={1}
                  placeholder="Unlimited"
                />
              </div>
            )}
          </div>

          {taskType === 'repeated' && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="oncePerDay"
                name="oncePerDay"
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="oncePerDay">Once per day</Label>
            </div>
          )}

          <Button type="submit">Add Task</Button>
        </form>
      </CardContent>
    </Card>
  )
}
