import Link from 'next/link'
import { logout } from '@/lib/actions/auth'
import { Button } from '@/components/ui/button'
import { AppLogo } from './AppLogo'
import { PointsBadge } from './PointsBadge'
import type { SessionUser } from '@/lib/types'

interface NavBarProps {
  session: SessionUser
  kidPoints?: number
  familyName?: string
}

export function NavBar({ session, kidPoints, familyName }: NavBarProps) {
  const kidId = session.role === 'kid' ? session.kidId : undefined

  return (
    <nav className="bg-indigo-600 text-white px-6 py-4 shadow-lg">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-xl font-bold text-white">
          <AppLogo className="h-8 w-auto" />
          <span>Kids Goals</span>
        </Link>

        <div className="flex items-center gap-4">
          {session.role === 'kid' && kidPoints !== undefined && kidId && (
            <PointsBadge points={kidPoints} kidId={kidId} />
          )}

          {session.role === 'parent' && (
            <>
              <Link href="/admin" className="hover:text-indigo-200 text-sm">
                Admin
              </Link>
              <Link href="/activity" className="hover:text-indigo-200 text-sm">
                Activity
              </Link>
            </>
          )}

          {session.role === 'kid' && (
            <>
              <Link href="/" className="hover:text-indigo-200 text-sm">
                Today
              </Link>
              <Link href="/rewards" className="hover:text-indigo-200 text-sm">
                Rewards
              </Link>
              <Link href="/activity" className="hover:text-indigo-200 text-sm">
                Activity
              </Link>
              <Link href="/calendar" className="hover:text-indigo-200 text-sm">
                Calendar
              </Link>
            </>
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
      </div>
    </nav>
  )
}
