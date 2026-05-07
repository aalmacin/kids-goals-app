import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { calculateDaysRemaining, isSessionExpiring, EXPIRY_DAYS, WARNING_DAYS } from '@/lib/session'

const MS_PER_DAY = 1000 * 60 * 60 * 24

describe('calculateDaysRemaining', () => {
  it('returns EXPIRY_DAYS when session just started', () => {
    const now = Date.now()
    const result = calculateDaysRemaining(now)
    expect(result).toBeCloseTo(EXPIRY_DAYS, 0)
  })

  it('returns 0 when session is exactly at expiry', () => {
    const sessionStartedAt = Date.now() - EXPIRY_DAYS * MS_PER_DAY
    const result = calculateDaysRemaining(sessionStartedAt)
    expect(result).toBeCloseTo(0, 1)
  })

  it('returns negative value when session is past expiry', () => {
    const sessionStartedAt = Date.now() - (EXPIRY_DAYS + 10) * MS_PER_DAY
    const result = calculateDaysRemaining(sessionStartedAt)
    expect(result).toBeLessThan(0)
  })

  it('returns correct days for mid-range session age', () => {
    const daysOld = 180
    const sessionStartedAt = Date.now() - daysOld * MS_PER_DAY
    const result = calculateDaysRemaining(sessionStartedAt)
    expect(result).toBeCloseTo(EXPIRY_DAYS - daysOld, 0)
  })
})

describe('isSessionExpiring', () => {
  it('returns false when session is new', () => {
    const sessionStartedAt = Date.now()
    expect(isSessionExpiring(sessionStartedAt)).toBe(false)
  })

  it('returns false when more than WARNING_DAYS remain', () => {
    const daysOld = EXPIRY_DAYS - WARNING_DAYS - 1
    const sessionStartedAt = Date.now() - daysOld * MS_PER_DAY
    expect(isSessionExpiring(sessionStartedAt)).toBe(false)
  })

  it('returns true when exactly WARNING_DAYS remain', () => {
    const daysOld = EXPIRY_DAYS - WARNING_DAYS
    const sessionStartedAt = Date.now() - daysOld * MS_PER_DAY
    expect(isSessionExpiring(sessionStartedAt)).toBe(true)
  })

  it('returns true when fewer than WARNING_DAYS remain', () => {
    const daysOld = EXPIRY_DAYS - WARNING_DAYS + 5
    const sessionStartedAt = Date.now() - daysOld * MS_PER_DAY
    expect(isSessionExpiring(sessionStartedAt)).toBe(true)
  })

  it('returns true when session is expired', () => {
    const sessionStartedAt = Date.now() - (EXPIRY_DAYS + 1) * MS_PER_DAY
    expect(isSessionExpiring(sessionStartedAt)).toBe(true)
  })
})
