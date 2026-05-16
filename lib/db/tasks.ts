import { createSupabaseServerClient } from '@/lib/supabase/server'
import type { Task, TaskWithCounts } from '@/lib/types'

function mapTask(row: {
  id: string
  family_id: string
  name: string
  points: number
  task_type: 'one_time' | 'repeated'
  max_completions: number | null
  once_per_day: boolean
  deleted_at: string | null
}): Task {
  return {
    id: row.id,
    familyId: row.family_id,
    name: row.name,
    points: row.points,
    taskType: row.task_type,
    maxCompletions: row.max_completions,
    oncePerDay: row.once_per_day,
    deletedAt: row.deleted_at,
  }
}

export async function getTaskLibrary(familyId: string): Promise<Task[]> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('tasks')
    .select()
    .eq('family_id', familyId)
    .is('deleted_at', null)
    .order('name')
  if (error) throw error
  return data.map(mapTask)
}

export async function getAvailableTasksForKid(
  kidId: string,
  familyId: string,
  familyTimezone: string
): Promise<TaskWithCounts[]> {
  const supabase = await createSupabaseServerClient()

  const { data: allTasks, error: tasksError } = await supabase
    .from('tasks')
    .select()
    .eq('family_id', familyId)
    .is('deleted_at', null)
    .order('name')
  if (tasksError) throw tasksError

  if (allTasks.length === 0) return []

  const taskIds = allTasks.map((t) => t.id)
  const { data: completions, error: completionsError } = await supabase
    .from('task_completions')
    .select('task_id, completed_at')
    .eq('kid_id', kidId)
    .in('task_id', taskIds)
  if (completionsError) throw completionsError

  const todayStart = getTodayStart(familyTimezone)

  const totalCounts = new Map<string, number>()
  const todayCounts = new Map<string, number>()
  for (const c of completions ?? []) {
    totalCounts.set(c.task_id, (totalCounts.get(c.task_id) ?? 0) + 1)
    if (new Date(c.completed_at) >= todayStart) {
      todayCounts.set(c.task_id, (todayCounts.get(c.task_id) ?? 0) + 1)
    }
  }

  return allTasks
    .filter((task) => {
      const totalCount = totalCounts.get(task.id) ?? 0
      const todayCount = todayCounts.get(task.id) ?? 0

      // Keep tasks completed today so the kid can undo
      if (todayCount > 0) return true

      if (task.task_type === 'one_time') return totalCount === 0
      if (task.max_completions !== null) return totalCount < task.max_completions
      return true
    })
    .map((task) => {
      const totalCount = totalCounts.get(task.id) ?? 0
      const todayCount = todayCounts.get(task.id) ?? 0

      let completedForNow = false
      if (task.task_type === 'one_time' && totalCount > 0) completedForNow = true
      if (task.once_per_day && todayCount > 0) completedForNow = true
      if (task.max_completions !== null && totalCount >= task.max_completions) completedForNow = true

      return {
        ...mapTask(task),
        todayCount,
        remaining: task.max_completions !== null ? task.max_completions - totalCount : null,
        completedForNow,
      }
    })
}

export async function createTask(
  familyId: string,
  name: string,
  points: number,
  taskType: 'one_time' | 'repeated',
  maxCompletions: number | null,
  oncePerDay: boolean
): Promise<void> {
  const supabase = await createSupabaseServerClient()
  const { error } = await supabase
    .from('tasks')
    .insert({
      family_id: familyId,
      name,
      points,
      task_type: taskType,
      max_completions: maxCompletions,
      once_per_day: oncePerDay,
    })
  if (error) throw error
}

export async function softDeleteTask(taskId: string): Promise<void> {
  const supabase = await createSupabaseServerClient()
  const { error } = await supabase
    .from('tasks')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', taskId)
  if (error) throw error
}

export async function getTaskCompletionCount(taskId: string, kidId: string): Promise<number> {
  const supabase = await createSupabaseServerClient()
  const { count, error } = await supabase
    .from('task_completions')
    .select('id', { count: 'exact', head: true })
    .eq('task_id', taskId)
    .eq('kid_id', kidId)
  if (error) throw error
  return count ?? 0
}

export async function getTaskTodayCompletionCount(
  taskId: string,
  kidId: string,
  familyTimezone: string
): Promise<number> {
  const supabase = await createSupabaseServerClient()
  const todayStart = getTodayStart(familyTimezone)
  const { count, error } = await supabase
    .from('task_completions')
    .select('id', { count: 'exact', head: true })
    .eq('task_id', taskId)
    .eq('kid_id', kidId)
    .gte('completed_at', todayStart.toISOString())
  if (error) throw error
  return count ?? 0
}

export async function undoLastTaskCompletion(
  taskId: string,
  kidId: string,
  familyTimezone: string
): Promise<{ pointsSnapshot: number } | null> {
  const supabase = await createSupabaseServerClient()
  const todayStart = getTodayStart(familyTimezone)

  const { data: lastCompletion, error: fetchError } = await supabase
    .from('task_completions')
    .select('id, points_snapshot')
    .eq('task_id', taskId)
    .eq('kid_id', kidId)
    .gte('completed_at', todayStart.toISOString())
    .order('completed_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (fetchError) throw fetchError
  if (!lastCompletion) return null

  const { error: deleteError } = await supabase
    .from('task_completions')
    .delete()
    .eq('id', lastCompletion.id)

  if (deleteError) throw deleteError
  return { pointsSnapshot: lastCompletion.points_snapshot }
}

export async function getCompletedOneTimeTasks(
  kidId: string,
  familyId: string
): Promise<Task[]> {
  const supabase = await createSupabaseServerClient()

  const { data: completions, error: completionsError } = await supabase
    .from('task_completions')
    .select('task_id')
    .eq('kid_id', kidId)

  if (completionsError) throw completionsError
  if (!completions || completions.length === 0) return []

  const completedTaskIds = [...new Set(completions.map((c) => c.task_id))]

  const { data, error } = await supabase
    .from('tasks')
    .select()
    .eq('family_id', familyId)
    .eq('task_type', 'one_time')
    .in('id', completedTaskIds)
    .is('deleted_at', null)
    .order('name')

  if (error) throw error
  return data.map(mapTask)
}

export function getTodayStart(timezone: string): Date {
  const now = new Date()
  const dateStr = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now)

  const tzName =
    new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      timeZoneName: 'longOffset',
    })
      .formatToParts(now)
      .find((p) => p.type === 'timeZoneName')?.value ?? 'GMT'

  // "GMT-04:00" → "-04:00", "GMT+05:30" → "+05:30", "GMT" → "+00:00"
  const offset = tzName === 'GMT' ? '+00:00' : tzName.slice(3)
  return new Date(`${dateStr}T00:00:00${offset}`)
}
