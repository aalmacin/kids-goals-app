import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function createChore(
  familyId: string,
  name: string,
  penalty: number,
  reward: number,
  isImportant: boolean,
  icon: string,
  allowedDays?: number[]
) {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('chores')
    .insert({
      family_id: familyId,
      name,
      penalty,
      reward_points: reward,
      is_important: isImportant,
      icon,
      allowed_days: allowedDays && allowedDays.length > 0 ? allowedDays : null,
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function getChoreLibrary(familyId: string) {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('chores')
    .select()
    .eq('family_id', familyId)
    .is('deleted_at', null)
    .order('name')
  if (error) throw error
  return data
}

export async function updateChore(
  choreId: string,
  updates: { name?: string; penalty?: number; reward_points?: number; is_important?: boolean; icon?: string; allowed_days?: number[] | null }
) {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('chores')
    .update(updates)
    .eq('id', choreId)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function softDeleteChore(choreId: string) {
  const supabase = await createSupabaseServerClient()
  const { error } = await supabase
    .from('chores')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', choreId)
  if (error) throw error
}

export async function assignChore(choreId: string, kidId: string) {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('chore_assignments')
    .insert({ chore_id: choreId, kid_id: kidId })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function unassignChore(choreId: string, kidId: string) {
  const supabase = await createSupabaseServerClient()
  const { error } = await supabase
    .from('chore_assignments')
    .delete()
    .eq('chore_id', choreId)
    .eq('kid_id', kidId)
  if (error) throw error
}

export async function getChoreAssignments(familyId: string) {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('chore_assignments')
    .select('*, chore:chores(*), kid:kids(*)')
    .eq('kids.family_id', familyId)
  if (error) throw error
  return data
}

export async function getChoreAssignmentsForKid(kidId: string) {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('chore_assignments')
    .select('*, chore:chores(*)')
    .eq('kid_id', kidId)
    .is('chores.deleted_at', null)
  if (error) throw error
  return data
}
