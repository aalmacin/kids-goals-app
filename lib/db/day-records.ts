import { createSupabaseServerClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/database.types'

type DayRecord = Database['public']['Tables']['day_records']['Row']
type ChoreCompletion = Database['public']['Tables']['chore_completions']['Row']

export type DayRecordWithCompletions = DayRecord & { chore_completions: ChoreCompletion[] }

export async function getOrCreateDayRecord(kidId: string, date: string): Promise<DayRecordWithCompletions> {
  const supabase = await createSupabaseServerClient()

  // Try to get existing day record
  const { data: existing, error } = await supabase
    .from('day_records')
    .select()
    .eq('kid_id', kidId)
    .eq('date', date)
    .maybeSingle()

  if (error) throw error

  let dayRecord: DayRecord

  if (!existing) {
    // Create new day record
    const { data: newRecord, error: insertError } = await supabase
      .from('day_records')
      .insert({ kid_id: kidId, date })
      .select()
      .single()
    if (insertError) throw insertError
    dayRecord = newRecord

    // Seed chore_completions from kid's active assignments
    const { data: assignments, error: assignError } = await supabase
      .from('chore_assignments')
      .select('id, chore_id')
      .eq('kid_id', kidId)

    if (assignError) throw assignError

    // Fetch chore details for each assignment
    const choreIds = (assignments ?? []).map((a) => a.chore_id)
    const { data: chores } = choreIds.length > 0
      ? await supabase.from('chores').select('id, name, penalty, is_important, deleted_at').in('id', choreIds)
      : { data: [] }

    const choreMap = new Map((chores ?? []).map((c) => [c.id, c]))

    const completions = (assignments ?? [])
      .map((a) => ({ assignment: a, chore: choreMap.get(a.chore_id) }))
      .filter(({ chore }) => chore && !chore.deleted_at)
      .map(({ assignment, chore }) => ({
        day_record_id: newRecord.id,
        chore_assignment_id: assignment.id,
        chore_name_snapshot: chore!.name,
        penalty_snapshot: chore!.penalty,
        is_important_snapshot: chore!.is_important,
      }))

    if (completions.length > 0) {
      const { error: compError } = await supabase
        .from('chore_completions')
        .insert(completions)
      if (compError) throw compError
    }
  } else {
    dayRecord = existing

    // Backfill completions for assignments added after the day record was created
    const { data: existingCompletions } = await supabase
      .from('chore_completions')
      .select('chore_assignment_id')
      .eq('day_record_id', existing.id)

    const existingAssignmentIds = new Set(
      (existingCompletions ?? []).map((c) => c.chore_assignment_id)
    )

    const { data: assignments } = await supabase
      .from('chore_assignments')
      .select('id, chore_id')
      .eq('kid_id', kidId)

    const newAssignments = (assignments ?? []).filter(
      (a) => !existingAssignmentIds.has(a.id)
    )

    if (newAssignments.length > 0) {
      const choreIds = newAssignments.map((a) => a.chore_id)
      const { data: chores } = await supabase
        .from('chores')
        .select('id, name, penalty, is_important, deleted_at')
        .in('id', choreIds)

      const choreMap = new Map((chores ?? []).map((c) => [c.id, c]))

      const newCompletions = newAssignments
        .map((a) => ({ assignment: a, chore: choreMap.get(a.chore_id) }))
        .filter(({ chore }) => chore && !chore.deleted_at)
        .map(({ assignment, chore }) => ({
          day_record_id: existing.id,
          chore_assignment_id: assignment.id,
          chore_name_snapshot: chore!.name,
          penalty_snapshot: chore!.penalty,
          is_important_snapshot: chore!.is_important,
        }))

      if (newCompletions.length > 0) {
        const { error: compError } = await supabase
          .from('chore_completions')
          .insert(newCompletions)
        if (compError) throw compError
      }
    }
  }

  // Fetch completions separately
  const { data: choreCompletions, error: compFetchError } = await supabase
    .from('chore_completions')
    .select()
    .eq('day_record_id', dayRecord.id)

  if (compFetchError) throw compFetchError

  return { ...dayRecord, chore_completions: choreCompletions ?? [] }
}

export async function toggleChoreCompletion(completionId: string, completed: boolean) {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('chore_completions')
    .update({ completed_at: completed ? new Date().toISOString() : null })
    .eq('id', completionId)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function getChoreCompletionsForDay(dayRecordId: string) {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('chore_completions')
    .select()
    .eq('day_record_id', dayRecordId)
  if (error) throw error
  return data
}

export async function getDayRecordsByKid(kidId: string) {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('day_records')
    .select('id, date, is_rest_day, ended_at')
    .eq('kid_id', kidId)
    .order('date', { ascending: false })
  if (error) throw error
  return data
}
