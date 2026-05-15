'use server'

import { revalidatePath } from 'next/cache'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getOrCreateDayRecord, toggleChoreCompletion } from '@/lib/db/day-records'
import { calculatePenalties, calculateEffortReward, calculateChoreRewards } from '@/lib/points'
import { isChoreAvailableOn, dayOfWeekFromDate, todayInTimezone } from '@/lib/chore-schedule'
import type { ChoreCompletion } from '@/lib/types'

async function getCurrentKid() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: kid } = await supabase
    .from('kids')
    .select('id, family_id, points')
    .eq('supabase_user_id', user.id)
    .maybeSingle()

  return { user, kid, supabase }
}

export async function getDayRecord(kidId: string, date: string) {
  return getOrCreateDayRecord(kidId, date)
}

export async function toggleChore(completionId: string, completed: boolean, dayRecordId: string) {
  const supabase = await createSupabaseServerClient()

  // Verify day is not ended
  const { data: dayRecord } = await supabase
    .from('day_records')
    .select('ended_at, kid_id, date')
    .eq('id', dayRecordId)
    .single()

  if (dayRecord?.ended_at) throw new Error('Day has already ended')

  // Enforce uncheck limit (only one uncheck per chore per day)
  if (!completed) {
    const { data: completionRow } = await supabase
      .from('chore_completions')
      .select('uncheck_count')
      .eq('id', completionId)
      .single()

    if (completionRow && completionRow.uncheck_count >= 1) {
      throw new Error('Chore can only be unchecked once per day')
    }

    // Increment uncheck_count
    await supabase
      .from('chore_completions')
      .update({ uncheck_count: (completionRow?.uncheck_count ?? 0) + 1 })
      .eq('id', completionId)
  }

  // Enforce chore schedule server-side (only block completion, not un-completion)
  if (completed) {
    const { data: completionRow } = await supabase
      .from('chore_completions')
      .select('chore_assignment_id')
      .eq('id', completionId)
      .single()

    if (completionRow) {
      const { data: assignment } = await supabase
        .from('chore_assignments')
        .select('chore_id')
        .eq('id', completionRow.chore_assignment_id)
        .single()

      if (assignment) {
        const { data: chore } = await supabase
          .from('chores')
          .select('allowed_days')
          .eq('id', assignment.chore_id)
          .single()

        if (chore && !isChoreAvailableOn(chore.allowed_days, dayOfWeekFromDate(dayRecord!.date))) {
          throw new Error('Chore not available on this day')
        }
      }
    }
  }

  const completion = await toggleChoreCompletion(completionId, completed)

  // Log activity
  const { data: kid } = await supabase
    .from('kids')
    .select('family_id')
    .eq('id', dayRecord!.kid_id)
    .single()

  await supabase.from('activity_log').insert({
    family_id: kid!.family_id,
    kid_id: dayRecord!.kid_id,
    actor_type: 'kid' as const,
    action_type: completed ? 'chore_completed' as const : 'chore_unchecked' as const,
    metadata: { completion_id: completionId },
    points_delta: null,
  })

  revalidatePath('/')
  return completion
}

export async function declareRestDay(dayRecordId: string) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: kid } = await supabase
    .from('kids')
    .select('id, family_id, points')
    .eq('supabase_user_id', user.id)
    .single()

  if (!kid) throw new Error('Kid not found')
  if (kid.points < 100) return { error: 'Insufficient points for rest day' }

  // Check if already a rest day (idempotent)
  const { data: dayRecord } = await supabase
    .from('day_records')
    .select('is_rest_day')
    .eq('id', dayRecordId)
    .single()

  if (dayRecord?.is_rest_day) return { success: true }

  // Mark as rest day
  await supabase
    .from('day_records')
    .update({ is_rest_day: true })
    .eq('id', dayRecordId)

  // Log
  await supabase.from('activity_log').insert({
    family_id: kid.family_id,
    kid_id: kid.id,
    actor_type: 'kid' as const,
    action_type: 'rest_day_purchased' as const,
    metadata: { day_record_id: dayRecordId },
    points_delta: -100,
  })

  revalidatePath('/')
  return { success: true }
}

export async function endDay(dayRecordId: string, effortLevelId?: string) {
  const supabase = await createSupabaseServerClient()

  // Check not already ended
  const { data: dayRecord } = await supabase
    .from('day_records')
    .select('ended_at, kid_id, is_rest_day')
    .eq('id', dayRecordId)
    .single()

  if (dayRecord?.ended_at) return { success: true } // idempotent

  const kidId = dayRecord!.kid_id

  const { data: kid } = await supabase
    .from('kids')
    .select('family_id')
    .eq('id', kidId)
    .single()

  // Get completions for penalty calculation
  const { data: rawCompletions } = await supabase
    .from('chore_completions')
    .select()
    .eq('day_record_id', dayRecordId)

  const completions: ChoreCompletion[] = (rawCompletions ?? []).map((c) => ({
    id: c.id,
    dayRecordId: c.day_record_id,
    choreAssignmentId: c.chore_assignment_id,
    choreNameSnapshot: c.chore_name_snapshot,
    penaltySnapshot: c.penalty_snapshot,
    isImportantSnapshot: c.is_important_snapshot,
    rewardSnapshot: c.reward_snapshot,
    completedAt: c.completed_at,
    uncheckCount: c.uncheck_count,
  }))

  const totalPenalty = calculatePenalties(completions, dayRecord!.is_rest_day)

  // Apply penalty
  if (totalPenalty > 0) {
    await supabase.from('activity_log').insert({
      family_id: kid!.family_id,
      kid_id: kidId,
      actor_type: 'kid' as const,
      action_type: 'penalty_applied' as const,
      metadata: { day_record_id: dayRecordId, total_penalty: totalPenalty },
      points_delta: -totalPenalty,
    })
  }

  // Grant reward points for each completed chore with reward_snapshot > 0
  const choreRewards = calculateChoreRewards(completions)
  for (const { completion, reward } of choreRewards) {
    await supabase.from('activity_log').insert({
      family_id: kid!.family_id,
      kid_id: kidId,
      actor_type: 'kid' as const,
      action_type: 'chore_completion_reward' as const,
      metadata: { chore_name: completion.choreNameSnapshot, completion_id: completion.id },
      points_delta: reward,
    })
  }

  // Apply effort reward
  if (effortLevelId) {
    const { data: effortLevel } = await supabase
      .from('effort_levels')
      .select()
      .eq('id', effortLevelId)
      .single()

    if (effortLevel) {
      const effortPoints = calculateEffortReward({ id: effortLevel.id, familyId: effortLevel.family_id, name: effortLevel.name, points: effortLevel.points })
      if (effortPoints > 0) {
        await supabase.from('activity_log').insert({
          family_id: kid!.family_id,
          kid_id: kidId,
          actor_type: 'kid' as const,
          action_type: 'effort_awarded' as const,
          metadata: { effort_level_id: effortLevelId, effort_level_name: effortLevel.name },
          points_delta: effortPoints,
        })
      }

      await supabase
        .from('day_records')
        .update({ effort_level_id: effortLevelId })
        .eq('id', dayRecordId)
    }
  }

  // Mark day as ended
  await supabase
    .from('day_records')
    .update({ ended_at: new Date().toISOString() })
    .eq('id', dayRecordId)

  await supabase.from('activity_log').insert({
    family_id: kid!.family_id,
    kid_id: kidId,
    actor_type: 'kid' as const,
    action_type: 'day_ended' as const,
    metadata: { day_record_id: dayRecordId },
    points_delta: null,
  })

  revalidatePath('/')
  return { success: true }
}

export async function undoEndDay(dayRecordId: string) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: kid } = await supabase
    .from('kids')
    .select('id, family_id')
    .eq('supabase_user_id', user.id)
    .maybeSingle()

  if (!kid) throw new Error('Kid not found')

  const { data: dayRecord } = await supabase
    .from('day_records')
    .select('ended_at, kid_id, date, undo_end_count')
    .eq('id', dayRecordId)
    .single()

  if (!dayRecord?.ended_at) return { error: 'Day has not been ended' }
  if (dayRecord.kid_id !== kid.id) return { error: 'Not authorized' }

  // Current-day restriction
  const { data: family } = await supabase
    .from('families')
    .select('timezone')
    .eq('id', kid.family_id)
    .single()
  const today = todayInTimezone(family?.timezone ?? 'UTC')
  if (dayRecord.date !== today) return { error: 'Can only undo today\'s end day' }

  // One-undo limit
  if (dayRecord.undo_end_count >= 1) return { error: 'Undo already used for today' }

  // Find the most recent day_ended event to establish the upper bound of the current End Day run
  const { data: dayEndedEvent } = await supabase
    .from('activity_log')
    .select('created_at')
    .eq('kid_id', kid.id)
    .eq('action_type', 'day_ended')
    .filter('metadata->>day_record_id', 'eq', dayRecordId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const endedAt = dayEndedEvent?.created_at ?? new Date().toISOString()

  // Find the most recent day_undone event before this End Day — establishes the lower bound
  // so we only reverse events inserted during the current End Day run (FR-013)
  const { data: lastUndoneEvent } = await supabase
    .from('activity_log')
    .select('created_at')
    .eq('kid_id', kid.id)
    .eq('action_type', 'day_undone')
    .filter('metadata->>day_record_id', 'eq', dayRecordId)
    .lt('created_at', endedAt)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const afterAt = lastUndoneEvent?.created_at ?? '1970-01-01T00:00:00.000Z'

  // Fetch only events inserted during the current End Day run
  const { data: logEntries } = await supabase
    .from('activity_log')
    .select('id, action_type, points_delta, metadata')
    .eq('kid_id', kid.id)
    .in('action_type', ['penalty_applied', 'effort_awarded', 'chore_completion_reward'])
    .not('points_delta', 'is', null)
    .gt('created_at', afterAt)
    .lte('created_at', endedAt)

  for (const entry of logEntries ?? []) {
    if (entry.action_type === 'penalty_applied') {
      await supabase.from('activity_log').insert({
        family_id: kid.family_id,
        kid_id: kid.id,
        actor_type: 'kid' as const,
        action_type: 'penalty_reversed' as const,
        metadata: { day_record_id: dayRecordId },
        points_delta: -(entry.points_delta!),
      })
    } else if (entry.action_type === 'effort_awarded') {
      await supabase.from('activity_log').insert({
        family_id: kid.family_id,
        kid_id: kid.id,
        actor_type: 'kid' as const,
        action_type: 'effort_reversed' as const,
        metadata: { day_record_id: dayRecordId },
        points_delta: -(entry.points_delta!),
      })
    } else if (entry.action_type === 'chore_completion_reward') {
      const meta = entry.metadata as Record<string, unknown>
      await supabase.from('activity_log').insert({
        family_id: kid.family_id,
        kid_id: kid.id,
        actor_type: 'kid' as const,
        action_type: 'chore_completion_reward_reversed' as const,
        metadata: { chore_name: meta.chore_name as string, original_event_id: entry.id },
        points_delta: -(entry.points_delta!),
      })
    }
  }

  await supabase.from('activity_log').insert({
    family_id: kid.family_id,
    kid_id: kid.id,
    actor_type: 'kid' as const,
    action_type: 'day_undone' as const,
    metadata: { day_record_id: dayRecordId },
    points_delta: null,
  })

  await supabase
    .from('day_records')
    .update({ ended_at: null, effort_level_id: null, undo_end_count: dayRecord.undo_end_count + 1 })
    .eq('id', dayRecordId)

  revalidatePath('/')
  return { success: true }
}

export async function undoRestDay(dayRecordId: string) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: kid } = await supabase
    .from('kids')
    .select('id, family_id')
    .eq('supabase_user_id', user.id)
    .maybeSingle()

  if (!kid) throw new Error('Kid not found')

  const { data: dayRecord } = await supabase
    .from('day_records')
    .select('is_rest_day, kid_id, date, undo_rest_day_count')
    .eq('id', dayRecordId)
    .single()

  if (!dayRecord?.is_rest_day) return { error: 'Not a rest day' }
  if (dayRecord.kid_id !== kid.id) return { error: 'Not authorized' }

  const { data: family } = await supabase
    .from('families')
    .select('timezone')
    .eq('id', kid.family_id)
    .single()
  const today = todayInTimezone(family?.timezone ?? 'UTC')
  if (dayRecord.date !== today) return { error: 'Can only undo today\'s rest day' }

  if (dayRecord.undo_rest_day_count >= 1) return { error: 'Undo already used for rest day today' }

  await supabase
    .from('day_records')
    .update({ is_rest_day: false, undo_rest_day_count: dayRecord.undo_rest_day_count + 1 })
    .eq('id', dayRecordId)

  await supabase.from('activity_log').insert({
    family_id: kid.family_id,
    kid_id: kid.id,
    actor_type: 'kid' as const,
    action_type: 'rest_day_reversed' as const,
    metadata: { day_record_id: dayRecordId },
    points_delta: 100,
  })

  revalidatePath('/')
  return { success: true }
}
