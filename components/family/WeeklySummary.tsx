import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { WeeklySummaryEntry } from '@/lib/db/family'

interface WeeklySummaryProps {
  summary: WeeklySummaryEntry[]
  currentKidId: string
}

export function WeeklySummary({ summary, currentKidId }: WeeklySummaryProps) {
  return (
    <div className="space-y-2">
      {summary.map((entry, index) => {
        const isMe = entry.kidId === currentKidId
        const rank = index + 1

        return (
          <Card
            key={entry.kidId}
            className={isMe ? 'border-indigo-400 bg-indigo-50' : undefined}
          >
            <CardContent className="flex items-center gap-4 py-3">
              <span className="text-lg font-bold text-gray-400 w-6 text-center">{rank}</span>
              <span
                className={`flex-1 font-medium ${isMe ? 'text-indigo-700' : 'text-gray-800'}`}
              >
                {entry.name}
                {isMe && (
                  <Badge variant="secondary" className="ml-2 text-xs">
                    You
                  </Badge>
                )}
              </span>
              <span className="font-semibold text-gray-700">
                {entry.weeklyPoints > 0 ? '+' : ''}
                {entry.weeklyPoints} ⭐
              </span>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
