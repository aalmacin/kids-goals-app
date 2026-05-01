import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createSupabaseServiceClient } from '@/lib/supabase/server'

const PASSWORD = 'TestPassword123!'

describe('Activity Log Integration', () => {
  let parentUserId: string
  let familyId: string
  let kidId: string
  let kidAuthId: string

  beforeAll(async () => {
    const service = createSupabaseServiceClient()

    const { data: parent } = await service.auth.admin.createUser({
      email: `log-parent-${Date.now()}@example.com`,
      password: PASSWORD,
      email_confirm: true,
    })
    parentUserId = parent.user!.id

    const { data: family } = await service
      .from('families')
      .insert({ name: `LogFamily ${Date.now()}`, parent_id: parentUserId })
      .select()
      .single()
    familyId = family!.id

    const kidUuid = crypto.randomUUID()
    const { data: kidAuth } = await service.auth.admin.createUser({
      email: `kid-${kidUuid}@logfamily.internal`,
      password: '1234',
      email_confirm: true,
    })
    kidAuthId = kidAuth.user!.id

    const { data: kid } = await service
      .from('kids')
      .insert({ family_id: familyId, supabase_user_id: kidAuthId, name: 'LogKid', birthday: '2015-01-01' })
      .select()
      .single()
    kidId = kid!.id
  })

  afterAll(async () => {
    const service = createSupabaseServiceClient()
    await service.auth.admin.deleteUser(kidAuthId)
    await service.auth.admin.deleteUser(parentUserId)
  })

  it('inserts activity log entries', async () => {
    const service = createSupabaseServiceClient()

    const { error } = await service.from('activity_log').insert({
      family_id: familyId,
      kid_id: kidId,
      actor_type: 'kid',
      action_type: 'chore_completed',
      metadata: { chore_name: 'Brush Teeth' },
      points_delta: null,
    })

    expect(error).toBeNull()
  })

  it('retrieves entries in reverse chronological order', async () => {
    const service = createSupabaseServiceClient()

    // Insert two entries
    await service.from('activity_log').insert([
      { family_id: familyId, kid_id: kidId, actor_type: 'kid', action_type: 'chore_completed', metadata: {} },
      { family_id: familyId, kid_id: kidId, actor_type: 'kid', action_type: 'reward_redeemed', metadata: {}, points_delta: -50 },
    ])

    const { data, error } = await service
      .from('activity_log')
      .select()
      .eq('family_id', familyId)
      .order('created_at', { ascending: false })

    expect(error).toBeNull()
    expect(data!.length).toBeGreaterThanOrEqual(2)
    // Verify descending order
    for (let i = 1; i < data!.length; i++) {
      expect(new Date(data![i - 1].created_at).getTime()).toBeGreaterThanOrEqual(
        new Date(data![i].created_at).getTime()
      )
    }
  })
})
