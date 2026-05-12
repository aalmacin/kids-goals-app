'use client'

import { useActionState } from 'react'
import { updateChoreAction } from '@/lib/actions/chores'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { IconPicker } from '@/components/ui/IconPicker'

interface ChoreEditFormProps {
  choreId: string
  chore: {
    name: string
    penalty: number
    reward_points: number
    is_important: boolean
    icon: string
  }
}

export function ChoreEditForm({ choreId, chore }: ChoreEditFormProps) {
  const boundAction = updateChoreAction.bind(null, choreId)
  const [state, formAction] = useActionState(boundAction, { error: null })

  return (
    <form action={formAction} className="mt-3 space-y-3 border-t pt-3">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="space-y-1">
          <Label htmlFor={`edit-name-${choreId}`} className="text-xs">Chore Name</Label>
          <Input id={`edit-name-${choreId}`} name="name" defaultValue={chore.name} required className="h-8 text-sm" />
        </div>
        <div className="space-y-1">
          <Label htmlFor={`edit-penalty-${choreId}`} className="text-xs">Penalty Points</Label>
          <Input id={`edit-penalty-${choreId}`} name="penalty" type="number" min={0} defaultValue={chore.penalty} className="h-8 text-sm" />
        </div>
        <div className="space-y-1">
          <Label htmlFor={`edit-reward-${choreId}`} className="text-xs">Reward Points</Label>
          <Input id={`edit-reward-${choreId}`} name="reward" type="number" min={0} defaultValue={chore.reward_points} className="h-8 text-sm" />
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <input type="checkbox" id={`edit-important-${choreId}`} name="isImportant" value="true" defaultChecked={chore.is_important} className="w-4 h-4" />
          <Label htmlFor={`edit-important-${choreId}`} className="text-xs">Important</Label>
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-xs">Icon</Label>
          <IconPicker name="icon" defaultValue={chore.icon} />
        </div>
        <Button type="submit" size="sm" className="h-7 text-xs">Save</Button>
      </div>
      {state.error && (
        <p className="text-xs text-red-600">{state.error}</p>
      )}
    </form>
  )
}
