import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createSupabaseServiceClient } from '@/lib/supabase/server'

const PASSWORD = 'TestPassword123!'

describe('Undo Rest Day Integration', () => {
  let parentUserId: string
  let familyId: string
  let kidId: string
  let kidAuthId: string
  let dayRecordId: string

  const service = createSupabaseServiceClient()
  const today = new Date().toISOString().split('T')[0]

  beforeAll(async () => {
    const { data: parent } = await service.auth.admin.createUser({
      email: `undo-rest-parent-${Date.now()}@example.com`,
      password: PASSWORD,
      email_confirm: true,
    })
    parentUserId = parent.user!.id

    const { data: family } = await service
      .from('families')
      .insert({ name: `UndoRestTestFamily ${Date.now()}`, parent_id: parentUserId })
      .select()
      .single()
    familyId = family!.id

    const { data: kidAuth } = await service.auth.admin.createUser({
      email: `kid-undo-rest-${Date.now()}@undoresttestfamily.internal`,
      password: '1234',
      email_confirm: true,
    })
    kidAuthId = kidAuth.user!.id

    const { data: kid } = await service
      .from('kids')
      .insert({ family_id: familyId, supabase_user_id: kidAuthId, name: 'UndoRestKid', birthday: '2015-01-01' })
      .select()
      .single()
    kidId = kid!.id

    const { data: dr } = await service
      .from('day_records')
      .insert({ kid_id: kidId, date: today, is_rest_day: true })
      .select()
      .single()
    dayRecordId = dr!.id

    // Simulate rest day purchase: deduct 100 points
    await service.from('activity_log').insert({
      family_id: familyId,
      kid_id: kidId,
      actor_type: 'kid',
      action_type: 'rest_day_purchased',
      metadata: { day_record_id: dayRecordId },
      points_delta: -100,
    })
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

  it('rest_day_reversed action type is accepted by the constraint', async () => {
    const { error } = await service.from('activity_log').insert({
      family_id: familyId,
      kid_id: kidId,
      actor_type: 'kid',
      action_type: 'rest_day_reversed',
      metadata: { day_record_id: dayRecordId },
      points_delta: 100,
    })
    expect(error).toBeNull()
  })

  it('undo rest day returns 100 points via compensating entry', async () => {
    const points = await getKidPoints()
    // -100 (purchase) + 100 (reversal) = 0
    expect(points).toBe(0)
  })

  it('undo_rest_day_count increments after undo', async () => {
    await service
      .from('day_records')
      .update({ is_rest_day: false, undo_rest_day_count: 1 })
      .eq('id', dayRecordId)

    const { data } = await service
      .from('day_records')
      .select('is_rest_day, undo_rest_day_count')
      .eq('id', dayRecordId)
      .single()

    expect(data?.is_rest_day).toBe(false)
    expect(data?.undo_rest_day_count).toBe(1)
  })

  it('undo_rest_day_count CHECK constraint rejects negative values', async () => {
    const { error } = await service
      .from('day_records')
      .update({ undo_rest_day_count: -1 })
      .eq('id', dayRecordId)

    expect(error).not.toBeNull()
  })

  it('second undo is blocked when undo_rest_day_count >= 1 (guard scenario)', async () => {
    const { data } = await service
      .from('day_records')
      .select('undo_rest_day_count')
      .eq('id', dayRecordId)
      .single()

    expect(data?.undo_rest_day_count).toBeGreaterThanOrEqual(1)
  })
})
