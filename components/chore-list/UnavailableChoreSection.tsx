import { IconDisplay } from '@/components/ui/IconPicker'
import { Badge } from '@/components/ui/badge'

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

type UnavailableChore = {
  id: string
  name: string
  icon: string
  nextAvailableDay: number | null // day of week, null = unreachable (shouldn't happen)
}

type Props = {
  chores: UnavailableChore[]
}

export function UnavailableChoreSection({ chores }: Props) {
  if (chores.length === 0) return null

  return (
    <div className="mt-4 space-y-2">
      <p className="text-sm font-medium text-gray-400 uppercase tracking-wide">Not available today</p>
      {chores.map((chore) => (
        <div
          key={chore.id}
          className="flex items-center gap-4 p-4 rounded-xl border-2 border-gray-100 bg-gray-50 opacity-60"
        >
          <div className="w-6 h-6 rounded border-2 border-gray-200 shrink-0" aria-hidden />
          <div className="text-gray-400">
            <IconDisplay iconName={chore.icon} className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-gray-400">{chore.name}</p>
          </div>
          {chore.nextAvailableDay !== null && (
            <Badge variant="outline" className="text-xs text-gray-400 border-gray-200 shrink-0">
              {DAY_NAMES[chore.nextAvailableDay]}
            </Badge>
          )}
        </div>
      ))}
    </div>
  )
}
