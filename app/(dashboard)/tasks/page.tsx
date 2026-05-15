import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getAvailableTasksForKid, getCompletedOneTimeTasks } from '@/lib/db/tasks'
import { TaskList } from '@/components/task-list/TaskList'
import { todayInTimezone } from '@/lib/chore-schedule'
import type { Task } from '@/lib/types'

export default async function TasksPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: kid } = await supabase
    .from('kids')
    .select('id, family_id')
    .eq('supabase_user_id', user.id)
    .maybeSingle()

  if (!kid) redirect('/admin')

  const { data: family } = await supabase
    .from('families')
    .select('timezone')
    .eq('id', kid.family_id)
    .single()

  const familyTimezone = family?.timezone ?? 'UTC'

  const [allAvailableTasks, allCompletedOneTimeTasks] = await Promise.all([
    getAvailableTasksForKid(kid.id, kid.family_id, familyTimezone),
    getCompletedOneTimeTasks(kid.id, kid.family_id),
  ])

  // Available one-time tasks (not yet completed)
  const availableOneTimeTasks = allAvailableTasks.filter(
    (t) => t.taskType === 'one_time' && !t.completedForNow
  )

  // Today-completed one-time tasks (still in available list for undo support)
  const todayCompletedOneTimeTasks = allAvailableTasks.filter(
    (t) => t.taskType === 'one_time' && t.completedForNow
  )
  const todayCompletedIds = new Set(todayCompletedOneTimeTasks.map((t) => t.id))

  // Previously-completed one-time tasks (completed before today, no undo)
  const previouslyCompleted: Task[] = allCompletedOneTimeTasks.filter(
    (t) => !todayCompletedIds.has(t.id)
  )

  const hasCompleted = todayCompletedOneTimeTasks.length > 0 || previouslyCompleted.length > 0

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Tasks</h1>

      {/* Available one-time tasks */}
      {availableOneTimeTasks.length === 0 && !hasCompleted ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-2xl mb-2">🎯</p>
          <p className="text-sm">No tasks available right now.</p>
        </div>
      ) : (
        <>
          {availableOneTimeTasks.length > 0 && (
            <TaskList tasks={availableOneTimeTasks} />
          )}

          {availableOneTimeTasks.length === 0 && hasCompleted && (
            <div className="text-center py-6 text-gray-400">
              <p className="text-sm">All tasks completed!</p>
            </div>
          )}
        </>
      )}

      {/* Completed section */}
      {hasCompleted && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-gray-500">Completed</h2>

          {/* Today-completed (with undo support via TaskList/TaskItem) */}
          {todayCompletedOneTimeTasks.length > 0 && (
            <TaskList tasks={todayCompletedOneTimeTasks} />
          )}

          {/* Previously-completed (simple display, no undo) */}
          {previouslyCompleted.map((task) => (
            <div
              key={task.id}
              className="flex items-center gap-3 p-4 rounded-xl border-2 border-green-200 bg-green-50"
            >
              <div className="p-2.5 rounded-full shrink-0 bg-green-100 text-green-600">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate text-gray-400 line-through">{task.name}</p>
                <span className="text-xs text-green-700 border border-green-300 rounded-full px-2 py-0.5">
                  +{task.points} pts
                </span>
              </div>
              <span className="text-xs text-green-600 bg-green-100 border-0 rounded-full px-2 py-0.5">
                done
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
