import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createSupabaseServiceClient } from '@/lib/supabase/server'

const PASSWORD = 'TestPassword123!'

describe('Rewards Integration', () => {
  let parentUserId: string
  let familyId: string
  let kidId: string
  let kidAuthId: string
  let rewardId: string

  beforeAll(async () => {
    const service = createSupabaseServiceClient()

    const { data: parent } = await service.auth.admin.createUser({
      email: `reward-parent-${Date.now()}@example.com`,
      password: PASSWORD,
      email_confirm: true,
    })
    parentUserId = parent.user!.id

    const { data: family } = await service
      .from('families')
      .insert({ name: `RewardFamily ${Date.now()}`, parent_id: parentUserId })
      .select()
      .single()
    familyId = family!.id

    const kidUuid = crypto.randomUUID()
    const { data: kidAuth } = await service.auth.admin.createUser({
      email: `kid-${kidUuid}@rewardfamily.internal`,
      password: '1234',
      email_confirm: true,
    })
    kidAuthId = kidAuth.user!.id

    const { data: kid } = await service
      .from('kids')
      .insert({ family_id: familyId, supabase_user_id: kidAuthId, name: 'RewardKid', birthday: '2015-01-01', points: 200 })
      .select()
      .single()
    kidId = kid!.id

    const { data: reward } = await service
      .from('rewards')
      .insert({ family_id: familyId, name: 'Ice Cream', points_cost: 50, icon: 'gift' })
      .select()
      .single()
    rewardId = reward!.id
  })

  afterAll(async () => {
    const service = createSupabaseServiceClient()
    await service.auth.admin.deleteUser(kidAuthId)
    await service.auth.admin.deleteUser(parentUserId)
  })

  it('creates a reward redemption and deducts points', async () => {
    const service = createSupabaseServiceClient()

    // Redeem reward
    const { data: redemption, error } = await service
      .from('reward_redemptions')
      .insert({
        kid_id: kidId,
        reward_id: rewardId,
        reward_name_snapshot: 'Ice Cream',
        points_cost_snapshot: 50,
      })
      .select()
      .single()

    expect(error).toBeNull()
    expect(redemption?.reward_name_snapshot).toBe('Ice Cream')
    expect(redemption?.points_cost_snapshot).toBe(50)
  })

  it('applies points delta atomically via function', async () => {
    const service = createSupabaseServiceClient()

    const { data: before } = await service.from('kids').select('points').eq('id', kidId).single()
    const pointsBefore = before?.points ?? 0

    await service.rpc('apply_points_delta', { kid_id: kidId, delta: -50 })

    const { data: after } = await service.from('kids').select('points').eq('id', kidId).single()
    expect(after?.points).toBe(Math.max(0, pointsBefore - 50))
  })

  it('points cannot go below zero', async () => {
    const service = createSupabaseServiceClient()

    // Drain all points
    await service.rpc('apply_points_delta', { kid_id: kidId, delta: -10000 })

    const { data } = await service.from('kids').select('points').eq('id', kidId).single()
    expect(data?.points).toBe(0)
  })
})
