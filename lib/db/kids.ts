import { createSupabaseServerClient } from '@/lib/supabase/server'

export async function createKid(
  familyId: string,
  supabaseUserId: string,
  name: string,
  birthday: string
) {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('kids')
    .insert({ family_id: familyId, supabase_user_id: supabaseUserId, name, birthday })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function getKidsByFamily(familyId: string) {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('kids')
    .select()
    .eq('family_id', familyId)
    .order('name')
  if (error) throw error
  return data
}

export async function getKidByFamilyAndName(familyId: string, name: string) {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('kids')
    .select()
    .eq('family_id', familyId)
    .eq('name', name)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function getKidBySupabaseUserId(supabaseUserId: string) {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('kids')
    .select()
    .eq('supabase_user_id', supabaseUserId)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function updateKid(
  kidId: string,
  updates: { name?: string; birthday?: string }
) {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('kids')
    .update(updates)
    .eq('id', kidId)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteKid(kidId: string) {
  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.from('kids').delete().eq('id', kidId)
  if (error) throw error
}
