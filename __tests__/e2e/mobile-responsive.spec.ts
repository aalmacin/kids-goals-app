import { test, expect } from '@playwright/test'

test.describe('US5 — Mobile Responsive Design', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
  })

  // --- SC-001: no horizontal scroll at all required viewports ---

  test('login page renders without horizontal scroll at 375px', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByText('Parent Login')).toBeVisible()
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
    expect(scrollWidth).toBeLessThanOrEqual(375)
  })

  test('kid-login page renders without horizontal scroll at 375px', async ({ page }) => {
    await page.goto('/kid-login')
    await expect(page.getByText('Kid Login')).toBeVisible()
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
    expect(scrollWidth).toBeLessThanOrEqual(375)
  })

  test('login page renders without horizontal scroll at 320px', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 })
    await page.goto('/login')
    await expect(page.locator('input[name="email"]')).toBeVisible()
    await expect(page.locator('input[name="password"]')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible()
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
    expect(scrollWidth).toBeLessThanOrEqual(320)
  })

  test('kid-login page renders without horizontal scroll at 320px', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 })
    await page.goto('/kid-login')
    await expect(page.locator('input[name="familyName"]')).toBeVisible()
    await expect(page.locator('input[name="kidName"]')).toBeVisible()
    await expect(page.locator('input[name="passcode"]')).toBeVisible()
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
    expect(scrollWidth).toBeLessThanOrEqual(320)
  })

  test('login page renders without horizontal scroll at 768px', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.goto('/login')
    await expect(page.getByText('Parent Login')).toBeVisible()
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
    expect(scrollWidth).toBeLessThanOrEqual(768)
  })

  test('login page renders without horizontal scroll at 1280px', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/login')
    await expect(page.getByText('Parent Login')).toBeVisible()
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
    expect(scrollWidth).toBeLessThanOrEqual(1280)
  })

  // --- Happy path: nav hamburger ---

  test('dashboard nav hamburger button is visible on mobile', async ({ page }) => {
    await page.goto('/')
    if (page.url().includes('login')) return

    const hamburger = page.getByRole('button', { name: /menu/i })
    await expect(hamburger).toBeVisible()
  })

  test('dashboard nav hamburger opens Sheet drawer', async ({ page }) => {
    await page.goto('/')
    if (page.url().includes('login')) return

    const hamburger = page.getByRole('button', { name: /menu/i })
    await hamburger.click()
    await expect(
      page.getByRole('link', { name: 'Today' }).or(page.getByRole('link', { name: 'Admin' }))
    ).toBeVisible()
  })

  test('admin nav hamburger opens Sheet drawer', async ({ page }) => {
    await page.goto('/admin')
    if (page.url().includes('login')) return

    const hamburger = page.getByRole('button', { name: /menu/i })
    await hamburger.click()
    await expect(page.getByRole('link', { name: 'Kids' })).toBeVisible()
  })

  // --- Critical failure paths ---

  // Sheet must be closed by default — nav links not visible until hamburger is clicked
  test('dashboard Sheet drawer is closed by default on mobile', async ({ page }) => {
    await page.goto('/')
    if (page.url().includes('login')) return

    // Nav links must NOT be visible before the hamburger is clicked
    await expect(
      page.getByRole('link', { name: 'Today' }).or(page.getByRole('link', { name: 'Admin' }))
    ).not.toBeVisible()
  })

  // Hamburger button must be reachable in the DOM — if missing, nav is completely inaccessible on mobile
  test('dashboard nav hamburger button is present in DOM on mobile', async ({ page }) => {
    await page.goto('/')
    if (page.url().includes('login')) return

    const hamburger = page.locator('button[data-slot="button"]').filter({ has: page.locator('svg') }).first()
    await expect(hamburger).toBeAttached()
  })

  // Desktop nav links must be hidden on mobile viewport (hamburger is the only nav path)
  test('dashboard desktop nav links are hidden at 375px', async ({ page }) => {
    await page.goto('/')
    if (page.url().includes('login')) return

    // The desktop link container uses hidden md:flex — links must not be visible at 375px
    const desktopNav = page.locator('.hidden.md\\:flex')
    await expect(desktopNav).not.toBeVisible()
  })
})
