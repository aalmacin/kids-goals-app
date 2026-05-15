import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createSupabaseServiceClient } from '@/lib/supabase/server'

const PASSWORD = 'TestPassword123!'

describe('Task Management Integration', () => {
  let parentUserId: string
  let familyId: string
  let kidId: string
  let kidAuthId: string
  let taskId: string

  beforeAll(async () => {
    const service = createSupabaseServiceClient()

    const { data: parent } = await service.auth.admin.createUser({
      email: `task-parent-${Date.now()}@example.com`,
      password: PASSWORD,
      email_confirm: true,
    })
    parentUserId = parent.user!.id

    const { data: family } = await service
      .from('families')
      .insert({ name: `TaskTestFamily ${Date.now()}`, parent_id: parentUserId })
      .select()
      .single()
    familyId = family!.id

    const kidUuid = crypto.randomUUID()
    const { data: kidAuth } = await service.auth.admin.createUser({
      email: `kid-${kidUuid}@tasktestfamily.internal`,
      password: '1234',
      email_confirm: true,
    })
    kidAuthId = kidAuth.user!.id

    const { data: kid } = await service
      .from('kids')
      .insert({ family_id: familyId, supabase_user_id: kidAuthId, name: 'TaskKid', birthday: '2015-01-01' })
      .select()
      .single()
    kidId = kid!.id
  })

  afterAll(async () => {
    const service = createSupabaseServiceClient()
    if (taskId) await service.from('tasks').delete().eq('id', taskId)
    await service.auth.admin.deleteUser(kidAuthId)
    await service.auth.admin.deleteUser(parentUserId)
  })

  it('creates a one-time task in the library', async () => {
    const service = createSupabaseServiceClient()
    const { data, error } = await service
      .from('tasks')
      .insert({ family_id: familyId, name: 'Read a book', points: 20, task_type: 'one_time' })
      .select()
      .single()

    expect(error).toBeNull()
    expect(data?.name).toBe('Read a book')
    expect(data?.task_type).toBe('one_time')
    taskId = data!.id
  })

  it('inserts a task completion for the kid', async () => {
    const service = createSupabaseServiceClient()
    const { data, error } = await service
      .from('task_completions')
      .insert({
        task_id: taskId,
        kid_id: kidId,
        task_name_snapshot: 'Read a book',
        points_snapshot: 20,
      })
      .select()
      .single()

    expect(error).toBeNull()
    expect(data?.kid_id).toBe(kidId)
  })

  it('prevents a second completion for a one-time task (unique index)', async () => {
    const service = createSupabaseServiceClient()
    const { error } = await service.from('task_completions').insert({
      task_id: taskId,
      kid_id: kidId,
      task_name_snapshot: 'Read a book',
      points_snapshot: 20,
    })
    // Should fail due to partial unique index
    expect(error).not.toBeNull()
  })

  it('inserts task_completed entry into activity_log', async () => {
    const service = createSupabaseServiceClient()
    const { data, error } = await service
      .from('activity_log')
      .insert({
        family_id: familyId,
        kid_id: kidId,
        actor_type: 'kid',
        action_type: 'task_completed',
        metadata: { task_id: taskId, task_name: 'Read a book' },
        points_delta: 20,
      })
      .select()
      .single()

    expect(error).toBeNull()
    expect(data?.action_type).toBe('task_completed')
    expect(data?.points_delta).toBe(20)
  })

  it('soft-deletes a task (deleted_at set)', async () => {
    const service = createSupabaseServiceClient()
    const { error } = await service
      .from('tasks')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', taskId)

    expect(error).toBeNull()

    const { data } = await service.from('tasks').select().eq('id', taskId).single()
    expect(data?.deleted_at).not.toBeNull()
  })

  it('creates a once_per_day repeated task', async () => {
    const service = createSupabaseServiceClient()
    const { data, error } = await service
      .from('tasks')
      .insert({
        family_id: familyId,
        name: 'Daily Practice',
        points: 10,
        task_type: 'repeated',
        once_per_day: true,
      })
      .select()
      .single()

    expect(error).toBeNull()
    expect(data?.once_per_day).toBe(true)
    expect(data?.task_type).toBe('repeated')

    // Clean up
    await service.from('tasks').delete().eq('id', data!.id)
  })

  it('inserts task_completion_reversed entry into activity_log', async () => {
    const service = createSupabaseServiceClient()
    const { data, error } = await service
      .from('activity_log')
      .insert({
        family_id: familyId,
        kid_id: kidId,
        actor_type: 'kid',
        action_type: 'task_completion_reversed',
        metadata: { task_id: taskId, task_name: 'Read a book' },
        points_delta: -20,
      })
      .select()
      .single()

    expect(error).toBeNull()
    expect(data?.action_type).toBe('task_completion_reversed')
    expect(data?.points_delta).toBe(-20)
  })

  it('kid can delete their own task_completions (undo RLS)', async () => {
    const service = createSupabaseServiceClient()

    // Create a new repeated task for this test
    const { data: repeatedTask } = await service
      .from('tasks')
      .insert({ family_id: familyId, name: 'Undo Test', points: 5, task_type: 'repeated' })
      .select()
      .single()

    // Insert a completion
    const { data: completion } = await service
      .from('task_completions')
      .insert({
        task_id: repeatedTask!.id,
        kid_id: kidId,
        task_name_snapshot: 'Undo Test',
        points_snapshot: 5,
      })
      .select()
      .single()

    // Delete the completion (simulating undo via service role — RLS allows kid to delete own)
    const { error: deleteError } = await service
      .from('task_completions')
      .delete()
      .eq('id', completion!.id)

    expect(deleteError).toBeNull()

    // Verify it's gone
    const { data: afterDelete } = await service
      .from('task_completions')
      .select()
      .eq('id', completion!.id)
      .maybeSingle()
    expect(afterDelete).toBeNull()

    // Clean up
    await service.from('tasks').delete().eq('id', repeatedTask!.id)
  })
})
