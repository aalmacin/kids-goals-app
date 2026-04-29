import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getOrCreateDayRecord } from '@/lib/db/day-records'
import { ChoreList } from '@/components/chore-list/ChoreList'
import { EndDayButton } from '@/components/end-day/EndDayButton'
import { RestDayButton } from '@/components/rest-day/RestDayButton'
import type { ChoreCompletion, EffortLevel } from '@/lib/types'

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>
}) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Only kids see the chore dashboard
  const { data: kid } = await supabase
    .from('kids')
    .select('id, points, family_id')
    .eq('supabase_user_id', user.id)
    .maybeSingle()

  if (!kid) {
    // Parent lands on admin
    redirect('/admin')
  }

  const params = await searchParams
  const today = new Date().toISOString().split('T')[0]
  const date = params.date ?? today

  const dayRecord = await getOrCreateDayRecord(kid.id, date)

  // Map DB completions to typed ChoreCompletion
  const completions: ChoreCompletion[] = (dayRecord.chore_completions).map((c) => ({
    id: c.id,
    dayRecordId: c.day_record_id,
    choreAssignmentId: c.chore_assignment_id,
    choreNameSnapshot: c.chore_name_snapshot,
    penaltySnapshot: c.penalty_snapshot,
    isImportantSnapshot: c.is_important_snapshot,
    completedAt: c.completed_at,
  }))

  // Fetch effort levels for end-day
  const { data: effortLevels } = await supabase
    .from('effort_levels')
    .select()
    .eq('family_id', kid.family_id)
    .order('points', { ascending: false })

  const typedEffortLevels: EffortLevel[] = (effortLevels ?? []).map((e) => ({
    id: e.id,
    familyId: e.family_id,
    name: e.name,
    points: e.points,
  }))

  const allChoresDone = completions.every((c) => c.completedAt !== null)
  const isEnded = dayRecord.ended_at !== null
  const isToday = date === today

  const displayDate = new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="space-y-6">
      {/* Date Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            {isToday ? "Today's Chores" : displayDate}
          </h1>
          {isToday && (
            <p className="text-gray-500 mt-1">{displayDate}</p>
          )}
        </div>
        {isEnded && (
          <div className="px-4 py-2 bg-gray-100 text-gray-600 rounded-xl font-medium text-sm">
            Day Ended ✓
          </div>
        )}
      </div>

      {/* Chore List */}
      <ChoreList
        completions={completions}
        dayRecordId={dayRecord.id}
        isRestDay={dayRecord.is_rest_day}
        isEnded={isEnded}
      />

      {/* Actions (only if not ended) */}
      {!isEnded && (
        <div className="flex flex-wrap items-center gap-4 pt-4 border-t">
          <RestDayButton
            dayRecordId={dayRecord.id}
            kidPoints={kid.points}
            isRestDay={dayRecord.is_rest_day}
          />
          <EndDayButton
            dayRecordId={dayRecord.id}
            effortLevels={typedEffortLevels}
            allChoresDone={allChoresDone}
          />
        </div>
      )}
    </div>
  )
}
