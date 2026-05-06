import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { FamilyMember } from '@/lib/db/family'

interface LeaderboardProps {
  kids: FamilyMember[]
  currentKidId: string
}

export function Leaderboard({ kids, currentKidId }: LeaderboardProps) {
  return (
    <div className="space-y-2">
      {kids.map((kid, index) => {
        const isMe = kid.id === currentKidId
        const rank = index + 1

        return (
          <Card
            key={kid.id}
            className={isMe ? 'border-indigo-400 bg-indigo-50' : undefined}
          >
            <CardContent className="flex items-center gap-4 py-3">
              <span className="text-lg font-bold text-gray-400 w-6 text-center">{rank}</span>
              <span className={`flex-1 font-medium ${isMe ? 'text-indigo-700' : 'text-gray-800'}`}>
                {kid.name}
                {isMe && (
                  <Badge variant="secondary" className="ml-2 text-xs">
                    You
                  </Badge>
                )}
              </span>
              <span className="font-semibold text-gray-700">{kid.points} ⭐</span>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
