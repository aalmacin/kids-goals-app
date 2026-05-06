'use client'

import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'

const DAYS = [
  { label: 'Su', value: '0' },
  { label: 'Mo', value: '1' },
  { label: 'Tu', value: '2' },
  { label: 'We', value: '3' },
  { label: 'Th', value: '4' },
  { label: 'Fr', value: '5' },
  { label: 'Sa', value: '6' },
]

type Props = {
  value: number[]
  onChange: (days: number[]) => void
}

export function DaySchedulePicker({ value, onChange }: Props) {
  const stringValue = value.map(String)

  return (
    <ToggleGroup
      multiple
      value={stringValue}
      onValueChange={(vals) => onChange(vals.map(Number))}
      variant="outline"
      aria-label="Allowed days"
    >
      {DAYS.map((day) => (
        <ToggleGroupItem key={day.value} value={day.value} aria-label={day.label}>
          {day.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}
