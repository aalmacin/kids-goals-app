'use client'

import { useEffect, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { Leaderboard } from '@/components/family/Leaderboard'
import { DailyProgress } from '@/components/family/DailyProgress'
import { WeeklySummary } from '@/components/family/WeeklySummary'
import type { FamilyMember, DailyProgressEntry, WeeklySummaryEntry } from '@/lib/db/family'

interface FamilyPageClientProps {
  familyId: string
  currentKidId: string
  initialMembers: FamilyMember[]
  initialDailyProgress: DailyProgressEntry[]
  initialWeeklySummary: WeeklySummaryEntry[]
  today: string
  sevenDaysAgo: string
}

export function FamilyPageClient({
  familyId,
  currentKidId,
  initialMembers,
  initialDailyProgress,
  initialWeeklySummary,
  today,
  sevenDaysAgo,
}: FamilyPageClientProps) {
  const queryClient = useQueryClient()
  const supabase = useMemo(() => createSupabaseBrowserClient(), [])

  const { data: members = initialMembers } = useQuery({
    queryKey: ['familyMembers', familyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('kids')
        .select('id, name, points')
        .eq('family_id', familyId)
        .order('points', { ascending: false })
      if (error) throw error
      return (data ?? []).map((k) => ({
        id: k.id,
        name: k.name,
        points: k.points,
      })) as FamilyMember[]
    },
    initialData: initialMembers,
  })

  useEffect(() => {
    if (!familyId) return
    const channel = supabase
      .channel(`family-members-${familyId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'kids', filter: `family_id=eq.${familyId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ['familyMembers', familyId] })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [familyId, supabase, queryClient])

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-gray-800">Family</h1>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-gray-700">🏆 Leaderboard</h2>
        <Leaderboard kids={members} currentKidId={currentKidId} />
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-gray-700">📋 Today&apos;s Progress</h2>
        <DailyProgress progress={initialDailyProgress} currentKidId={currentKidId} />
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-gray-700">📅 This Week</h2>
        <WeeklySummary summary={initialWeeklySummary} currentKidId={currentKidId} />
      </section>
    </div>
  )
}
