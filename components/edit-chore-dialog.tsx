'use client'

import { useState } from 'react'
import { updateChoreAction } from '@/lib/actions/chores'
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { IconPicker } from '@/components/ui/IconPicker'
import { Pencil } from 'lucide-react'

interface EditChoreDialogProps {
  chore: {
    id: string
    name: string
    penalty: number
    is_important: boolean
    icon: string
  }
}

export function EditChoreDialog({ chore }: EditChoreDialogProps) {
  const [open, setOpen] = useState(false)

  async function handleSubmit(formData: FormData) {
    await updateChoreAction(chore.id, formData)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        <Pencil className="w-4 h-4" />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Chore</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Chore Name</Label>
            <Input id="edit-name" name="name" defaultValue={chore.name} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-penalty">Penalty Points</Label>
            <Input id="edit-penalty" name="penalty" type="number" min={0} defaultValue={chore.penalty} />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="edit-isImportant" name="isImportant" value="true" defaultChecked={chore.is_important} className="w-4 h-4" />
            <Label htmlFor="edit-isImportant">Important (shown on rest days)</Label>
          </div>
          <div className="space-y-2">
            <Label>Icon</Label>
            <IconPicker name="icon" defaultValue={chore.icon} />
          </div>
          <DialogFooter>
            <Button type="submit">Save Changes</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
