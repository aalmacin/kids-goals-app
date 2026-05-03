import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getFamilyByParentId } from '@/lib/db/families'
import Link from 'next/link'
import { logout } from '@/lib/actions/auth'
import { Button } from '@/components/ui/button'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const pathname = (await headers()).get('x-pathname') ?? ''

  // Verify this is a parent (has a family as parent_id)
  const family = await getFamilyByParentId(user.id)

  // New parent: redirect to family setup if no family yet (but don't loop)
  if (!family && pathname !== '/admin/family') redirect('/admin/family')

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-indigo-700 text-white px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <span className="text-xl font-bold">{family ? `${family.name} — Admin` : 'Admin'}</span>
          {family && (
            <div className="flex items-center gap-4">
              <Link href="/admin/kids" className="hover:text-indigo-200 text-sm">
                Kids
              </Link>
              <Link href="/admin/chores" className="hover:text-indigo-200 text-sm">
                Chores
              </Link>
              <Link href="/admin/effort" className="hover:text-indigo-200 text-sm">
                Effort
              </Link>
              <Link href="/admin/family" className="hover:text-indigo-200 text-sm">
                Family
              </Link>
              <Link href="/admin/rewards" className="hover:text-indigo-200 text-sm">
                Rewards
              </Link>
            </div>
          )}
          <form action={logout}>
            <Button
              type="submit"
              variant="outline"
              size="sm"
              className="text-indigo-700 border-white bg-white hover:bg-indigo-50"
            >
              Log Out
            </Button>
          </form>
        </div>
      </nav>
      <main className="max-w-6xl mx-auto p-6">{children}</main>
    </div>
  )
}
