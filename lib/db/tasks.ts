import { createSupabaseServerClient } from '@/lib/supabase/server'
import type { Task } from '@/lib/types'

function mapTask(row: {
  id: string
  family_id: string
  name: string
  points: number
  task_type: 'one_time' | 'repeated'
  max_completions: number | null
  deleted_at: string | null
}): Task {
  return {
    id: row.id,
    familyId: row.family_id,
    name: row.name,
    points: row.points,
    taskType: row.task_type,
    maxCompletions: row.max_completions,
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

export async function getAvailableTasksForKid(kidId: string, familyId: string): Promise<Task[]> {
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
    .select('task_id')
    .eq('kid_id', kidId)
    .in('task_id', taskIds)
  if (completionsError) throw completionsError

  const completionCounts = new Map<string, number>()
  for (const c of completions ?? []) {
    completionCounts.set(c.task_id, (completionCounts.get(c.task_id) ?? 0) + 1)
  }

  return allTasks
    .filter((task) => {
      const count = completionCounts.get(task.id) ?? 0
      if (task.task_type === 'one_time') return count === 0
      if (task.max_completions !== null) return count < task.max_completions
      return true
    })
    .map(mapTask)
}

export async function createTask(
  familyId: string,
  name: string,
  points: number,
  taskType: 'one_time' | 'repeated',
  maxCompletions: number | null
): Promise<void> {
  const supabase = await createSupabaseServerClient()
  const { error } = await supabase
    .from('tasks')
    .insert({ family_id: familyId, name, points, task_type: taskType, max_completions: maxCompletions })
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
