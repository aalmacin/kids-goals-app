import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createClient } from '@supabase/supabase-js'
import { createSupabaseServiceClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/database.types'

const KID_PASSWORD = '1234'

describe('End Day Atomicity Integration', () => {
  let parentUserId: string
  let familyId: string
  let kidId: string
  let kidAuthId: string
  let kidEmail: string
  let dayRecordId: string
  let completionWithRewardId: string
  let completionWithPenaltyId: string

  const today = new Date().toISOString().split('T')[0]
  const service = createSupabaseServiceClient()

  beforeAll(async () => {
    const { data: parent } = await service.auth.admin.createUser({
      email: `endday-parent-${Date.now()}@example.com`,
      password: 'TestPassword123!',
      email_confirm: true,
    })
    parentUserId = parent.user!.id

    const { data: family } = await service
      .from('families')
      .insert({ name: `EndDayFamily ${Date.now()}`, parent_id: parentUserId })
      .select()
      .single()
    familyId = family!.id

    kidEmail = `kid-endday-${Date.now()}@enddayfamily.internal`
    const { data: kidAuth } = await service.auth.admin.createUser({
      email: kidEmail,
      password: KID_PASSWORD,
      email_confirm: true,
    })
    kidAuthId = kidAuth.user!.id

    const { data: kid } = await service
      .from('kids')
      .insert({ family_id: familyId, supabase_user_id: kidAuthId, name: 'EndDayKid', birthday: '2015-01-01' })
      .select()
      .single()
    kidId = kid!.id

    const { data: dr } = await service
      .from('day_records')
      .insert({ kid_id: kidId, date: today })
      .select()
      .single()
    dayRecordId = dr!.id

    const { data: chore } = await service
      .from('chores')
      .insert({ family_id: familyId, name: 'Reward Chore', penalty: 0, icon: 'star', reward_points: 10 })
      .select()
      .single()

    const { data: penaltyChore } = await service
      .from('chores')
      .insert({ family_id: familyId, name: 'Penalty Chore', penalty: 5, icon: 'star', reward_points: 0 })
      .select()
      .single()

    const { data: assignment1 } = await service
      .from('chore_assignments')
      .insert({ chore_id: chore!.id, kid_id: kidId })
      .select()
      .single()

    const { data: assignment2 } = await service
      .from('chore_assignments')
      .insert({ chore_id: penaltyChore!.id, kid_id: kidId })
      .select()
      .single()

    // Completed chore with reward
    const { data: c1 } = await service
      .from('chore_completions')
      .insert({
        day_record_id: dayRecordId,
        chore_assignment_id: assignment1!.id,
        chore_name_snapshot: 'Reward Chore',
        penalty_snapshot: 0,
        is_important_snapshot: false,
        reward_snapshot: 10,
        completed_at: new Date().toISOString(),
      })
      .select()
      .single()
    completionWithRewardId = c1!.id

    // Incomplete chore with penalty
    const { data: c2 } = await service
      .from('chore_completions')
      .insert({
        day_record_id: dayRecordId,
        chore_assignment_id: assignment2!.id,
        chore_name_snapshot: 'Penalty Chore',
        penalty_snapshot: 5,
        is_important_snapshot: false,
        reward_snapshot: 0,
      })
      .select()
      .single()
    completionWithPenaltyId = c2!.id
  })

  afterAll(async () => {
    await service.from('families').delete().eq('id', familyId)
    await service.auth.admin.deleteUser(parentUserId)
    await service.auth.admin.deleteUser(kidAuthId)
  })

  it('end_day RPC sets ended_at, logs penalty, reward, and day_ended atomically', async () => {
    const kidClient = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )
    await kidClient.auth.signInWithPassword({ email: kidEmail, password: KID_PASSWORD })

    const { error } = await kidClient.rpc('end_day', { p_day_record_id: dayRecordId })
    expect(error).toBeNull()

    const { data: dr } = await service
      .from('day_records')
      .select('ended_at')
      .eq('id', dayRecordId)
      .single()
    expect(dr?.ended_at).not.toBeNull()

    const { data: logs } = await service
      .from('activity_log')
      .select('action_type, points_delta')
      .eq('kid_id', kidId)
      .in('action_type', ['penalty_applied', 'chore_completion_reward', 'day_ended'])
      .order('created_at')

    const actionTypes = logs!.map((l) => l.action_type)
    expect(actionTypes).toContain('penalty_applied')
    expect(actionTypes).toContain('chore_completion_reward')
    expect(actionTypes).toContain('day_ended')

    const penalty = logs!.find((l) => l.action_type === 'penalty_applied')
    expect(penalty?.points_delta).toBe(-5)

    const reward = logs!.find((l) => l.action_type === 'chore_completion_reward')
    expect(reward?.points_delta).toBe(10)

    await kidClient.auth.signOut()
  })

  it('end_day RPC is idempotent when called a second time', async () => {
    const kidClient = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )
    await kidClient.auth.signInWithPassword({ email: kidEmail, password: KID_PASSWORD })

    const { error } = await kidClient.rpc('end_day', { p_day_record_id: dayRecordId })
    expect(error).toBeNull()

    // No duplicate logs on second call
    const { data: dayEndedLogs } = await service
      .from('activity_log')
      .select('id')
      .eq('kid_id', kidId)
      .eq('action_type', 'day_ended')

    expect(dayEndedLogs).toHaveLength(1)

    await kidClient.auth.signOut()
  })

  it('end_day RPC rejects unauthorized day record access', async () => {
    const otherKidClient = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )

    // Create another kid user
    const otherKidEmail = `other-kid-${Date.now()}@enddayfamily.internal`
    await service.auth.admin.createUser({
      email: otherKidEmail,
      password: KID_PASSWORD,
      email_confirm: true,
    })

    await otherKidClient.auth.signInWithPassword({ email: otherKidEmail, password: KID_PASSWORD })
    const { error } = await otherKidClient.rpc('end_day', { p_day_record_id: dayRecordId })

    expect(error).not.toBeNull()
    expect(error!.message).toContain('not authorized')

    await otherKidClient.auth.signOut()
  })
})
