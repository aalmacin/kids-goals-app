import { describe, it, expect } from 'vitest'

// Pure logic extracted from completeTaskAction for unit testing
function checkTaskAvailability(
  taskType: 'one_time' | 'repeated',
  maxCompletions: number | null,
  completionCount: number,
  oncePerDay: boolean = false,
  todayCount: number = 0
): { available: boolean; reason?: string } {
  if (taskType === 'one_time' && completionCount > 0) {
    return { available: false, reason: 'Task already completed' }
  }
  if (taskType === 'repeated' && oncePerDay && todayCount > 0) {
    return { available: false, reason: 'Task already completed today' }
  }
  if (taskType === 'repeated' && maxCompletions !== null && completionCount >= maxCompletions) {
    return { available: false, reason: 'Task completion limit reached' }
  }
  return { available: true }
}

// Pure logic for undo validation
function checkUndoAvailability(
  taskType: 'one_time' | 'repeated',
  todayCount: number
): { available: boolean; reason?: string } {
  if (taskType === 'one_time') {
    return { available: false, reason: 'Cannot undo one-time task' }
  }
  if (todayCount === 0) {
    return { available: false, reason: 'No completion to undo today' }
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

describe('checkTaskAvailability — once_per_day tasks', () => {
  it('is available when todayCount is 0', () => {
    expect(checkTaskAvailability('repeated', null, 0, true, 0)).toEqual({ available: true })
  })

  it('is unavailable when todayCount > 0', () => {
    expect(checkTaskAvailability('repeated', null, 1, true, 1)).toEqual({
      available: false,
      reason: 'Task already completed today',
    })
  })

  it('once_per_day takes priority over max_completions check', () => {
    // Even if max_completions not reached, once_per_day blocks if done today
    expect(checkTaskAvailability('repeated', 10, 1, true, 1)).toEqual({
      available: false,
      reason: 'Task already completed today',
    })
  })

  it('does not apply once_per_day to one_time tasks', () => {
    // one_time tasks use their own guard; oncePerDay flag is irrelevant
    expect(checkTaskAvailability('one_time', null, 0, true, 0)).toEqual({ available: true })
  })
})

describe('checkUndoAvailability', () => {
  it('allows undo for repeated task with todayCount > 0', () => {
    expect(checkUndoAvailability('repeated', 1)).toEqual({ available: true })
    expect(checkUndoAvailability('repeated', 5)).toEqual({ available: true })
  })

  it('rejects undo for one_time task', () => {
    expect(checkUndoAvailability('one_time', 1)).toEqual({
      available: false,
      reason: 'Cannot undo one-time task',
    })
  })

  it('rejects undo when no same-day completion exists', () => {
    expect(checkUndoAvailability('repeated', 0)).toEqual({
      available: false,
      reason: 'No completion to undo today',
    })
  })
})
