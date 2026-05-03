import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { DailyProgressEntry } from '@/lib/db/compare'

interface DailyProgressProps {
  progress: DailyProgressEntry[]
  currentKidId: string
}

export function DailyProgress({ progress, currentKidId }: DailyProgressProps) {
  return (
    <div className="space-y-2">
      {progress.map((entry) => {
        const isMe = entry.kidId === currentKidId
        const pct = entry.totalCount > 0
          ? Math.round((entry.completedCount / entry.totalCount) * 100)
          : 0
        const allDone = entry.totalCount > 0 && entry.completedCount === entry.totalCount

        return (
          <Card
            key={entry.kidId}
            className={isMe ? 'border-indigo-400 bg-indigo-50' : undefined}
          >
            <CardContent className="py-3 space-y-2">
              <div className="flex items-center gap-2">
                <span className={`flex-1 font-medium ${isMe ? 'text-indigo-700' : 'text-gray-800'}`}>
                  {entry.name}
                  {isMe && (
                    <Badge variant="secondary" className="ml-2 text-xs">
                      You
                    </Badge>
                  )}
                </span>
                {entry.isRestDay ? (
                  <Badge variant="outline" className="text-xs">Rest Day</Badge>
                ) : allDone ? (
                  <Badge className="text-xs bg-green-500">Done ✓</Badge>
                ) : (
                  <span className="text-sm text-gray-500">
                    {entry.completedCount}/{entry.totalCount}
                  </span>
                )}
              </div>
              {!entry.isRestDay && entry.totalCount > 0 && (
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-indigo-500 h-2 rounded-full transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
