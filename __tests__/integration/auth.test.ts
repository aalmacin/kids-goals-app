import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createSupabaseServiceClient } from '@/lib/supabase/server'

// These tests require a running local Supabase instance (supabase start)
// Run with: npx vitest run __tests__/integration

const TEST_EMAIL = `test-parent-${Date.now()}@example.com`
const TEST_PASSWORD = 'TestPassword123!'
const TEST_FAMILY_NAME = `Auth Family ${crypto.randomUUID()}`

describe('Parent Auth Integration', () => {
  let parentUserId: string | undefined

  afterEach(async () => {
    if (parentUserId) {
      const service = createSupabaseServiceClient()
      await service.auth.admin.deleteUser(parentUserId)
      parentUserId = undefined
    }
  })

  it('creates parent account via admin and signs in', async () => {
    const service = createSupabaseServiceClient()

    const { data: created, error: createError } = await service.auth.admin.createUser({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      email_confirm: true,
    })
    expect(createError).toBeNull()
    expect(created.user).toBeDefined()
    parentUserId = created.user?.id

    const { data, error } = await service.auth.signInWithPassword({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    })
    expect(error).toBeNull()
    expect(data.user?.email).toBe(TEST_EMAIL)
  })

  it('rejects invalid credentials', async () => {
    const service = createSupabaseServiceClient()
    const { error } = await service.auth.signInWithPassword({
      email: 'nonexistent@example.com',
      password: 'wrongpassword',
    })
    expect(error).not.toBeNull()
  })

  it('enforces family name uniqueness', async () => {
    const service = createSupabaseServiceClient()

    const { data: user1 } = await service.auth.admin.createUser({
      email: `parent1-${Date.now()}@example.com`,
      password: TEST_PASSWORD,
      email_confirm: true,
    })
    parentUserId = user1.user?.id

    // Insert family
    const { error: insert1 } = await service
      .from('families')
      .insert({ name: TEST_FAMILY_NAME, parent_id: user1.user!.id })
    expect(insert1).toBeNull()

    // Second insert with same name should fail
    const { data: user2 } = await service.auth.admin.createUser({
      email: `parent2-${Date.now()}@example.com`,
      password: TEST_PASSWORD,
      email_confirm: true,
    })

    const { error: insert2 } = await service
      .from('families')
      .insert({ name: TEST_FAMILY_NAME, parent_id: user2.user!.id })
    expect(insert2).not.toBeNull()

    // Cleanup
    await service.auth.admin.deleteUser(user2.user!.id)
  })
})
