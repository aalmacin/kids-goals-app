'use server'

import { revalidatePath } from 'next/cache'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import {
  createChore,
  getChoreLibrary,
  updateChore,
  softDeleteChore,
  assignChore,
  unassignChore,
} from '@/lib/db/chores'
import { getFamilyByParentId } from '@/lib/db/families'

async function requireParentFamily() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const family = await getFamilyByParentId(user.id)
  if (!family) throw new Error('Family not found')

  return { user, family }
}

export async function getChoreLibraryAction() {
  const { family } = await requireParentFamily()
  return getChoreLibrary(family.id)
}

function parseAllowedDays(formData: FormData): number[] | undefined {
  const raw = formData.get('allowedDays') as string | null
  if (!raw) return undefined
  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return undefined
    return parsed.filter((d) => typeof d === 'number' && d >= 0 && d <= 6)
  } catch {
    return undefined
  }
}

export async function createChoreAction(formData: FormData) {
  const name = (formData.get('name') as string).trim()
  const penalty = Number(formData.get('penalty') ?? 0)
  const reward = Number(formData.get('reward') ?? 0)
  const isImportant = formData.get('isImportant') === 'true'
  const icon = formData.get('icon') as string
  const allowedDays = parseAllowedDays(formData)

  const { family } = await requireParentFamily()
  await createChore(family.id, name, penalty, reward, isImportant, icon, allowedDays)
  revalidatePath('/admin/chores')
}

export async function updateChoreAction(
  choreId: string,
  _prevState: { error: string | null; savedAt: number },
  formData: FormData
): Promise<{ error: string | null; savedAt: number }> {
  const name = (formData.get('name') as string).trim()
  const penalty = Number(formData.get('penalty') ?? 0)
  const reward = Number(formData.get('reward') ?? 0)
  const isImportant = formData.get('isImportant') === 'true'
  const icon = formData.get('icon') as string
  const allowedDays = parseAllowedDays(formData)

  try {
    await requireParentFamily()
    await updateChore(choreId, {
      name,
      penalty,
      reward_points: reward,
      is_important: isImportant,
      icon,
      allowed_days: allowedDays !== undefined
        ? (allowedDays.length > 0 ? allowedDays : null)
        : undefined,
    })
  } catch (err) {
    console.error('[updateChoreAction] Failed to update chore:', choreId, err)
    return { error: 'Failed to save chore. Please try again.', savedAt: 0 }
  }

  revalidatePath('/admin/chores')
  return { error: null, savedAt: Date.now() }
}

export async function updateChoreScheduleAction(
  choreId: string,
  allowedDays: number[]
): Promise<void> {
  await requireParentFamily()
  const validDays = allowedDays.filter((d) => d >= 0 && d <= 6)
  await updateChore(choreId, {
    allowed_days: validDays.length > 0 ? validDays : null,
  })
  revalidatePath('/admin/chores')
}

export async function deleteChoreAction(choreId: string) {
  await requireParentFamily()
  await softDeleteChore(choreId)
  revalidatePath('/admin/chores')
}

export async function assignChoreAction(choreId: string, kidId: string) {
  await requireParentFamily()
  await assignChore(choreId, kidId)
  revalidatePath('/admin/chores')
}

export async function unassignChoreAction(choreId: string, kidId: string) {
  await requireParentFamily()
  await unassignChore(choreId, kidId)
  revalidatePath('/admin/chores')
}

export async function getChoreAssignmentsAction() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const family = await getFamilyByParentId(user.id)
  if (!family) throw new Error('Family not found')

  const { data, error } = await supabase
    .from('chore_assignments')
    .select('*, chore:chores(*), kid:kids(*)')
    .in(
      'kid_id',
      await supabase
        .from('kids')
        .select('id')
        .eq('family_id', family.id)
        .then(({ data }) => data?.map((k) => k.id) ?? [])
    )

  if (error) throw error
  return data
}
