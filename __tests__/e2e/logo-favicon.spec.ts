import { test, expect } from '@playwright/test'

test.describe('Logo and Favicon', () => {
  test('favicon is served at /favicon.ico', async ({ page }) => {
    const response = await page.goto('/favicon.ico')
    expect(response?.status()).toBe(200)
  })

  test('SVG icon is served at /icon.svg', async ({ page }) => {
    const response = await page.goto('/icon.svg')
    expect(response?.status()).toBe(200)
    expect(response?.headers()['content-type']).toContain('image/svg+xml')
  })

  test('apple touch icon is served at /apple-icon.png', async ({ page }) => {
    const response = await page.goto('/apple-icon.png')
    expect(response?.status()).toBe(200)
  })

  test('PWA manifest references correct icons', async ({ page }) => {
    const response = await page.goto('/manifest.webmanifest')
    expect(response?.status()).toBe(200)
    const manifest = await response?.json()
    expect(manifest.icons).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ src: '/favicon-192.png', sizes: '192x192' }),
        expect.objectContaining({ src: '/favicon-512.png', sizes: '512x512' }),
      ])
    )
  })
})
