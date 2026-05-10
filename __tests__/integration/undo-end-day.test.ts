import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createSupabaseServiceClient } from '@/lib/supabase/server'

const PASSWORD = 'TestPassword123!'

describe('Undo End Day Integration', () => {
  let parentUserId: string
  let familyId: string
  let kidId: string
  let kidAuthId: string
  let dayRecordId: string

  const service = createSupabaseServiceClient()
  const today = new Date().toISOString().split('T')[0]

  beforeAll(async () => {
    const { data: parent } = await service.auth.admin.createUser({
      email: `undo-parent-${Date.now()}@example.com`,
      password: PASSWORD,
      email_confirm: true,
    })
    parentUserId = parent.user!.id

    const { data: family } = await service
      .from('families')
      .insert({ name: `UndoTestFamily ${Date.now()}`, parent_id: parentUserId })
      .select()
      .single()
    familyId = family!.id

    const kidUuid = crypto.randomUUID()
    const { data: kidAuth } = await service.auth.admin.createUser({
      email: `kid-${kidUuid}@undotestfamily.internal`,
      password: '1234',
      email_confirm: true,
    })
    kidAuthId = kidAuth.user!.id

    const { data: kid } = await service
      .from('kids')
      .insert({ family_id: familyId, supabase_user_id: kidAuthId, name: 'UndoKid', birthday: '2015-01-01' })
      .select()
      .single()
    kidId = kid!.id

    // Create a day record
    const { data: dr } = await service
      .from('day_records')
      .insert({ kid_id: kidId, date: today })
      .select()
      .single()
    dayRecordId = dr!.id
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

  it('penalty is applied and points decrease on end day', async () => {
    // Insert penalty_applied log entry (simulating endDay with penalty)
    await service.from('activity_log').insert({
      family_id: familyId,
      kid_id: kidId,
      actor_type: 'kid',
      action_type: 'penalty_applied',
      metadata: { day_record_id: dayRecordId, total_penalty: 10 },
      points_delta: -10,
    })

    // Seed some positive points first so floor doesn't hide the effect
    await service.from('activity_log').insert({
      family_id: familyId,
      kid_id: kidId,
      actor_type: 'kid',
      action_type: 'effort_awarded',
      metadata: { day_record_id: dayRecordId, effort_level_name: 'Great' },
      points_delta: 30,
    })

    await service
      .from('day_records')
      .update({ ended_at: new Date().toISOString() })
      .eq('id', dayRecordId)

    const points = await getKidPoints()
    // 30 - 10 = 20
    expect(points).toBe(20)
  })

  it('penalty_reversed and effort_reversed action types are accepted by the constraint', async () => {
    const { error: penaltyErr } = await service.from('activity_log').insert({
      family_id: familyId,
      kid_id: kidId,
      actor_type: 'kid',
      action_type: 'penalty_reversed',
      metadata: { day_record_id: dayRecordId },
      points_delta: 10,
    })
    expect(penaltyErr).toBeNull()

    const { error: effortErr } = await service.from('activity_log').insert({
      family_id: familyId,
      kid_id: kidId,
      actor_type: 'kid',
      action_type: 'effort_reversed',
      metadata: { day_record_id: dayRecordId },
      points_delta: -30,
    })
    expect(effortErr).toBeNull()
  })

  it('day_undone action type is accepted by the constraint', async () => {
    const { error } = await service.from('activity_log').insert({
      family_id: familyId,
      kid_id: kidId,
      actor_type: 'kid',
      action_type: 'day_undone',
      metadata: { day_record_id: dayRecordId },
      points_delta: null,
    })
    expect(error).toBeNull()
  })

  it('points balance after reversals equals sum of all deltas', async () => {
    const { data } = await service
      .from('activity_log')
      .select('points_delta')
      .eq('kid_id', kidId)
      .not('points_delta', 'is', null)

    const sum = (data ?? []).reduce((acc, row) => acc + (row.points_delta ?? 0), 0)
    const points = await getKidPoints()
    expect(points).toBe(Math.max(0, sum))
  })

  it('day record can be re-opened by clearing ended_at', async () => {
    await service
      .from('day_records')
      .update({ ended_at: null, effort_level_id: null })
      .eq('id', dayRecordId)

    const { data } = await service
      .from('day_records')
      .select('ended_at, effort_level_id')
      .eq('id', dayRecordId)
      .single()

    expect(data?.ended_at).toBeNull()
    expect(data?.effort_level_id).toBeNull()
  })
})
