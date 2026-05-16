import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createSupabaseServiceClient } from '@/lib/supabase/server'

const PASSWORD = 'TestPassword123!'

describe('Chore Uncheck Limit Integration', () => {
  let parentUserId: string
  let familyId: string
  let kidId: string
  let kidAuthId: string
  let dayRecordId: string
  let completionId: string

  const service = createSupabaseServiceClient()
  const today = new Date().toISOString().split('T')[0]

  beforeAll(async () => {
    const { data: parent } = await service.auth.admin.createUser({
      email: `uncheck-parent-${Date.now()}@example.com`,
      password: PASSWORD,
      email_confirm: true,
    })
    parentUserId = parent.user!.id

    const { data: family } = await service
      .from('families')
      .insert({ name: `UncheckTestFamily ${Date.now()}`, parent_id: parentUserId })
      .select()
      .single()
    familyId = family!.id

    const { data: kidAuth } = await service.auth.admin.createUser({
      email: `kid-uncheck-${Date.now()}@unchecktestfamily.internal`,
      password: '1234',
      email_confirm: true,
    })
    kidAuthId = kidAuth.user!.id

    const { data: kid } = await service
      .from('kids')
      .insert({ family_id: familyId, supabase_user_id: kidAuthId, name: 'UncheckKid', birthday: '2015-01-01' })
      .select()
      .single()
    kidId = kid!.id

    const { data: dr } = await service
      .from('day_records')
      .insert({ kid_id: kidId, date: today })
      .select()
      .single()
    dayRecordId = dr!.id

    // Create a chore and assignment
    const { data: chore } = await service
      .from('chores')
      .insert({ family_id: familyId, name: 'Test Chore', penalty: 5, icon: 'star' })
      .select()
      .single()

    const { data: assignment } = await service
      .from('chore_assignments')
      .insert({ chore_id: chore!.id, kid_id: kidId })
      .select()
      .single()

    const { data: completion } = await service
      .from('chore_completions')
      .insert({
        day_record_id: dayRecordId,
        chore_assignment_id: assignment!.id,
        chore_name_snapshot: 'Test Chore',
        penalty_snapshot: 5,
        is_important_snapshot: false,
        reward_snapshot: 0,
      })
      .select()
      .single()
    completionId = completion!.id
  })

  afterAll(async () => {
    await service.from('families').delete().eq('id', familyId)
    await service.auth.admin.deleteUser(parentUserId)
    await service.auth.admin.deleteUser(kidAuthId)
  })

  it('uncheck_count defaults to 0', async () => {
    const { data } = await service
      .from('chore_completions')
      .select('uncheck_count')
      .eq('id', completionId)
      .single()

    expect(data?.uncheck_count).toBe(0)
  })

  it('first uncheck increments uncheck_count to 1', async () => {
    // Complete the chore
    await service
      .from('chore_completions')
      .update({ completed_at: new Date().toISOString() })
      .eq('id', completionId)

    // Simulate uncheck: clear completed_at and increment uncheck_count
    await service
      .from('chore_completions')
      .update({ completed_at: null, uncheck_count: 1 })
      .eq('id', completionId)

    const { data } = await service
      .from('chore_completions')
      .select('uncheck_count, completed_at')
      .eq('id', completionId)
      .single()

    expect(data?.uncheck_count).toBe(1)
    expect(data?.completed_at).toBeNull()
  })

  it('completing a chore is always allowed regardless of uncheck_count', async () => {
    // Re-complete after uncheck
    const { error } = await service
      .from('chore_completions')
      .update({ completed_at: new Date().toISOString() })
      .eq('id', completionId)

    expect(error).toBeNull()

    const { data } = await service
      .from('chore_completions')
      .select('completed_at, uncheck_count')
      .eq('id', completionId)
      .single()

    expect(data?.completed_at).not.toBeNull()
    expect(data?.uncheck_count).toBe(1)
  })

  it('uncheck_count CHECK constraint rejects negative values', async () => {
    const { error } = await service
      .from('chore_completions')
      .update({ uncheck_count: -1 })
      .eq('id', completionId)

    expect(error).not.toBeNull()
  })
})
