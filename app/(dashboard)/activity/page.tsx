import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getFamilyByParentId } from '@/lib/db/families'
import { getActivityLog } from '@/lib/db/activity-log'
import { ActivityLogTable } from '@/components/activity-log/ActivityLogTable'
import type { ActivityLogEntry } from '@/lib/types'

export default async function ActivityPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  let familyId: string
  let kidId: string | undefined

  const parentFamily = await getFamilyByParentId(user.id)
  if (parentFamily) {
    familyId = parentFamily.id
  } else {
    const { data: kid } = await supabase
      .from('kids')
      .select('id, family_id')
      .eq('supabase_user_id', user.id)
      .maybeSingle()
    if (!kid) redirect('/login')
    familyId = kid.family_id
    kidId = kid.id
  }

  const rawEntries = await getActivityLog(familyId, { kidId, limit: 100 })

  const entries: (ActivityLogEntry & { kidName?: string })[] = rawEntries.map((e) => ({
    id: e.id,
    familyId: e.family_id,
    kidId: e.kid_id,
    actorType: e.actor_type as 'parent' | 'kid',
    actionType: e.action_type as ActivityLogEntry['actionType'],
    metadata: e.metadata as Record<string, unknown>,
    pointsDelta: e.points_delta,
    createdAt: e.created_at,
    kidName: (e.kid as { name?: string } | null)?.name,
  }))

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Activity Log</h1>
      <ActivityLogTable entries={entries} familyId={familyId} />
    </div>
  )
}
