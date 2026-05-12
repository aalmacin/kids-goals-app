import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createSupabaseServiceClient } from '@/lib/supabase/server'

const PASSWORD = 'TestPassword123!'

describe('Chore Management Integration', () => {
  let parentUserId: string
  let familyId: string
  let kidId: string
  let kidAuthId: string
  let choreId: string

  beforeAll(async () => {
    const service = createSupabaseServiceClient()

    const { data: parent } = await service.auth.admin.createUser({
      email: `chore-parent-${Date.now()}@example.com`,
      password: PASSWORD,
      email_confirm: true,
    })
    parentUserId = parent.user!.id

    const { data: family } = await service
      .from('families')
      .insert({ name: `ChoreTestFamily ${Date.now()}`, parent_id: parentUserId })
      .select()
      .single()
    familyId = family!.id

    const kidUuid = crypto.randomUUID()
    const { data: kidAuth } = await service.auth.admin.createUser({
      email: `kid-${kidUuid}@choretestfamily.internal`,
      password: '1234',
      email_confirm: true,
    })
    kidAuthId = kidAuth.user!.id

    const { data: kid } = await service
      .from('kids')
      .insert({ family_id: familyId, supabase_user_id: kidAuthId, name: 'TestKid', birthday: '2015-01-01' })
      .select()
      .single()
    kidId = kid!.id
  })

  afterAll(async () => {
    const service = createSupabaseServiceClient()
    if (choreId) await service.from('chores').delete().eq('id', choreId)
    await service.auth.admin.deleteUser(kidAuthId)
    await service.auth.admin.deleteUser(parentUserId)
  })

  it('creates a chore in the library', async () => {
    const service = createSupabaseServiceClient()
    const { data, error } = await service
      .from('chores')
      .insert({ family_id: familyId, name: 'Brush Teeth', penalty: 10, is_important: true, icon: 'smile' })
      .select()
      .single()

    expect(error).toBeNull()
    expect(data?.name).toBe('Brush Teeth')
    expect(data?.reward_points).toBe(0)
    choreId = data!.id
  })

  it('creates a chore with reward_points', async () => {
    const service = createSupabaseServiceClient()
    const { data, error } = await service
      .from('chores')
      .insert({ family_id: familyId, name: 'Make Bed', penalty: 5, reward_points: 8, is_important: false, icon: 'home' })
      .select()
      .single()

    expect(error).toBeNull()
    expect(data?.reward_points).toBe(8)

    await service.from('chores').delete().eq('id', data!.id)
  })

  it('updates reward_points on a chore', async () => {
    const service = createSupabaseServiceClient()
    const { error } = await service
      .from('chores')
      .update({ reward_points: 15 })
      .eq('id', choreId)

    expect(error).toBeNull()

    const { data } = await service.from('chores').select('reward_points').eq('id', choreId).single()
    expect(data?.reward_points).toBe(15)
  })

  it('rejects negative reward_points', async () => {
    const service = createSupabaseServiceClient()
    const { error } = await service
      .from('chores')
      .insert({ family_id: familyId, name: 'Bad Chore', penalty: 0, reward_points: -1, is_important: false, icon: 'x' })

    expect(error).not.toBeNull()
  })

  it('assigns chore independently to a kid', async () => {
    const service = createSupabaseServiceClient()
    const { data, error } = await service
      .from('chore_assignments')
      .insert({ chore_id: choreId, kid_id: kidId })
      .select()
      .single()

    expect(error).toBeNull()
    expect(data?.kid_id).toBe(kidId)
  })

  it('soft-deletes chore (deleted_at set)', async () => {
    const service = createSupabaseServiceClient()
    const { error } = await service
      .from('chores')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', choreId)

    expect(error).toBeNull()

    const { data } = await service.from('chores').select().eq('id', choreId).single()
    expect(data?.deleted_at).not.toBeNull()
  })
})
