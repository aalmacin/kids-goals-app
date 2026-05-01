import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { NavBar } from '@/components/navbar/NavBar'
import { InstallPrompt } from '@/components/pwa/InstallPrompt'
import type { SessionUser } from '@/lib/types'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Determine session role: check if user is a kid
  const { data: kid } = await supabase
    .from('kids')
    .select('id, points, family_id')
    .eq('supabase_user_id', user.id)
    .maybeSingle()

  let session: SessionUser
  let kidPoints: number | undefined
  let familyName: string | undefined

  if (kid) {
    const { data: family } = await supabase
      .from('families')
      .select('name')
      .eq('id', kid.family_id)
      .maybeSingle()

    session = { role: 'kid', userId: user.id, kidId: kid.id, familyId: kid.family_id }
    kidPoints = kid.points
    familyName = family?.name
  } else {
    // Parent
    const { data: family } = await supabase
      .from('families')
      .select('id, name')
      .eq('parent_id', user.id)
      .maybeSingle()

    if (!family) redirect('/admin/family')

    session = { role: 'parent', userId: user.id, familyId: family.id }
    familyName = family.name
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50">
      <NavBar session={session} kidPoints={kidPoints} familyName={familyName} />
      <main className="max-w-4xl mx-auto p-6">{children}</main>
      <InstallPrompt />
    </div>
  )
}
