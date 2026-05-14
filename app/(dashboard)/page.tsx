import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getOrCreateDayRecord } from '@/lib/db/day-records'
import { getAvailableTasksForKid } from '@/lib/db/tasks'
import { ChoreList } from '@/components/chore-list/ChoreList'
import { UnavailableChoreSection } from '@/components/chore-list/UnavailableChoreSection'
import { TaskList } from '@/components/task-list/TaskList'
import { EndDayButton } from '@/components/end-day/EndDayButton'
import { UndoEndDayButton } from '@/components/end-day/UndoEndDayButton'
import { RestDayButton } from '@/components/rest-day/RestDayButton'
import { isChoreAvailableOn, dayOfWeekFromDate, getNextAvailableDate, todayInTimezone } from '@/lib/chore-schedule'
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

  const { data: family } = await supabase
    .from('families')
    .select('timezone')
    .eq('id', kid.family_id)
    .single()

  const familyTimezone = family?.timezone ?? 'UTC'

  const params = await searchParams
  const today = todayInTimezone(familyTimezone)
  const date = params.date ?? today

  const [dayRecord, availableTasks] = await Promise.all([
    getOrCreateDayRecord(kid.id, date),
    getAvailableTasksForKid(kid.id, kid.family_id),
  ])

  // Compute unavailable chores (assigned but schedule-blocked for this date)
  const dayOfWeek = dayOfWeekFromDate(date)
  const seededAssignmentIds = new Set(
    dayRecord.chore_completions.map((c) => c.chore_assignment_id)
  )

  const { data: rawAssignments } = await supabase
    .from('chore_assignments')
    .select('id, chore_id')
    .eq('kid_id', kid.id)

  const assignedChoreIds = (rawAssignments ?? []).map((a) => a.chore_id)

  const { data: assignedChores } = assignedChoreIds.length > 0
    ? await supabase
        .from('chores')
        .select('id, name, icon, deleted_at, allowed_days')
        .in('id', assignedChoreIds)
    : { data: [] as { id: string; name: string; icon: string; deleted_at: string | null; allowed_days: number[] | null }[] }

  const assignmentByChoreId = new Map(
    (rawAssignments ?? []).map((a) => [a.chore_id, a.id])
  )

  const unavailableChores = (assignedChores ?? [])
    .filter((chore) => {
      const assignmentId = assignmentByChoreId.get(chore.id) ?? ''
      return (
        !chore.deleted_at &&
        !seededAssignmentIds.has(assignmentId) &&
        !isChoreAvailableOn(chore.allowed_days, dayOfWeek)
      )
    })
    .map((chore) => {
      const nextDate = getNextAvailableDate(chore.allowed_days, new Date(date + 'T12:00:00'), familyTimezone)
      return {
        id: chore.id,
        name: chore.name,
        icon: chore.icon,
        nextAvailableDay: nextDate ? nextDate.getDay() : null,
      }
    })

  // Map DB completions to typed ChoreCompletion
  const completions: ChoreCompletion[] = dayRecord.chore_completions.map((c) => ({
    id: c.id,
    dayRecordId: c.day_record_id,
    choreAssignmentId: c.chore_assignment_id,
    choreNameSnapshot: c.chore_name_snapshot,
    penaltySnapshot: c.penalty_snapshot,
    isImportantSnapshot: c.is_important_snapshot,
    rewardSnapshot: c.reward_snapshot,
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
          <div className="flex items-center gap-3">
            <div className="px-4 py-2 bg-gray-100 text-gray-600 rounded-xl font-medium text-sm">
              Day Ended ✓
            </div>
            <UndoEndDayButton dayRecordId={dayRecord.id} />
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

      {/* Unavailable chores (schedule-blocked for today) */}
      <UnavailableChoreSection chores={unavailableChores} />

      {/* Tasks */}
      {availableTasks.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xl font-semibold text-gray-700">Tasks</h2>
          <TaskList tasks={availableTasks} />
        </div>
      )}

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
