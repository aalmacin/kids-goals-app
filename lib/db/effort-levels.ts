import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function createEffortLevel(familyId: string, name: string, points: number) {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('effort_levels')
    .insert({ family_id: familyId, name, points })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function getEffortLevels(familyId: string) {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('effort_levels')
    .select()
    .eq('family_id', familyId)
    .order('points', { ascending: false })
  if (error) throw error
  return data
}

export async function updateEffortLevel(
  id: string,
  updates: { name?: string; points?: number }
) {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('effort_levels')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteEffortLevel(id: string) {
  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.from('effort_levels').delete().eq('id', id)
  if (error) throw error
}
