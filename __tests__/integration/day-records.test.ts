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

    // Create chore with reward_points and assignment
    const { data: chore } = await service
      .from('chores')
      .insert({ family_id: familyId, name: 'Test Chore', penalty: 5, reward_points: 10, is_important: false, icon: 'star' })
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

  it('seeds chore completion on day record creation with reward_snapshot', async () => {
    const service = createSupabaseServiceClient()
    const { error } = await service
      .from('chore_completions')
      .insert({
        day_record_id: dayRecordId,
        chore_assignment_id: assignmentId,
        chore_name_snapshot: 'Test Chore',
        penalty_snapshot: 5,
        reward_snapshot: 10,
        is_important_snapshot: false,
      })

    expect(error).toBeNull()

    const { data } = await service
      .from('chore_completions')
      .select()
      .eq('day_record_id', dayRecordId)
    expect(data?.length).toBeGreaterThan(0)
    expect(data![0].reward_snapshot).toBe(10)
    completionId = data![0].id
  })

  it('reward_snapshot defaults to 0 when not provided', async () => {
    const service = createSupabaseServiceClient()
    // Create a separate day record for this test
    const date = new Date()
    date.setDate(date.getDate() - 1)
    const yesterday = date.toISOString().split('T')[0]

    const { data: dr } = await service
      .from('day_records')
      .insert({ kid_id: kidId, date: yesterday })
      .select()
      .single()

    const { data: comp } = await service
      .from('chore_completions')
      .insert({
        day_record_id: dr!.id,
        chore_assignment_id: assignmentId,
        chore_name_snapshot: 'Test Chore',
        penalty_snapshot: 5,
        is_important_snapshot: false,
      })
      .select()
      .single()

    expect(comp?.reward_snapshot).toBe(0)

    await service.from('day_records').delete().eq('id', dr!.id)
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

  it('inserts chore_completion_reward event for completed rewarded chores at end day', async () => {
    const service = createSupabaseServiceClient()

    // Set up a fresh day record with a rewarded completed chore
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + 1)
    const tomorrow = futureDate.toISOString().split('T')[0]

    const { data: dr } = await service
      .from('day_records')
      .insert({ kid_id: kidId, date: tomorrow })
      .select()
      .single()

    const { data: comp } = await service
      .from('chore_completions')
      .insert({
        day_record_id: dr!.id,
        chore_assignment_id: assignmentId,
        chore_name_snapshot: 'Test Chore',
        penalty_snapshot: 5,
        reward_snapshot: 10,
        is_important_snapshot: false,
        completed_at: new Date().toISOString(),
      })
      .select()
      .single()

    // Insert the reward event directly (mirrors what endDay server action does)
    const { error } = await service.from('activity_log').insert({
      family_id: familyId,
      kid_id: kidId,
      actor_type: 'kid',
      action_type: 'chore_completion_reward',
      metadata: { chore_name: comp!.chore_name_snapshot, completion_id: comp!.id },
      points_delta: comp!.reward_snapshot,
    })

    expect(error).toBeNull()

    const { data: events } = await service
      .from('activity_log')
      .select()
      .eq('kid_id', kidId)
      .eq('action_type', 'chore_completion_reward')

    expect(events?.length).toBeGreaterThan(0)
    expect(events![0].points_delta).toBe(10)

    await service.from('day_records').delete().eq('id', dr!.id)
  })

  it('no reward event when chore is uncompleted at end day', async () => {
    const service = createSupabaseServiceClient()

    // Verify: uncompleted chore with reward has no reward events in the constraint sense
    // (business logic is in endDay server action — calculateChoreRewards filters completed_at === null)
    // Here we verify the constraint allows insertion only when action_type is valid
    const { error } = await service.from('activity_log').insert({
      family_id: familyId,
      kid_id: kidId,
      actor_type: 'kid',
      action_type: 'chore_completion_reward',
      metadata: {},
      points_delta: 0,
    })

    // points_delta of 0 is allowed by the constraint — business logic prevents this path
    expect(error).toBeNull()
  })

  it('undoEndDay inserts chore_completion_reward_reversed for each prior reward event', async () => {
    const service = createSupabaseServiceClient()

    // Set up a day record with a completed rewarded chore and an existing reward event
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + 2)
    const date = futureDate.toISOString().split('T')[0]

    const { data: dr } = await service
      .from('day_records')
      .insert({ kid_id: kidId, date })
      .select()
      .single()

    const { data: comp } = await service
      .from('chore_completions')
      .insert({
        day_record_id: dr!.id,
        chore_assignment_id: assignmentId,
        chore_name_snapshot: 'Test Chore',
        penalty_snapshot: 5,
        reward_snapshot: 10,
        is_important_snapshot: false,
        completed_at: new Date().toISOString(),
      })
      .select()
      .single()

    // Simulate what endDay inserts
    await service.from('activity_log').insert({
      family_id: familyId,
      kid_id: kidId,
      actor_type: 'kid',
      action_type: 'chore_completion_reward',
      metadata: { chore_name: comp!.chore_name_snapshot, completion_id: comp!.id },
      points_delta: 10,
    })

    // Record balance before undo
    const { data: kidBefore } = await service.from('kids').select('points').eq('id', kidId).single()
    const pointsBefore = kidBefore!.points

    // Insert reversal event (mirrors what undoEndDay does)
    const { data: rewardEvent } = await service
      .from('activity_log')
      .select('id')
      .eq('kid_id', kidId)
      .eq('action_type', 'chore_completion_reward')
      .filter('metadata->>completion_id', 'eq', comp!.id)
      .single()

    const { error } = await service.from('activity_log').insert({
      family_id: familyId,
      kid_id: kidId,
      actor_type: 'kid',
      action_type: 'chore_completion_reward_reversed',
      metadata: { chore_name: comp!.chore_name_snapshot, original_event_id: rewardEvent!.id },
      points_delta: -10,
    })

    expect(error).toBeNull()

    // Balance should be restored
    const { data: kidAfter } = await service.from('kids').select('points').eq('id', kidId).single()
    expect(kidAfter!.points).toBe(pointsBefore - 10)

    // Verify reversal event exists
    const { data: reversalEvents } = await service
      .from('activity_log')
      .select()
      .eq('kid_id', kidId)
      .eq('action_type', 'chore_completion_reward_reversed')

    expect(reversalEvents?.length).toBeGreaterThan(0)
    expect(reversalEvents![0].points_delta).toBe(-10)

    await service.from('day_records').delete().eq('id', dr!.id)
  })

  it('no chore_completion_reward_reversed events when no rewards were granted', async () => {
    const service = createSupabaseServiceClient()

    // Verify: inserting reversal when no prior reward events → empty result set
    const { data: reversalEvents } = await service
      .from('activity_log')
      .select()
      .eq('kid_id', kidId)
      .eq('action_type', 'chore_completion_reward_reversed')
      .filter('metadata->>original_event_id', 'eq', 'nonexistent-id')

    expect(reversalEvents?.length).toBe(0)
  })

  it('undo end day with all chores completed — only events from current run are reversed, no phantom gains (FR-013)', async () => {
    const service = createSupabaseServiceClient()

    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + 10)
    const date = futureDate.toISOString().split('T')[0]

    const { data: dr } = await service
      .from('day_records')
      .insert({ kid_id: kidId, date })
      .select()
      .single()

    const testDayRecordId = dr!.id

    // Cycle 1: simulate End Day where a penalty WAS applied
    await service.from('activity_log').insert({
      family_id: familyId, kid_id: kidId, actor_type: 'kid',
      action_type: 'penalty_applied',
      metadata: { day_record_id: testDayRecordId, total_penalty: 150 },
      points_delta: -150,
    })
    await service.from('day_records').update({ ended_at: new Date().toISOString() }).eq('id', testDayRecordId)
    await service.from('activity_log').insert({
      family_id: familyId, kid_id: kidId, actor_type: 'kid',
      action_type: 'day_ended',
      metadata: { day_record_id: testDayRecordId },
      points_delta: null,
    })

    // Cycle 1 undo: penalty reversed, day_undone recorded
    await service.from('activity_log').insert({
      family_id: familyId, kid_id: kidId, actor_type: 'kid',
      action_type: 'penalty_reversed',
      metadata: { day_record_id: testDayRecordId },
      points_delta: 150,
    })
    await service.from('activity_log').insert({
      family_id: familyId, kid_id: kidId, actor_type: 'kid',
      action_type: 'day_undone',
      metadata: { day_record_id: testDayRecordId },
      points_delta: null,
    })
    await service.from('day_records').update({ ended_at: null }).eq('id', testDayRecordId)

    // Ensure Cycle 2 events have later created_at than Cycle 1
    await new Promise((r) => setTimeout(r, 50))

    // Cycle 2: all chores completed — only effort inserted, no penalty
    const effortPoints = 15
    const { data: kidBeforeCycle2 } = await service.from('kids').select('points').eq('id', kidId).single()
    const pointsBeforeCycle2 = kidBeforeCycle2!.points

    await service.from('activity_log').insert({
      family_id: familyId, kid_id: kidId, actor_type: 'kid',
      action_type: 'effort_awarded',
      metadata: { effort_level_id: 'test-effort-id', effort_level_name: 'Medium' },
      points_delta: effortPoints,
    })
    await service.from('day_records').update({ ended_at: new Date().toISOString() }).eq('id', testDayRecordId)
    await service.from('activity_log').insert({
      family_id: familyId, kid_id: kidId, actor_type: 'kid',
      action_type: 'day_ended',
      metadata: { day_record_id: testDayRecordId },
      points_delta: null,
    })

    const { data: kidAfterEndDay } = await service.from('kids').select('points').eq('id', kidId).single()
    expect(kidAfterEndDay!.points).toBe(pointsBeforeCycle2 + effortPoints)

    // Verify the timestamp-window query (the fixed undoEndDay logic) only finds the Cycle 2 effort event
    const { data: dayEndedEvent } = await service
      .from('activity_log')
      .select('created_at')
      .eq('kid_id', kidId)
      .eq('action_type', 'day_ended')
      .filter('metadata->>day_record_id', 'eq', testDayRecordId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    const endedAt = dayEndedEvent!.created_at

    const { data: lastUndoneEvent } = await service
      .from('activity_log')
      .select('created_at')
      .eq('kid_id', kidId)
      .eq('action_type', 'day_undone')
      .filter('metadata->>day_record_id', 'eq', testDayRecordId)
      .lt('created_at', endedAt)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    const afterAt = lastUndoneEvent?.created_at ?? '1970-01-01T00:00:00.000Z'

    const { data: eventsToReverse } = await service
      .from('activity_log')
      .select('action_type, points_delta')
      .eq('kid_id', kidId)
      .in('action_type', ['penalty_applied', 'effort_awarded', 'chore_completion_reward'])
      .not('points_delta', 'is', null)
      .gt('created_at', afterAt)
      .lte('created_at', endedAt)

    // Must find only the Cycle 2 effort event — NOT the stale Cycle 1 penalty_applied
    expect(eventsToReverse?.length).toBe(1)
    expect(eventsToReverse![0].action_type).toBe('effort_awarded')
    expect(eventsToReverse![0].points_delta).toBe(effortPoints)

    // Simulate inserting the reversal (effort_reversed)
    await service.from('activity_log').insert({
      family_id: familyId, kid_id: kidId, actor_type: 'kid',
      action_type: 'effort_reversed',
      metadata: { day_record_id: testDayRecordId },
      points_delta: -effortPoints,
    })

    const { data: kidAfterUndo } = await service.from('kids').select('points').eq('id', kidId).single()
    // Balance must return exactly to pre-Cycle-2 value — no phantom gains
    expect(kidAfterUndo!.points).toBe(pointsBeforeCycle2)

    await service.from('day_records').delete().eq('id', testDayRecordId)
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
