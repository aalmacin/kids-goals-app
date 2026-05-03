import { createSupabaseServerClient } from '@/lib/supabase/server'

export type SiblingKid = {
  id: string
  name: string
  points: number
}

export type DailyProgressEntry = {
  kidId: string
  name: string
  completedCount: number
  totalCount: number
  isRestDay: boolean
}

export type WeeklySummaryEntry = {
  kidId: string
  name: string
  weeklyPoints: number
}

export async function getSiblings(familyId: string): Promise<SiblingKid[]> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase
    .from('kids')
    .select('id, name, points')
    .eq('family_id', familyId)
    .order('points', { ascending: false })
  if (error) throw error
  return data.map((k) => ({ id: k.id, name: k.name, points: k.points }))
}

export async function getTodayDailyProgress(
  siblings: SiblingKid[],
  today: string
): Promise<DailyProgressEntry[]> {
  if (siblings.length === 0) return []

  const supabase = await createSupabaseServerClient()
  const kidIds = siblings.map((k) => k.id)

  const { data: dayRecords, error: drError } = await supabase
    .from('day_records')
    .select('id, kid_id, is_rest_day')
    .in('kid_id', kidIds)
    .eq('date', today)

  if (drError) throw drError

  const dayRecordMap = new Map((dayRecords ?? []).map((dr) => [dr.kid_id, dr]))
  const dayRecordIds = (dayRecords ?? []).map((dr) => dr.id)

  let completionsByDayRecord = new Map<string, { total: number; completed: number }>()

  if (dayRecordIds.length > 0) {
    const { data: completions, error: compError } = await supabase
      .from('chore_completions')
      .select('day_record_id, completed_at')
      .in('day_record_id', dayRecordIds)

    if (compError) throw compError

    for (const c of completions ?? []) {
      const entry = completionsByDayRecord.get(c.day_record_id) ?? { total: 0, completed: 0 }
      entry.total += 1
      if (c.completed_at !== null) entry.completed += 1
      completionsByDayRecord.set(c.day_record_id, entry)
    }
  }

  return siblings.map((kid) => {
    const dr = dayRecordMap.get(kid.id)
    if (!dr) {
      return { kidId: kid.id, name: kid.name, completedCount: 0, totalCount: 0, isRestDay: false }
    }
    const counts = completionsByDayRecord.get(dr.id) ?? { total: 0, completed: 0 }
    return {
      kidId: kid.id,
      name: kid.name,
      completedCount: counts.completed,
      totalCount: counts.total,
      isRestDay: dr.is_rest_day,
    }
  })
}

export async function getWeeklyPointsSummary(
  familyId: string,
  siblings: SiblingKid[],
  sevenDaysAgo: string
): Promise<WeeklySummaryEntry[]> {
  if (siblings.length === 0) return []

  const supabase = await createSupabaseServerClient()
  const kidIds = siblings.map((k) => k.id)

  const { data, error } = await supabase
    .from('activity_log')
    .select('kid_id, points_delta')
    .eq('family_id', familyId)
    .in('kid_id', kidIds)
    .gte('created_at', sevenDaysAgo)
    .not('points_delta', 'is', null)

  if (error) throw error

  const weeklyByKid = new Map<string, number>()
  for (const entry of data ?? []) {
    if (entry.kid_id && entry.points_delta !== null) {
      weeklyByKid.set(entry.kid_id, (weeklyByKid.get(entry.kid_id) ?? 0) + entry.points_delta)
    }
  }

  return siblings
    .map((kid) => ({
      kidId: kid.id,
      name: kid.name,
      weeklyPoints: weeklyByKid.get(kid.id) ?? 0,
    }))
    .sort((a, b) => b.weeklyPoints - a.weeklyPoints)
}
