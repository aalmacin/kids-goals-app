import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getFamilyByParentId } from '@/lib/db/families'
import { getEffortLevels } from '@/lib/db/effort-levels'
import { createEffortLevelAction, deleteEffortLevelAction } from '@/lib/actions/effort-levels'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'
import { redirect } from 'next/navigation'

export default async function EffortPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const family = await getFamilyByParentId(user.id)
  if (!family) redirect('/family')

  const effortLevels = await getEffortLevels(family.id)

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-gray-800">Effort Levels</h1>
      <p className="text-gray-600">
        Define effort levels kids can select at the end of the day to earn bonus points.
      </p>

      <Card>
        <CardHeader>
          <CardTitle>Add Effort Level</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createEffortLevelAction} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Level Name</Label>
              <Input id="name" name="name" placeholder="Amazing" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="points">Points Reward</Label>
              <Input id="points" name="points" type="number" min={0} defaultValue={10} />
            </div>
            <div className="flex items-end">
              <Button type="submit" className="w-full">Add Level</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {effortLevels.length === 0 && (
          <p className="text-gray-500 text-center py-8">No effort levels yet.</p>
        )}
        {effortLevels.map((level) => (
          <Card key={level.id} className="flex items-center justify-between p-4">
            <div>
              <p className="font-semibold text-gray-800">{level.name}</p>
              <p className="text-sm text-green-600">+{level.points} points</p>
            </div>
            <form action={deleteEffortLevelAction.bind(null, level.id)}>
              <Button type="submit" variant="destructive" size="sm">
                <Trash2 className="w-4 h-4" />
              </Button>
            </form>
          </Card>
        ))}
      </div>
    </div>
  )
}
