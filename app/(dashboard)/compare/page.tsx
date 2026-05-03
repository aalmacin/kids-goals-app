import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getFamilyByParentId } from '@/lib/db/families'
import { getSiblings, getTodayDailyProgress, getWeeklyPointsSummary } from '@/lib/db/compare'
import { Leaderboard } from '@/components/compare/Leaderboard'
import { DailyProgress } from '@/components/compare/DailyProgress'
import { WeeklySummary } from '@/components/compare/WeeklySummary'

export default async function ComparePage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Parents don't have a comparison page
  const parentFamily = await getFamilyByParentId(user.id)
  if (parentFamily) redirect('/admin')

  const { data: kid } = await supabase
    .from('kids')
    .select('id, family_id, name')
    .eq('supabase_user_id', user.id)
    .maybeSingle()

  if (!kid) redirect('/login')

  const today = new Date().toISOString().split('T')[0]
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const siblings = await getSiblings(kid.family_id)

  if (siblings.length <= 1) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-800">Family Comparison</h1>
        <p className="text-gray-500 text-center py-12">
          No siblings to compare with yet. Ask your parent to add more kids!
        </p>
      </div>
    )
  }

  const [dailyProgress, weeklySummary] = await Promise.all([
    getTodayDailyProgress(siblings, today),
    getWeeklyPointsSummary(kid.family_id, siblings, sevenDaysAgo),
  ])

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-gray-800">Family Comparison</h1>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-gray-700">🏆 Leaderboard</h2>
        <Leaderboard kids={siblings} currentKidId={kid.id} />
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-gray-700">📋 Today&apos;s Progress</h2>
        <DailyProgress progress={dailyProgress} currentKidId={kid.id} />
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-gray-700">📅 This Week</h2>
        <WeeklySummary summary={weeklySummary} currentKidId={kid.id} />
      </section>
    </div>
  )
}
