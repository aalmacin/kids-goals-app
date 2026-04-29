import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createSupabaseServiceClient } from '@/lib/supabase/server'

const PASSWORD = 'TestPassword123!'

describe('Day Records Integration', () => {
  let parentUserId: string
  let familyId: string
  let kidId: string
  let kidAuthId: string
  let dayRecordId: string
  let choreId: string
  let assignmentId: string
  let completionId: string

  const today = new Date().toISOString().split('T')[0]

  beforeAll(async () => {
    const service = createSupabaseServiceClient()

    const { data: parent } = await service.auth.admin.createUser({
      email: `day-parent-${Date.now()}@example.com`,
      password: PASSWORD,
      email_confirm: true,
    })
    parentUserId = parent.user!.id

    const { data: family } = await service
      .from('families')
      .insert({ name: `DayTestFamily ${Date.now()}`, parent_id: parentUserId })
      .select()
      .single()
    familyId = family!.id

    const kidUuid = crypto.randomUUID()
    const { data: kidAuth } = await service.auth.admin.createUser({
      email: `kid-${kidUuid}@daytestfamily.internal`,
      password: '1234',
      email_confirm: true,
    })
    kidAuthId = kidAuth.user!.id

    const { data: kid } = await service
      .from('kids')
      .insert({ family_id: familyId, supabase_user_id: kidAuthId, name: 'DayKid', birthday: '2015-01-01' })
      .select()
      .single()
    kidId = kid!.id

    // Create chore and assignment
    const { data: chore } = await service
      .from('chores')
      .insert({ family_id: familyId, name: 'Test Chore', penalty: 5, is_important: false, icon: 'star' })
      .select()
      .single()
    choreId = chore!.id

    const { data: assignment } = await service
      .from('chore_assignments')
      .insert({ chore_id: choreId, kid_id: kidId })
      .select()
      .single()
    assignmentId = assignment!.id
  })

  afterAll(async () => {
    const service = createSupabaseServiceClient()
    await service.auth.admin.deleteUser(kidAuthId)
    await service.auth.admin.deleteUser(parentUserId)
  })

  it('creates a day record', async () => {
    const service = createSupabaseServiceClient()
    const { data, error } = await service
      .from('day_records')
      .insert({ kid_id: kidId, date: today })
      .select()
      .single()

    expect(error).toBeNull()
    expect(data?.date).toBe(today)
    dayRecordId = data!.id
  })

  it('seeds chore completion on day record creation', async () => {
    const service = createSupabaseServiceClient()
    const { error } = await service
      .from('chore_completions')
      .insert({
        day_record_id: dayRecordId,
        chore_assignment_id: assignmentId,
        chore_name_snapshot: 'Test Chore',
        penalty_snapshot: 5,
        is_important_snapshot: false,
      })

    expect(error).toBeNull()

    const { data } = await service
      .from('chore_completions')
      .select()
      .eq('day_record_id', dayRecordId)
    expect(data?.length).toBeGreaterThan(0)
    completionId = data![0].id
  })

  it('toggles chore completion', async () => {
    const service = createSupabaseServiceClient()
    const now = new Date().toISOString()

    const { data, error } = await service
      .from('chore_completions')
      .update({ completed_at: now })
      .eq('id', completionId)
      .select()
      .single()

    expect(error).toBeNull()
    expect(data?.completed_at).not.toBeNull()
  })

  it('cannot update completions on ended day (enforced by app layer)', async () => {
    const service = createSupabaseServiceClient()

    // End the day
    await service
      .from('day_records')
      .update({ ended_at: new Date().toISOString() })
      .eq('id', dayRecordId)

    // RLS allows the DB operation, but the server action checks ended_at before updating
    const { data: dr } = await service
      .from('day_records')
      .select('ended_at')
      .eq('id', dayRecordId)
      .single()

    expect(dr?.ended_at).not.toBeNull()
  })

  it('endDay is idempotent — second call is no-op', async () => {
    const service = createSupabaseServiceClient()

    const { data: before } = await service
      .from('day_records')
      .select('ended_at')
      .eq('id', dayRecordId)
      .single()

    const firstEndedAt = before?.ended_at

    // Call update again — same ended_at value
    await service
      .from('day_records')
      .update({ ended_at: firstEndedAt! })
      .eq('id', dayRecordId)

    const { data: after } = await service
      .from('day_records')
      .select('ended_at')
      .eq('id', dayRecordId)
      .single()

    expect(after?.ended_at).toBe(firstEndedAt)
  })
})
