import { describe, it, expect } from 'vitest'

// Pure logic extracted from completeTaskAction for unit testing
function checkTaskAvailability(
  taskType: 'one_time' | 'repeated',
  maxCompletions: number | null,
  completionCount: number
): { available: boolean; reason?: string } {
  if (taskType === 'one_time' && completionCount > 0) {
    return { available: false, reason: 'Task already completed' }
  }
  if (taskType === 'repeated' && maxCompletions !== null && completionCount >= maxCompletions) {
    return { available: false, reason: 'Task completion limit reached' }
  }
  return { available: true }
}

describe('checkTaskAvailability — one_time tasks', () => {
  it('is available when completion count is 0', () => {
    expect(checkTaskAvailability('one_time', null, 0)).toEqual({ available: true })
  })

  it('is unavailable when completion count is 1', () => {
    expect(checkTaskAvailability('one_time', null, 1)).toEqual({
      available: false,
      reason: 'Task already completed',
    })
  })

  it('is unavailable for any completion count > 0', () => {
    expect(checkTaskAvailability('one_time', null, 5)).toEqual({
      available: false,
      reason: 'Task already completed',
    })
  })
})

describe('checkTaskAvailability — repeated tasks (unlimited)', () => {
  it('is available when completion count is 0', () => {
    expect(checkTaskAvailability('repeated', null, 0)).toEqual({ available: true })
  })

  it('is always available regardless of high completion count', () => {
    expect(checkTaskAvailability('repeated', null, 100)).toEqual({ available: true })
  })
})

describe('checkTaskAvailability — repeated tasks (with limit)', () => {
  it('is available when below limit', () => {
    expect(checkTaskAvailability('repeated', 3, 0)).toEqual({ available: true })
    expect(checkTaskAvailability('repeated', 3, 2)).toEqual({ available: true })
  })

  it('is unavailable when at limit', () => {
    expect(checkTaskAvailability('repeated', 3, 3)).toEqual({
      available: false,
      reason: 'Task completion limit reached',
    })
  })

  it('is unavailable when above limit', () => {
    expect(checkTaskAvailability('repeated', 3, 5)).toEqual({
      available: false,
      reason: 'Task completion limit reached',
    })
  })

  it('is unavailable when limit is 1 and already completed once', () => {
    expect(checkTaskAvailability('repeated', 1, 1)).toEqual({
      available: false,
      reason: 'Task completion limit reached',
    })
  })
})
