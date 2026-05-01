import { createSupabaseServerClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/database.types'

export async function insertActivityLog(
  entry: Database['public']['Tables']['activity_log']['Insert']
) {
  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.from('activity_log').insert(entry)
  if (error) throw error
}

export async function getActivityLog(
  familyId: string,
  options?: { kidId?: string; limit?: number; cursor?: string }
) {
  const supabase = await createSupabaseServerClient()

  let query = supabase
    .from('activity_log')
    .select('*, kid:kids(name)')
    .eq('family_id', familyId)
    .order('created_at', { ascending: false })
    .limit(options?.limit ?? 50)

  if (options?.kidId) {
    query = query.eq('kid_id', options.kidId)
  }

  if (options?.cursor) {
    query = query.lt('created_at', options.cursor)
  }

  const { data, error } = await query
  if (error) throw error
  return data
}
