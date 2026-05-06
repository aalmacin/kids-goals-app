'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu } from 'lucide-react'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { logout } from '@/lib/actions/auth'

interface AdminMobileMenuProps {
  familyExists: boolean
}

export function AdminMobileMenu({ familyExists }: AdminMobileMenuProps) {
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
        <nav className="flex flex-col gap-4">
          {familyExists && (
            <>
              <Link
                href="/admin/kids"
                className="text-lg hover:text-indigo-600"
                onClick={() => setOpen(false)}
              >
                Kids
              </Link>
              <Link
                href="/admin/chores"
                className="text-lg hover:text-indigo-600"
                onClick={() => setOpen(false)}
              >
                Chores
              </Link>
              <Link
                href="/admin/effort"
                className="text-lg hover:text-indigo-600"
                onClick={() => setOpen(false)}
              >
                Effort
              </Link>
              <Link
                href="/admin/family"
                className="text-lg hover:text-indigo-600"
                onClick={() => setOpen(false)}
              >
                Family
              </Link>
              <Link
                href="/admin/rewards"
                className="text-lg hover:text-indigo-600"
                onClick={() => setOpen(false)}
              >
                Rewards
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
