import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getFamilyByParentId } from '@/lib/db/families'
import { getRewards } from '@/lib/db/rewards'
import { createRewardAction, deleteRewardAction } from '@/lib/actions/rewards'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { IconPicker, IconDisplay } from '@/components/ui/IconPicker'
import { Trash2 } from 'lucide-react'
import { redirect } from 'next/navigation'

export default async function AdminRewardsPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const family = await getFamilyByParentId(user.id)
  if (!family) redirect('/family')

  const rewards = await getRewards(family.id)

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-gray-800">Rewards</h1>

      <Card>
        <CardHeader>
          <CardTitle>Add a Reward</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createRewardAction} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Reward Name</Label>
                <Input id="name" name="name" placeholder="Ice Cream" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pointsCost">Points Cost</Label>
                <Input id="pointsCost" name="pointsCost" type="number" min={1} defaultValue={50} required />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Icon</Label>
              <IconPicker name="icon" defaultValue="gift" />
            </div>
            <Button type="submit">Add Reward</Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {rewards.length === 0 && (
          <p className="text-gray-500 text-center py-8">No rewards yet.</p>
        )}
        {rewards.map((reward) => (
          <Card key={reward.id} className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-full text-purple-600">
                <IconDisplay iconName={reward.icon} className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold text-gray-800">{reward.name}</p>
                <Badge className="bg-purple-100 text-purple-700 text-xs">
                  {reward.points_cost} pts
                </Badge>
              </div>
            </div>
            <form action={deleteRewardAction.bind(null, reward.id)}>
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
