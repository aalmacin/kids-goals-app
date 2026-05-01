import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createSupabaseServiceClient } from '@/lib/supabase/server'

// Requires running local Supabase: supabase start
const PASSWORD = 'TestPassword123!'

describe('Kid Account Management Integration', () => {
  let parentUserId: string
  let familyId: string
  let kidAuthUserId: string
  let kidId: string

  const familyName = `Kids Family ${crypto.randomUUID()}`
  const kidName = `TestKid ${Date.now()}`
  const kidBirthday = '2015-06-15'
  const passcode = '1234'

  beforeAll(async () => {
    const service = createSupabaseServiceClient()

    // Create parent
    const { data: parent } = await service.auth.admin.createUser({
      email: `parent-${Date.now()}@example.com`,
      password: PASSWORD,
      email_confirm: true,
    })
    parentUserId = parent.user!.id

    // Create family
    const { data: family } = await service
      .from('families')
      .insert({ name: familyName, parent_id: parentUserId })
      .select()
      .single()
    familyId = family!.id
  })

  afterAll(async () => {
    const service = createSupabaseServiceClient()
    if (kidAuthUserId) await service.auth.admin.deleteUser(kidAuthUserId)
    await service.auth.admin.deleteUser(parentUserId)
  })

  it('creates kid auth user and kid row', async () => {
    const service = createSupabaseServiceClient()
    const familySlug = familyName.toLowerCase().replace(/\s+/g, '-')

    // Create with temp email, then update to use auth user ID (matches loginKid reconstruction)
    const { data: authUser, error } = await service.auth.admin.createUser({
      email: `kid-tmp-${crypto.randomUUID()}@${familySlug}.internal`,
      password: passcode,
      email_confirm: true,
    })
    expect(error).toBeNull()
    kidAuthUserId = authUser.user!.id
    await service.auth.admin.updateUserById(kidAuthUserId, {
      email: `kid-${kidAuthUserId}@${familySlug}.internal`,
    })

    const { data: kid, error: kidError } = await service
      .from('kids')
      .insert({ family_id: familyId, supabase_user_id: kidAuthUserId, name: kidName, birthday: kidBirthday })
      .select()
      .single()

    expect(kidError).toBeNull()
    expect(kid?.name).toBe(kidName)
    kidId = kid!.id
  })

  it('rejects duplicate kid name in same family', async () => {
    const service = createSupabaseServiceClient()
    const kidUuid2 = crypto.randomUUID()
    const familySlug = familyName.toLowerCase().replace(/\s+/g, '-')
    const email2 = `kid-${kidUuid2}@${familySlug}.internal`

    const { data: authUser2 } = await service.auth.admin.createUser({
      email: email2,
      password: passcode,
      email_confirm: true,
    })

    const { error } = await service
      .from('kids')
      .insert({ family_id: familyId, supabase_user_id: authUser2.user!.id, name: kidName, birthday: kidBirthday })

    expect(error).not.toBeNull()
    await service.auth.admin.deleteUser(authUser2.user!.id)
  })

  it('kid can sign in with synthetic email and passcode', async () => {
    const service = createSupabaseServiceClient()
    const familySlug = familyName.toLowerCase().replace(/\s+/g, '-')
    const email = `kid-${kidAuthUserId}@${familySlug}.internal`

    const { data, error } = await service.auth.signInWithPassword({ email, password: passcode })
    expect(error).toBeNull()
    expect(data.user?.id).toBe(kidAuthUserId)
  })

  it('rejects wrong passcode', async () => {
    const service = createSupabaseServiceClient()
    const familySlug = familyName.toLowerCase().replace(/\s+/g, '-')
    const email = `kid-${kidAuthUserId}@${familySlug}.internal`

    const { error } = await service.auth.signInWithPassword({ email, password: 'wrongpasscode' })
    expect(error).not.toBeNull()
  })
})
