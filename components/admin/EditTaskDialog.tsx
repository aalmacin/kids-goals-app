'use client'

import { useState } from 'react'
import { updateTaskAction } from '@/lib/actions/tasks'
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Pencil } from 'lucide-react'
import type { Task } from '@/lib/types'

interface EditTaskDialogProps {
  task: Pick<Task, 'id' | 'name' | 'points'>
}

export function EditTaskDialog({ task }: EditTaskDialogProps) {
  const [open, setOpen] = useState(false)

  async function handleSubmit(formData: FormData) {
    await updateTaskAction(task.id, formData)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        <Pencil className="w-4 h-4" />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Task</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-task-name">Task Name</Label>
            <Input id="edit-task-name" name="name" defaultValue={task.name} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-task-points">Points Reward</Label>
            <Input
              id="edit-task-points"
              name="points"
              type="number"
              min={1}
              defaultValue={task.points}
              required
            />
          </div>
          <DialogFooter>
            <Button type="submit">Save Changes</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
