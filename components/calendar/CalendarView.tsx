'use client'

import { useRouter } from 'next/navigation'
import { Calendar } from '@/components/ui/calendar'
import { cn } from '@/lib/utils'

interface DayRecordSummary {
  date: string
  endedAt: string | null
}

interface CalendarViewProps {
  dayRecords: DayRecordSummary[]
  selectedDate: string
}

export function CalendarView({ dayRecords, selectedDate }: CalendarViewProps) {
  const router = useRouter()
  const endedDates = new Set(
    dayRecords.filter((d) => d.endedAt !== null).map((d) => d.date)
  )

  function handleSelect(date: Date | undefined) {
    if (!date) return
    const iso = date.toISOString().split('T')[0]
    router.push(`/?date=${iso}`)
  }

  const selected = new Date(selectedDate + 'T00:00:00')

  return (
    <Calendar
      mode="single"
      selected={selected}
      onSelect={handleSelect}
      modifiers={{
        ended: (date) => endedDates.has(date.toISOString().split('T')[0]),
      }}
      modifiersClassNames={{
        ended: 'bg-green-100 text-green-800 font-semibold rounded-full',
      }}
      className="rounded-xl border shadow-sm bg-white"
    />
  )
}
