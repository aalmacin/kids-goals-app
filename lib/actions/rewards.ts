'use server'

import { revalidatePath } from 'next/cache'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { createReward, getRewards, updateReward, softDeleteReward, createRedemption } from '@/lib/db/rewards'
import { getFamilyByParentId } from '@/lib/db/families'

async function requireParentFamily() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  const family = await getFamilyByParentId(user.id)
  if (!family) throw new Error('Family not found')
  return { user, family }
}

export async function createRewardAction(formData: FormData) {
  const name = (formData.get('name') as string).trim()
  const pointsCost = Number(formData.get('pointsCost'))
  const icon = formData.get('icon') as string
  const { family } = await requireParentFamily()
  await createReward(family.id, name, pointsCost, icon)
  revalidatePath('/admin/rewards')
  revalidatePath('/dashboard/rewards')
}

export async function updateRewardAction(rewardId: string, formData: FormData) {
  const name = (formData.get('name') as string).trim()
  const pointsCost = Number(formData.get('pointsCost'))
  const icon = formData.get('icon') as string
  await requireParentFamily()
  await updateReward(rewardId, { name, points_cost: pointsCost, icon })
  revalidatePath('/admin/rewards')
  revalidatePath('/dashboard/rewards')
}

export async function deleteRewardAction(rewardId: string) {
  await requireParentFamily()
  await softDeleteReward(rewardId)
  revalidatePath('/admin/rewards')
  revalidatePath('/dashboard/rewards')
}

export async function getRewardsAction() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Works for both parent (via family) and kid (via family_id)
  const family = await getFamilyByParentId(user.id)
  if (family) return getRewards(family.id)

  // Kid path
  const { data: kid } = await supabase
    .from('kids')
    .select('family_id')
    .eq('supabase_user_id', user.id)
    .maybeSingle()

  if (!kid) throw new Error('User not found')
  return getRewards(kid.family_id)
}

export async function redeemReward(rewardId: string) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: kid } = await supabase
    .from('kids')
    .select('id, family_id, points')
    .eq('supabase_user_id', user.id)
    .maybeSingle()

  if (!kid) return { error: 'Only kids can redeem rewards' }

  const { data: reward } = await supabase
    .from('rewards')
    .select()
    .eq('id', rewardId)
    .is('deleted_at', null)
    .single()

  if (!reward) return { error: 'Reward not found' }
  if (kid.points < reward.points_cost) return { error: 'Insufficient points' }

  // Atomic deduction
  await supabase.rpc('apply_points_delta', { kid_id: kid.id, delta: -reward.points_cost })

  // Create redemption record
  await createRedemption(kid.id, reward.id, reward.name, reward.points_cost)

  // Log activity
  await supabase.from('activity_log').insert({
    family_id: kid.family_id,
    kid_id: kid.id,
    actor_type: 'kid' as const,
    action_type: 'reward_redeemed' as const,
    metadata: { reward_id: reward.id, reward_name: reward.name },
    points_delta: -reward.points_cost,
  })

  revalidatePath('/dashboard/rewards')
  revalidatePath('/dashboard')
  return { success: true }
}
