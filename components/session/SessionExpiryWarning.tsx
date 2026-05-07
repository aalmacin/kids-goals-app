'use client'

import { useState } from 'react'
import { Alert, AlertDescription, AlertTitle, AlertAction } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { refreshSession } from '@/lib/actions/auth'

interface SessionExpiryWarningProps {
  daysRemaining: number
}

export function SessionExpiryWarning({ daysRemaining }: SessionExpiryWarningProps) {
  const [dismissed, setDismissed] = useState(false)
  const [isPending, setIsPending] = useState(false)

  if (dismissed) return null

  const days = Math.max(0, Math.floor(daysRemaining))

  async function handleStayLoggedIn() {
    setIsPending(true)
    await refreshSession()
    setDismissed(true)
    setIsPending(false)
  }

  return (
    <Alert variant="destructive" className="rounded-none border-x-0 border-t-0">
      <AlertTitle>Your session expires in {days} day{days !== 1 ? 's' : ''}</AlertTitle>
      <AlertDescription>
        Click &quot;Stay logged in&quot; to extend your session by another year.
      </AlertDescription>
      <AlertAction className="flex gap-2">
        <Button
          size="sm"
          variant="destructive"
          onClick={handleStayLoggedIn}
          disabled={isPending}
        >
          {isPending ? 'Refreshing…' : 'Stay logged in'}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setDismissed(true)}
          disabled={isPending}
        >
          Dismiss
        </Button>
      </AlertAction>
    </Alert>
  )
}
