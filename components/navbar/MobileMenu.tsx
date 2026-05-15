'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu } from 'lucide-react'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { logout } from '@/lib/actions/auth'
import type { SessionUser } from '@/lib/types'

interface MobileMenuProps {
  session: SessionUser
  familyName?: string
}

export function MobileMenu({ session, familyName }: MobileMenuProps) {
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button variant="ghost" size="icon" className="text-white md:hidden min-h-[44px] min-w-[44px]" />
        }
      >
        <Menu className="h-6 w-6" />
      </SheetTrigger>
      <SheetContent side="right">
        {familyName && (
          <p className="text-sm font-semibold text-gray-500 mb-4">{familyName}</p>
        )}
        <nav className="flex flex-col gap-4">
          {session.role === 'parent' && (
            <>
              <Link
                href="/admin"
                className="text-lg hover:text-indigo-600"
                onClick={() => setOpen(false)}
              >
                Admin
              </Link>
              <Link
                href="/activity"
                className="text-lg hover:text-indigo-600"
                onClick={() => setOpen(false)}
              >
                Activity
              </Link>
            </>
          )}
          {session.role === 'kid' && (
            <>
              <Link
                href="/"
                className="text-lg hover:text-indigo-600"
                onClick={() => setOpen(false)}
              >
                Today
              </Link>
              <Link
                href="/tasks"
                className="text-lg hover:text-indigo-600"
                onClick={() => setOpen(false)}
              >
                Tasks
              </Link>
              <Link
                href="/rewards"
                className="text-lg hover:text-indigo-600"
                onClick={() => setOpen(false)}
              >
                Rewards
              </Link>
              <Link
                href="/activity"
                className="text-lg hover:text-indigo-600"
                onClick={() => setOpen(false)}
              >
                Activity
              </Link>
              <Link
                href="/calendar"
                className="text-lg hover:text-indigo-600"
                onClick={() => setOpen(false)}
              >
                Calendar
              </Link>
              <Link
                href="/family"
                className="text-lg hover:text-indigo-600"
                onClick={() => setOpen(false)}
              >
                Family
              </Link>
            </>
          )}
          <form action={logout} className="mt-2">
            <Button type="submit" variant="outline" className="w-full min-h-[44px]">
              Log Out
            </Button>
          </form>
        </nav>
      </SheetContent>
    </Sheet>
  )
}
