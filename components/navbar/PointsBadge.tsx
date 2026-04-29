'use client'

import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Badge } from '@/components/ui/badge'
import { Star } from 'lucide-react'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'

interface PointsBadgeProps {
  points: number
  kidId: string
}

export function PointsBadge({ points: initialPoints, kidId }: PointsBadgeProps) {
  const [points, setPoints] = useState(initialPoints)
  const queryClient = useQueryClient()

  useEffect(() => {
    const supabase = createSupabaseBrowserClient()
    const channel = supabase
      .channel(`kid-points-${kidId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'kids', filter: `id=eq.${kidId}` },
        (payload) => {
          const newPoints = (payload.new as { points: number }).points
          setPoints(newPoints)
          queryClient.invalidateQueries({ queryKey: ['points', kidId] })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [kidId, queryClient])

  return (
    <Badge className="bg-yellow-400 text-yellow-900 hover:bg-yellow-500 font-bold px-3 py-1 text-sm">
      <Star className="w-3.5 h-3.5 mr-1" />
      {points} pts
    </Badge>
  )
}
