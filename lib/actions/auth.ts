'use server'

import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { createFamily, getFamilyByName, getFamilyByParentId } from '@/lib/db/families'

export async function loginParent(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) redirect(`/login?error=${encodeURIComponent(error.message)}`)

  redirect('/')
}

export async function logout() {
  const supabase = await createSupabaseServerClient()
  await supabase.auth.signOut()
  redirect('/login')
}

export async function setupFamily(formData: FormData) {
  const name = (formData.get('name') as string).trim()

  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const existing = await getFamilyByName(name)
  if (existing) redirect(`/admin/family?error=${encodeURIComponent('Family name already taken')}`)

  await createFamily(user.id, name)
  redirect('/admin')
}

export async function getSession() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function getParentFamily() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  return getFamilyByParentId(user.id)
}

export async function loginKid(formData: FormData) {
  const familyName = (formData.get('familyName') as string).trim()
  const kidName = (formData.get('kidName') as string).trim()
  const passcode = formData.get('passcode') as string

  const supabase = await createSupabaseServerClient()

  // Look up family by name
  const family = await getFamilyByName(familyName)
  if (!family) redirect(`/kid-login?error=${encodeURIComponent('Family not found')}`)

  // Look up kid by family + name to get their supabase_user_id
  const { data: kid, error: kidError } = await supabase
    .from('kids')
    .select('supabase_user_id')
    .eq('family_id', family!.id)
    .eq('name', kidName)
    .maybeSingle()

  if (kidError || !kid) redirect(`/kid-login?error=${encodeURIComponent('Kid not found in this family')}`)

  // Construct synthetic email
  const familySlug = familyName.toLowerCase().replace(/\s+/g, '-')
  const email = `kid-${kid!.supabase_user_id}@${familySlug}.internal`

  const { error: authError } = await supabase.auth.signInWithPassword({
    email,
    password: passcode,
  })
  if (authError) redirect(`/kid-login?error=${encodeURIComponent('Invalid passcode')}`)

  redirect('/')
}
