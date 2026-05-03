import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createSupabaseServiceClient } from '@/lib/supabase/server'

describe('Points Event Sourcing Integration', () => {
  let familyId: string
  let kidId: string
  let parentUserId: string
  let kidAuthId: string

  const service = createSupabaseServiceClient()

  beforeAll(async () => {
    const { data: parent } = await service.auth.admin.createUser({
      email: `eventsource-parent-${Date.now()}@example.com`,
      password: 'TestPassword123!',
      email_confirm: true,
    })
    parentUserId = parent.user!.id

    const { data: family } = await service
      .from('families')
      .insert({ name: `EventSourceFamily ${Date.now()}`, parent_id: parentUserId })
      .select()
      .single()
    familyId = family!.id

    const kidUuid = crypto.randomUUID()
    const { data: kidAuth } = await service.auth.admin.createUser({
      email: `kid-${kidUuid}@eventsourcefamily.internal`,
      password: '1234',
      email_confirm: true,
    })
    kidAuthId = kidAuth.user!.id

    const { data: kid } = await service
      .from('kids')
      .insert({ family_id: familyId, supabase_user_id: kidAuthId, name: 'EventKid', birthday: '2015-01-01' })
      .select()
      .single()
    kidId = kid!.id
  })

  afterAll(async () => {
    await service.from('families').delete().eq('id', familyId)
    await service.auth.admin.deleteUser(parentUserId)
    await service.auth.admin.deleteUser(kidAuthId)
  })

  async function getKidPoints(): Promise<number> {
    const { data } = await service.from('kids').select('points').eq('id', kidId).single()
    return data!.points
  }

  async function sumActivityLogDeltas(): Promise<number> {
    const { data } = await service
      .from('activity_log')
      .select('points_delta')
      .eq('kid_id', kidId)
      .not('points_delta', 'is', null)
    return (data ?? []).reduce((sum, row) => sum + (row.points_delta ?? 0), 0)
  }

  it('balance equals SUM(points_delta) after a penalty event', async () => {
    await service.from('activity_log').insert({
      family_id: familyId,
      kid_id: kidId,
      actor_type: 'parent',
      action_type: 'penalty_applied',
      metadata: {},
      points_delta: -10,
    })

    const points = await getKidPoints()
    const sum = await sumActivityLogDeltas()
    // floor at 0: points may be 0 even if sum is negative
    expect(points).toBe(Math.max(0, sum))
  })

  it('balance equals SUM(points_delta) after an effort reward event', async () => {
    await service.from('activity_log').insert({
      family_id: familyId,
      kid_id: kidId,
      actor_type: 'kid',
      action_type: 'effort_awarded',
      metadata: {},
      points_delta: 50,
    })

    const points = await getKidPoints()
    const sum = await sumActivityLogDeltas()
    expect(points).toBe(Math.max(0, sum))
  })

  it('balance equals SUM(points_delta) after a rest day purchase', async () => {
    await service.from('activity_log').insert({
      family_id: familyId,
      kid_id: kidId,
      actor_type: 'kid',
      action_type: 'rest_day_purchased',
      metadata: {},
      points_delta: -100,
    })

    const points = await getKidPoints()
    const sum = await sumActivityLogDeltas()
    expect(points).toBe(Math.max(0, sum))
  })

  it('balance never goes below zero', async () => {
    // Insert a large negative delta that would push balance below 0
    await service.from('activity_log').insert({
      family_id: familyId,
      kid_id: kidId,
      actor_type: 'parent',
      action_type: 'penalty_applied',
      metadata: {},
      points_delta: -99999,
    })

    const points = await getKidPoints()
    expect(points).toBe(0)
  })

  it('null points_delta events do not change the balance', async () => {
    const beforePoints = await getKidPoints()

    await service.from('activity_log').insert({
      family_id: familyId,
      kid_id: kidId,
      actor_type: 'kid',
      action_type: 'chore_completed',
      metadata: {},
      points_delta: null,
    })

    const afterPoints = await getKidPoints()
    expect(afterPoints).toBe(beforePoints)
  })
})
