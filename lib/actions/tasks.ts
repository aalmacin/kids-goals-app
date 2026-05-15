'use server'

import { revalidatePath } from 'next/cache'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getFamilyByParentId } from '@/lib/db/families'
import {
  createTask,
  softDeleteTask,
  getTaskCompletionCount,
  getTaskTodayCompletionCount,
  undoLastTaskCompletion,
} from '@/lib/db/tasks'
import { insertActivityLog } from '@/lib/db/activity-log'

async function requireParentFamily() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const family = await getFamilyByParentId(user.id)
  if (!family) throw new Error('Family not found')

  return { user, family }
}

async function requireKid() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: kid } = await supabase
    .from('kids')
    .select('id, family_id')
    .eq('supabase_user_id', user.id)
    .maybeSingle()

  if (!kid) throw new Error('Kid not found')
  return { supabase, kid }
}

async function getFamilyTimezone(familyId: string): Promise<string> {
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase
    .from('families')
    .select('timezone')
    .eq('id', familyId)
    .single()
  return data?.timezone ?? 'UTC'
}

export async function createTaskAction(formData: FormData): Promise<void> {
  const name = (formData.get('name') as string).trim()
  const points = Number(formData.get('points'))
  const taskType = formData.get('taskType') as 'one_time' | 'repeated'
  const maxCompletionsRaw = formData.get('maxCompletions')
  const maxCompletions =
    maxCompletionsRaw && String(maxCompletionsRaw).trim() !== ''
      ? Number(maxCompletionsRaw)
      : null
  const oncePerDay = taskType === 'repeated' && formData.get('oncePerDay') === 'on'

  if (!name) throw new Error('Task name is required')
  if (!points || points <= 0) throw new Error('Points must be greater than 0')
  if (taskType !== 'one_time' && taskType !== 'repeated') throw new Error('Invalid task type')
  if (maxCompletions !== null && maxCompletions <= 0) throw new Error('Max completions must be greater than 0')

  const { family } = await requireParentFamily()
  await createTask(family.id, name, points, taskType, maxCompletions, oncePerDay)
  revalidatePath('/admin/tasks')
}

export async function deleteTaskAction(taskId: string): Promise<void> {
  await requireParentFamily()
  await softDeleteTask(taskId)
  revalidatePath('/admin/tasks')
}

export async function completeTaskAction(taskId: string): Promise<void> {
  const { supabase, kid } = await requireKid()

  const { data: task, error: taskError } = await supabase
    .from('tasks')
    .select()
    .eq('id', taskId)
    .is('deleted_at', null)
    .maybeSingle()

  if (taskError) throw taskError
  if (!task) throw new Error('Task not found')

  const completionCount = await getTaskCompletionCount(taskId, kid.id)

  if (task.task_type === 'one_time' && completionCount > 0) {
    throw new Error('Task already completed')
  }
  if (task.task_type === 'repeated' && task.max_completions !== null && completionCount >= task.max_completions) {
    throw new Error('Task completion limit reached')
  }

  if (task.task_type === 'repeated' && task.once_per_day) {
    const familyTimezone = await getFamilyTimezone(kid.family_id)
    const todayCount = await getTaskTodayCompletionCount(taskId, kid.id, familyTimezone)
    if (todayCount > 0) {
      throw new Error('Task already completed today')
    }
  }

  const { error: insertError } = await supabase.from('task_completions').insert({
    task_id: taskId,
    kid_id: kid.id,
    task_name_snapshot: task.name,
    points_snapshot: task.points,
  })
  if (insertError) throw insertError

  await insertActivityLog({
    family_id: kid.family_id,
    kid_id: kid.id,
    actor_type: 'kid',
    action_type: 'task_completed',
    metadata: { task_id: taskId, task_name: task.name, task_type: task.task_type },
    points_delta: task.points,
  })

  revalidatePath('/')
}

export async function undoLastTaskCompletionAction(taskId: string): Promise<void> {
  const { supabase, kid } = await requireKid()

  const { data: task, error: taskError } = await supabase
    .from('tasks')
    .select()
    .eq('id', taskId)
    .is('deleted_at', null)
    .maybeSingle()

  if (taskError) throw taskError
  if (!task) throw new Error('Task not found')

  const familyTimezone = await getFamilyTimezone(kid.family_id)
  const result = await undoLastTaskCompletion(taskId, kid.id, familyTimezone)

  if (!result) {
    throw new Error('No completion to undo today')
  }

  await insertActivityLog({
    family_id: kid.family_id,
    kid_id: kid.id,
    actor_type: 'kid',
    action_type: 'task_completion_reversed',
    metadata: { task_id: taskId, task_name: task.name, task_type: task.task_type },
    points_delta: -result.pointsSnapshot,
  })

  revalidatePath('/')
}
