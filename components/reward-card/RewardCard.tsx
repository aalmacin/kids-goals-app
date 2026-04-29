'use client'

import { useTransition } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { IconDisplay } from '@/components/ui/IconPicker'
import { redeemReward } from '@/lib/actions/rewards'
import type { Reward } from '@/lib/types'

interface RewardCardProps {
  reward: Reward
  kidPoints: number
}

export function RewardCard({ reward, kidPoints }: RewardCardProps) {
  const [isPending, startTransition] = useTransition()
  const canAfford = kidPoints >= reward.pointsCost

  function handleRedeem() {
    startTransition(async () => {
      await redeemReward(reward.id)
    })
  }

  return (
    <Card className={`overflow-hidden transition-all ${canAfford ? 'hover:shadow-lg' : 'opacity-60'}`}>
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-purple-100 rounded-full text-purple-600">
            <IconDisplay iconName={reward.icon} className="w-7 h-7" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-gray-800">{reward.name}</p>
            <Badge className="bg-purple-100 text-purple-700 mt-1">
              {reward.pointsCost} pts
            </Badge>
          </div>
        </div>

        <AlertDialog>
          <AlertDialogTrigger
            className={`w-full inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed ${
              canAfford
                ? 'bg-purple-600 hover:bg-purple-700 text-white'
                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
            }`}
            disabled={!canAfford || isPending}
          >
            {canAfford ? 'Redeem! 🎁' : `Need ${reward.pointsCost - kidPoints} more pts`}
          </AlertDialogTrigger>
          {canAfford && (
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Redeem {reward.name}?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will cost {reward.pointsCost} points. You have {kidPoints} points.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleRedeem}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  Redeem!
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          )}
        </AlertDialog>
      </CardContent>
    </Card>
  )
}
