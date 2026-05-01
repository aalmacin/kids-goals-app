'use client'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { EffortLevel } from '@/lib/types'

interface EffortDropdownProps {
  effortLevels: EffortLevel[]
  value: string
  onChange: (value: string | null) => void
}

export function EffortDropdown({ effortLevels, value, onChange }: EffortDropdownProps) {
  if (effortLevels.length === 0) return null

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-gray-700">How was your effort today?</p>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select effort level..." />
        </SelectTrigger>
        <SelectContent>
          {effortLevels.map((level) => (
            <SelectItem key={level.id} value={level.id}>
              {level.name} (+{level.points} pts)
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
