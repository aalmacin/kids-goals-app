import { type Page, type APIRequestContext } from '@playwright/test'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'http://127.0.0.1:54321'
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''

/**
 * Creates a test parent user via the Supabase admin API and returns their credentials.
 * Caller is responsible for cleanup via deleteTestUser.
 */
export async function createTestParent(request: APIRequestContext): Promise<{
  email: string
  password: string
  userId: string
}> {
  const email = `e2e-session-${Date.now()}@example.com`
  const password = 'TestPassword123!'

  const response = await request.post(`${SUPABASE_URL}/auth/v1/admin/users`, {
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
    },
    data: { email, password, email_confirm: true },
  })

  const body = await response.json() as { id: string }
  return { email, password, userId: body.id }
}

/** Removes a test user by ID via the Supabase admin API. */
export async function deleteTestUser(request: APIRequestContext, userId: string): Promise<void> {
  await request.delete(`${SUPABASE_URL}/auth/v1/admin/users/${userId}`, {
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
    },
  })
}

/**
 * Logs in as a parent via the login form and waits for dashboard redirect.
 * After this, the browser context holds valid Supabase auth cookies + kg_session_started.
 */
export async function loginAsParent(
  page: Page,
  email: string,
  password: string,
): Promise<void> {
  await page.goto('/login')
  await page.fill('input[name="email"]', email)
  await page.fill('input[name="password"]', password)
  await page.click('button[type="submit"]')
  // Wait for redirect away from /login (dashboard or admin/family for new parents)
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 10_000 })
}
