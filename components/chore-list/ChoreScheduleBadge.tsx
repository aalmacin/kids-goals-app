import { Badge } from '@/components/ui/badge'

const DAY_ABBR = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

type Props = {
  allowedDays: number[]
}

export function ChoreScheduleBadge({ allowedDays }: Props) {
  if (allowedDays.length === 0) {
    return (
      <Badge variant="outline" className="text-xs text-gray-400">
        Every day
      </Badge>
    )
  }

  const sorted = [...allowedDays].sort((a, b) => a - b)
  const label = sorted.map((d) => DAY_ABBR[d]).join(', ')

  return (
    <Badge variant="outline" className="text-xs text-indigo-600 border-indigo-200">
      {label}
    </Badge>
  )
}
