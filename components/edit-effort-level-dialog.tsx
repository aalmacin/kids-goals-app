'use client'

import { useState } from 'react'
import { updateEffortLevelAction } from '@/lib/actions/effort-levels'
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Pencil } from 'lucide-react'

interface EditEffortLevelDialogProps {
  level: {
    id: string
    name: string
    points: number
  }
}

export function EditEffortLevelDialog({ level }: EditEffortLevelDialogProps) {
  const [open, setOpen] = useState(false)

  async function handleSubmit(formData: FormData) {
    await updateEffortLevelAction(level.id, formData)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        <Pencil className="w-4 h-4" />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Effort Level</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-level-name">Level Name</Label>
            <Input id="edit-level-name" name="name" defaultValue={level.name} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-level-points">Points Reward</Label>
            <Input id="edit-level-points" name="points" type="number" min={0} defaultValue={level.points} />
          </div>
          <DialogFooter>
            <Button type="submit">Save Changes</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
