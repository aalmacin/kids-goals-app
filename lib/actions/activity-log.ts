'use server'

import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getFamilyByParentId } from '@/lib/db/families'
import { getActivityLog } from '@/lib/db/activity-log'

export async function getActivityLogAction(options?: {
  kidId?: string
  limit?: number
  cursor?: string
}) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Determine family ID
  const parentFamily = await getFamilyByParentId(user.id)
  if (parentFamily) {
    return getActivityLog(parentFamily.id, options)
  }

  // Kid path
  const { data: kid } = await supabase
    .from('kids')
    .select('family_id')
    .eq('supabase_user_id', user.id)
    .maybeSingle()

  if (!kid) throw new Error('User not found')
  return getActivityLog(kid.family_id, options)
}
