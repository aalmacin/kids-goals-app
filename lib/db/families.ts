import { createSupabaseServerClient, createSupabaseServiceClient } from '@/lib/supabase/server'

export async function createFamily(parentId: string, name: string) {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('families')
    .insert({ parent_id: parentId, name })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function getFamilyByName(name: string) {
  // Service client bypasses RLS — needed for kid login and name uniqueness checks
  const supabase = createSupabaseServiceClient()
  const { data, error } = await supabase
    .from('families')
    .select()
    .eq('name', name)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function getFamilyByParentId(parentId: string) {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('families')
    .select()
    .eq('parent_id', parentId)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function updateFamilyName(familyId: string, name: string) {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('families')
    .update({ name })
    .eq('id', familyId)
    .select()
    .single()
  if (error) throw error
  return data
}
