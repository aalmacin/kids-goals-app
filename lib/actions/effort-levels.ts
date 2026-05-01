'use server'

import { revalidatePath } from 'next/cache'
import { getFamilyByParentId } from '@/lib/db/families'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { createEffortLevel, getEffortLevels, updateEffortLevel, deleteEffortLevel } from '@/lib/db/effort-levels'

async function requireParentFamily() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  const family = await getFamilyByParentId(user.id)
  if (!family) throw new Error('Family not found')
  return { user, family }
}

export async function createEffortLevelAction(formData: FormData) {
  const name = (formData.get('name') as string).trim()
  const points = Number(formData.get('points') ?? 0)
  const { family } = await requireParentFamily()
  await createEffortLevel(family.id, name, points)
  revalidatePath('/admin/effort')
}

export async function updateEffortLevelAction(id: string, formData: FormData) {
  const name = (formData.get('name') as string).trim()
  const points = Number(formData.get('points') ?? 0)
  await requireParentFamily()
  await updateEffortLevel(id, { name, points })
  revalidatePath('/admin/effort')
}

export async function deleteEffortLevelAction(id: string) {
  await requireParentFamily()
  await deleteEffortLevel(id)
  revalidatePath('/admin/effort')
}

export async function getEffortLevelsAction() {
  const { family } = await requireParentFamily()
  return getEffortLevels(family.id)
}
