'use client'

import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
} from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import type { ActivityLogEntry } from '@/lib/types'

const ACTION_LABELS: Record<ActivityLogEntry['actionType'], string> = {
  chore_completed: 'Chore Done ✓',
  chore_unchecked: 'Chore Unchecked',
  rest_day_purchased: 'Rest Day 🏖️',
  reward_redeemed: 'Reward Redeemed 🎁',
  day_ended: 'Day Ended 🌙',
  penalty_applied: 'Penalty Applied ⚠️',
  effort_awarded: 'Effort Reward 🌟',
  chore_assigned: 'Chore Assigned',
  chore_unassigned: 'Chore Unassigned',
  manual_adjustment: 'Manual Adjustment',
}

interface ActivityLogTableProps {
  entries: (ActivityLogEntry & { kidName?: string })[]
  familyId: string
}

const columnHelper = createColumnHelper<ActivityLogEntry & { kidName?: string }>()

const columns = [
  columnHelper.accessor('createdAt', {
    header: 'Date & Time',
    cell: (info) =>
      new Date(info.getValue()).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
  }),
  columnHelper.accessor('kidName', {
    header: 'Kid',
    cell: (info) => info.getValue() ?? '—',
  }),
  columnHelper.display({
    id: 'action',
    header: 'Action',
    cell: ({ row }) => {
      const actionType = row.original.actionType
      const metadata = row.original.metadata as Record<string, string> | null
      const reason = metadata?.reason
      return (
        <div>
          <Badge variant="outline" className="text-xs">
            {ACTION_LABELS[actionType] ?? actionType}
          </Badge>
          {actionType === 'manual_adjustment' && reason && (
            <p className="text-xs text-gray-500 mt-1">{reason}</p>
          )}
        </div>
      )
    },
  }),
  columnHelper.accessor('pointsDelta', {
    header: 'Points',
    cell: (info) => {
      const val = info.getValue()
      if (val === null || val === undefined) return '—'
      return (
        <span className={val > 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
          {val > 0 ? `+${val}` : val}
        </span>
      )
    },
  }),
]

export function ActivityLogTable({ entries, familyId }: ActivityLogTableProps) {
  const queryClient = useQueryClient()

  useEffect(() => {
    const supabase = createSupabaseBrowserClient()
    const channel = supabase
      .channel(`activity-log-${familyId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'activity_log', filter: `family_id=eq.${familyId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ['activity-log', familyId] })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [familyId, queryClient])

  const table = useReactTable({
    data: entries,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th key={header.id} className="px-4 py-3 text-left font-semibold text-gray-700">
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id} className="border-b hover:bg-gray-50">
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="px-4 py-3 text-gray-700">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {entries.length === 0 && (
        <p className="text-center py-8 text-gray-500">No activity yet.</p>
      )}
    </div>
  )
}
