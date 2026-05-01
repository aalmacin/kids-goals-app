import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getFamilyByParentId } from '@/lib/db/families'
import { getRewards } from '@/lib/db/rewards'
import { RewardCard } from '@/components/reward-card/RewardCard'
import type { Reward } from '@/lib/types'

export default async function RewardsPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: kid } = await supabase
    .from('kids')
    .select('id, family_id, points')
    .eq('supabase_user_id', user.id)
    .maybeSingle()

  // Parent: redirect to admin rewards
  if (!kid) redirect('/admin/rewards')

  const rewardsRaw = await getRewards(kid.family_id)
  const rewards: Reward[] = rewardsRaw.map((r) => ({
    id: r.id,
    familyId: r.family_id,
    name: r.name,
    pointsCost: r.points_cost,
    icon: r.icon,
    deletedAt: r.deleted_at,
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-800">Rewards 🎁</h1>
        <div className="text-sm text-gray-600 bg-yellow-100 px-3 py-1 rounded-full font-medium">
          Your points: {kid.points} ⭐
        </div>
      </div>

      {rewards.length === 0 ? (
        <p className="text-gray-500 text-center py-12">
          No rewards available yet. Ask your parent to add some!
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {rewards.map((reward) => (
            <RewardCard key={reward.id} reward={reward} kidPoints={kid.points} />
          ))}
        </div>
      )}
    </div>
  )
}
