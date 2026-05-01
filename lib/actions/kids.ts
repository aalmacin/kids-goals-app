'use server'

import { revalidatePath } from 'next/cache'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { createSupabaseServiceClient } from '@/lib/supabase/server'
import { createKid, getKidsByFamily, getKidByFamilyAndName, updateKid, deleteKid } from '@/lib/db/kids'
import { getFamilyByParentId } from '@/lib/db/families'

async function requireParentFamily() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const family = await getFamilyByParentId(user.id)
  if (!family) throw new Error('Family not found')

  return { user, family }
}

export async function addKid(formData: FormData) {
  const name = (formData.get('name') as string).trim()
  const month = formData.get('birthday_month') as string
  const day = formData.get('birthday_day') as string
  const year = formData.get('birthday_year') as string
  const birthday = `${year}-${month}-${day}`
  const passcode = formData.get('passcode') as string
  const { redirect } = await import('next/navigation')

  if (passcode.length < 4 || passcode.length > 6) {
    redirect(`/admin/kids?error=${encodeURIComponent('Passcode must be 4-6 digits')}`)
  }

  const { family } = await requireParentFamily()

  // Check name uniqueness within family
  const existing = await getKidByFamilyAndName(family.id, name)
  if (existing) redirect(`/admin/kids?error=${encodeURIComponent('A kid with that name already exists in this family')}`)

  const familySlug = family.name.toLowerCase().replace(/\s+/g, '-')
  const service = createSupabaseServiceClient()

  // Create auth user with a temp email, then update to use the assigned user ID
  const { data: authUser, error: authError } = await service.auth.admin.createUser({
    email: `kid-tmp-${crypto.randomUUID()}@${familySlug}.internal`,
    password: passcode,
    email_confirm: true,
  })
  if (authError || !authUser?.user) {
    redirect(`/admin/kids?error=${encodeURIComponent(authError?.message ?? 'Failed to create auth user')}`)
  }

  const authUserId = authUser.user!.id
  // Update email to use actual auth user ID so loginKid can reconstruct it
  const syntheticEmail = `kid-${authUserId}@${familySlug}.internal`
  await service.auth.admin.updateUserById(authUserId, { email: syntheticEmail })
  try {
    await createKid(family.id, authUserId, name, birthday)
  } catch (err) {
    // Roll back auth user if kid creation fails
    await service.auth.admin.deleteUser(authUserId)
    redirect(`/admin/kids?error=${encodeURIComponent(err instanceof Error ? err.message : 'Failed to create kid')}`)
  }

  revalidatePath('/admin/kids')
}

export async function editKid(kidId: string, formData: FormData) {
  const name = (formData.get('name') as string).trim()
  const birthday = formData.get('birthday') as string

  const { family } = await requireParentFamily()

  // Check name uniqueness (excluding this kid)
  const { data: existing } = await (await createSupabaseServerClient())
    .from('kids')
    .select('id')
    .eq('family_id', family.id)
    .eq('name', name)
    .neq('id', kidId)
    .maybeSingle()

  if (existing) {
    const { redirect } = await import('next/navigation')
    redirect(`/admin/kids?error=${encodeURIComponent('A kid with that name already exists')}`)
  }

  await updateKid(kidId, { name, birthday })
  revalidatePath('/admin/kids')
}

export async function removeKid(kidId: string) {
  const { family } = await requireParentFamily()

  // Get kid to delete their auth user too
  const supabase = await createSupabaseServerClient()
  const { data: kid } = await supabase
    .from('kids')
    .select('supabase_user_id')
    .eq('id', kidId)
    .eq('family_id', family.id)
    .single()

  if (!kid) return

  await deleteKid(kidId)

  // Delete auth user
  const service = createSupabaseServiceClient()
  await service.auth.admin.deleteUser(kid.supabase_user_id)

  revalidatePath('/admin/kids')
}

export async function getKids() {
  const { family } = await requireParentFamily()
  return getKidsByFamily(family.id)
}
