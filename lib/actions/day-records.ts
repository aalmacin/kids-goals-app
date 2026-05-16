'use server'

import { revalidatePath } from 'next/cache'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getOrCreateDayRecord, toggleChoreCompletion } from '@/lib/db/day-records'
import { calculatePenalties, calculateChoreRewards } from '@/lib/points'
import { isChoreAvailableOn, dayOfWeekFromDate } from '@/lib/chore-schedule'
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

export async function endDay(dayRecordId: string) {
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

