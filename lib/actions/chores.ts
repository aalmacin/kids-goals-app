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

export async function createChoreAction(formData: FormData) {
  const name = (formData.get('name') as string).trim()
  const penalty = Number(formData.get('penalty') ?? 0)
  const isImportant = formData.get('isImportant') === 'true'
  const icon = formData.get('icon') as string

  const { family } = await requireParentFamily()
  await createChore(family.id, name, penalty, isImportant, icon)
  revalidatePath('/admin/chores')
}

export async function updateChoreAction(choreId: string, formData: FormData) {
  const name = (formData.get('name') as string).trim()
  const penalty = Number(formData.get('penalty') ?? 0)
  const isImportant = formData.get('isImportant') === 'true'
  const icon = formData.get('icon') as string

  await requireParentFamily()
  await updateChore(choreId, { name, penalty, is_important: isImportant, icon })
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
