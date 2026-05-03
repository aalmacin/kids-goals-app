# Server Action Contracts: Points Event Sourcing & Manual Adjustment

**Branch**: `002-points-event-sourcing` | **Date**: 2026-04-30

Changes and additions to the existing server action contracts. All other actions from `001-kids-goals-pwa/contracts/server-actions.md` remain unchanged unless noted.

---

## Kids (`lib/actions/kids.ts`) — new action

```ts
// Manually adjust a kid's points (parent only)
// delta: positive = add points, negative = subtract points
// reason: optional explanation stored in activity_log metadata
adjustKidPoints(kidId: string, delta: number, reason?: string): Promise<{ error?: string }>
```

**Auth**: Requires parent session. Verifies `kidId` belongs to the parent's family.
**Validation**: `delta` must be a non-zero integer. `reason` is optional free-text, max 500 chars.
**Effect**: Inserts one `activity_log` row with `action_type: 'manual_adjustment'`, `actor_type: 'parent'`, `points_delta: delta`. The DB trigger recalculates `kids.points`.

---

## Day Records (`lib/actions/day-records.ts`) — modified

`declareRestDay` and `endDay` are simplified: the `supabase.rpc('apply_points_delta', ...)` calls are removed. The `activity_log` insert is unchanged. The trigger handles the balance update.

Signatures are unchanged:

```ts
declareRestDay(dayRecordId: string): Promise<{ success?: true; error?: string }>
endDay(dayRecordId: string, effortLevelId?: string): Promise<{ success: true }>
```

---

## Rewards (`lib/actions/rewards.ts`) — modified

`redeemReward` is simplified: `supabase.rpc('apply_points_delta', ...)` call is removed. The `activity_log` insert is unchanged.

Signature is unchanged:

```ts
redeemReward(rewardId: string): Promise<{ success?: true; error?: string }>
```

---

## Removed

`apply_points_delta` Postgres RPC is dropped. No Server Action wraps it; it is no longer callable.
