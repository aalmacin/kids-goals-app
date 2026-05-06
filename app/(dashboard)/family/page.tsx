import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getFamilyByParentId } from '@/lib/db/families'
import { getFamilyMembers, getTodayDailyProgress, getWeeklyPointsSummary } from '@/lib/db/family'
import { FamilyPageClient } from '@/components/family/FamilyPageClient'

export default async function FamilyPage() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const parentFamily = await getFamilyByParentId(user.id)
  if (parentFamily) redirect('/admin')

  const { data: kid } = await supabase
    .from('kids')
    .select('id, family_id, name, points')
    .eq('supabase_user_id', user.id)
    .maybeSingle()

  if (!kid) redirect('/login')

  const today = new Date().toISOString().split('T')[0]
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const familyId = kid.family_id ?? ''

  // Fall back to just the logged-in kid when family lookup fails or returns empty
  let members = familyId
    ? await getFamilyMembers(familyId).catch(() => [])
    : []
  if (members.length === 0) {
    members = [{ id: kid.id, name: kid.name, points: kid.points }]
  }

  const [dailyProgress, weeklySummary] = await Promise.all([
    getTodayDailyProgress(members, today),
    getWeeklyPointsSummary(familyId, members, sevenDaysAgo),
  ])

  return (
    <FamilyPageClient
      familyId={familyId}
      currentKidId={kid.id}
      initialMembers={members}
      initialDailyProgress={dailyProgress}
      initialWeeklySummary={weeklySummary}
      today={today}
      sevenDaysAgo={sevenDaysAgo}
    />
  )
}
