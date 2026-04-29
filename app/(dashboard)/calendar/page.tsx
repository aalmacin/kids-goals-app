import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getDayRecordsByKid } from '@/lib/db/day-records'
import { CalendarView } from '@/components/calendar/CalendarView'

export default async function CalendarPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: kid } = await supabase
    .from('kids')
    .select('id')
    .eq('supabase_user_id', user.id)
    .maybeSingle()

  if (!kid) redirect('/admin')

  const dayRecords = await getDayRecordsByKid(kid.id)

  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Calendar 📅</h1>
      <p className="text-gray-600">
        Green dates have been completed. Click any date to view or update it.
      </p>
      <CalendarView
        dayRecords={dayRecords.map((d) => ({
          date: d.date,
          endedAt: d.ended_at,
        }))}
        selectedDate={today}
      />
    </div>
  )
}
