import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function createReward(
  familyId: string,
  name: string,
  pointsCost: number,
  icon: string
) {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('rewards')
    .insert({ family_id: familyId, name, points_cost: pointsCost, icon })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function getRewards(familyId: string) {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('rewards')
    .select()
    .eq('family_id', familyId)
    .is('deleted_at', null)
    .order('points_cost')
  if (error) throw error
  return data
}

export async function updateReward(
  rewardId: string,
  updates: { name?: string; points_cost?: number; icon?: string }
) {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('rewards')
    .update(updates)
    .eq('id', rewardId)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function softDeleteReward(rewardId: string) {
  const supabase = await createSupabaseServerClient()
  const { error } = await supabase
    .from('rewards')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', rewardId)
  if (error) throw error
}

export async function createRedemption(
  kidId: string,
  rewardId: string,
  rewardNameSnapshot: string,
  pointsCostSnapshot: number
) {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('reward_redemptions')
    .insert({
      kid_id: kidId,
      reward_id: rewardId,
      reward_name_snapshot: rewardNameSnapshot,
      points_cost_snapshot: pointsCostSnapshot,
    })
    .select()
    .single()
  if (error) throw error
  return data
}
