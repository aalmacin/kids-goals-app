import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getFamilyByParentId } from '@/lib/db/families'
import { getChoreLibrary } from '@/lib/db/chores'
import { getKidsByFamily } from '@/lib/db/kids'
import { createChoreAction, deleteChoreAction, assignChoreAction, unassignChoreAction, updateChoreAction } from '@/lib/actions/chores'
import { ChoreScheduleEditor } from '@/components/chore-list/ChoreScheduleEditor'
import { ChoreScheduleBadge } from '@/components/chore-list/ChoreScheduleBadge'
import { Pencil } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { IconPicker, IconDisplay } from '@/components/ui/IconPicker'
import { Trash2, UserPlus, UserMinus } from 'lucide-react'
import { redirect } from 'next/navigation'

export default async function ChoresPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const family = await getFamilyByParentId(user.id)
  if (!family) redirect('/family')

  const [chores, kids] = await Promise.all([
    getChoreLibrary(family.id),
    getKidsByFamily(family.id),
  ])

  // Get all assignments
  const { data: assignments } = await supabase
    .from('chore_assignments')
    .select('chore_id, kid_id')
    .in('kid_id', kids.map((k) => k.id))

  const assignmentMap = new Map<string, Set<string>>()
  for (const a of assignments ?? []) {
    if (!assignmentMap.has(a.chore_id)) assignmentMap.set(a.chore_id, new Set())
    assignmentMap.get(a.chore_id)!.add(a.kid_id)
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-gray-800">Chore Library</h1>

      {/* Add Chore Form */}
      <Card>
        <CardHeader>
          <CardTitle>Add a Chore</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createChoreAction} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Chore Name</Label>
                <Input id="name" name="name" placeholder="Brush teeth" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="penalty">Penalty Points</Label>
                <Input id="penalty" name="penalty" type="number" min={0} defaultValue={0} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reward">Reward Points</Label>
                <Input id="reward" name="reward" type="number" min={0} defaultValue={0} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="isImportant" name="isImportant" value="true" className="w-4 h-4" />
              <Label htmlFor="isImportant">Important (shown on rest days)</Label>
            </div>
            <div className="space-y-2">
              <Label>Icon</Label>
              <IconPicker name="icon" />
            </div>
            <Button type="submit">Add Chore</Button>
          </form>
        </CardContent>
      </Card>

      {/* Chore List */}
      <div className="space-y-3">
        {chores.length === 0 && (
          <p className="text-gray-500 text-center py-8">No chores yet. Add one above!</p>
        )}
        {chores.map((chore) => {
          const assignedKidIds = assignmentMap.get(chore.id) ?? new Set()
          return (
            <Card key={chore.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-100 rounded-full text-indigo-600">
                    <IconDisplay iconName={chore.icon} className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">{chore.name}</p>
                    <div className="flex gap-2 mt-1 flex-wrap">
                      <Badge variant="outline" className="text-xs">-{chore.penalty} pts</Badge>
                      {chore.reward_points > 0 && (
                        <Badge variant="outline" className="text-xs text-green-600 border-green-300">+{chore.reward_points} pts</Badge>
                      )}
                      {chore.is_important && (
                        <Badge className="text-xs bg-orange-100 text-orange-700">Important</Badge>
                      )}
                      <ChoreScheduleBadge allowedDays={chore.allowed_days ?? []} />
                    </div>
                  </div>
                </div>
                <form action={deleteChoreAction.bind(null, chore.id)}>
                  <Button type="submit" variant="destructive" size="sm">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </form>
              </div>

              {/* Day Schedule */}
              <ChoreScheduleEditor
                choreId={chore.id}
                initialDays={chore.allowed_days ?? []}
              />

              {/* Edit Chore */}
              <details className="mt-3">
                <summary className="flex items-center gap-1 text-xs text-gray-500 cursor-pointer hover:text-indigo-600 w-fit">
                  <Pencil className="w-3 h-3" /> Edit
                </summary>
                <form action={updateChoreAction.bind(null, chore.id)} className="mt-3 space-y-3 border-t pt-3">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor={`edit-name-${chore.id}`} className="text-xs">Chore Name</Label>
                      <Input id={`edit-name-${chore.id}`} name="name" defaultValue={chore.name} required className="h-8 text-sm" />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor={`edit-penalty-${chore.id}`} className="text-xs">Penalty Points</Label>
                      <Input id={`edit-penalty-${chore.id}`} name="penalty" type="number" min={0} defaultValue={chore.penalty} className="h-8 text-sm" />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor={`edit-reward-${chore.id}`} className="text-xs">Reward Points</Label>
                      <Input id={`edit-reward-${chore.id}`} name="reward" type="number" min={0} defaultValue={chore.reward_points} className="h-8 text-sm" />
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <input type="checkbox" id={`edit-important-${chore.id}`} name="isImportant" value="true" defaultChecked={chore.is_important} className="w-4 h-4" />
                      <Label htmlFor={`edit-important-${chore.id}`} className="text-xs">Important</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Label className="text-xs">Icon</Label>
                      <IconPicker name="icon" defaultValue={chore.icon} />
                    </div>
                    <Button type="submit" size="sm" className="h-7 text-xs">Save</Button>
                  </div>
                </form>
              </details>

              {/* Kid Assignments */}
              {kids.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {kids.map((kid) => {
                    const isAssigned = assignedKidIds.has(kid.id)
                    return isAssigned ? (
                      <form key={kid.id} action={unassignChoreAction.bind(null, chore.id, kid.id)}>
                        <Button type="submit" variant="outline" size="sm" className="text-xs text-green-700 border-green-300">
                          <UserMinus className="w-3 h-3 mr-1" />{kid.name}
                        </Button>
                      </form>
                    ) : (
                      <form key={kid.id} action={assignChoreAction.bind(null, chore.id, kid.id)}>
                        <Button type="submit" variant="outline" size="sm" className="text-xs text-gray-500">
                          <UserPlus className="w-3 h-3 mr-1" />{kid.name}
                        </Button>
                      </form>
                    )
                  })}
                </div>
              )}
            </Card>
          )
        })}
      </div>
    </div>
  )
}
